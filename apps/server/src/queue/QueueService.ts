import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeFiChainTransactionStatus, EthereumTransactionStatus, QueueStatus } from '@prisma/client';
import { EnvironmentNetwork } from '@waveshq/walletkit-core';
import BigNumber from 'bignumber.js';
import { BigNumber as EthBigNumber, ethers } from 'ethers';
import { BridgeV1, BridgeV1__factory, ERC20__factory } from 'smartcontracts';

import { EVMTransactionConfirmerService } from '../ethereum/services/EVMTransactionConfirmerService';
import { ETHERS_RPC_PROVIDER } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { getDTokenDetailsByWToken } from '../utils/TokensUtils';
import { VerifyQueueTransactionDto } from './QueueDto';

@Injectable()
export class QueueService {
  private contract: BridgeV1;

  private contractAddress: string;

  private network: EnvironmentNetwork;

  private readonly MIN_REQUIRED_EVM_CONFIRMATION = 65;

  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private configService: ConfigService,
    private readonly evmTransactionConfirmerService: EVMTransactionConfirmerService,
    private prisma: PrismaService,
  ) {
    this.network = this.configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
    this.contractAddress = this.configService.getOrThrow('ethereum.contracts.bridgeProxy.address');
    this.contract = BridgeV1__factory.connect(this.contractAddress, this.ethersRpcProvider);
  }

  async createQueueTransaction(transactionHash: string): Promise<string> {
    const isValidTxn = await this.evmTransactionConfirmerService.verifyIfValidTxn(transactionHash);

    const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);
    const onChainTxnDetail = await this.ethersRpcProvider.getTransaction(transactionHash);
    const parsedTxnData = await this.evmTransactionConfirmerService.parseTxnHash(transactionHash);
    const { params } = this.evmTransactionConfirmerService.decodeTxnData(parsedTxnData);
    const { _defiAddress: defiAddress, _tokenAddress: tokenAddress, _amount: amount } = params;

    const toAddress = ethers.utils.toUtf8String(defiAddress);

    let transferAmount = new BigNumber(0);
    let dTokenDetails;

    // eth transfer
    if (tokenAddress === ethers.constants.AddressZero) {
      const ethAmount = EthBigNumber.from(onChainTxnDetail.value).toString();
      transferAmount = new BigNumber(ethAmount).dividedBy(new BigNumber(10).pow(18));
      dTokenDetails = getDTokenDetailsByWToken('ETH', this.network);
    }
    // wToken transfer
    const evmTokenContract = new ethers.Contract(tokenAddress, ERC20__factory.abi, this.ethersRpcProvider);
    const wTokenSymbol = await evmTokenContract.symbol();
    const wTokenDecimals = await evmTokenContract.decimals();
    transferAmount = new BigNumber(amount).dividedBy(new BigNumber(10).pow(wTokenDecimals));
    dTokenDetails = getDTokenDetailsByWToken(wTokenSymbol, this.network);
    // expiry date
    const currentDate = new Date();
    const expiryDate = currentDate.setDate(currentDate.getDate() + 3);

    // if transaction is still pending
    if (txReceipt === null) {
      return `${transactionHash} is still pending`;
    }

    // Sanity check that the contractAddress, decoded name and signature are correct
    if (txReceipt.to !== this.contractAddress || !isValidTxn) {
      return `${txReceipt.to}, decoded name and signature is inaccurate`;
    }

    // if transaction is reverted
    const isReverted = txReceipt.status === 0;
    if (isReverted === true) {
      throw new BadRequestException(`Transaction Reverted`);
    }

    await this.prisma.ethereumQueue.create({
      data: {
        transactionHash,
        status: QueueStatus.DRAFT,
        ethereumStatus: EthereumTransactionStatus.NOT_CONFIRMED,
        amount: new BigNumber(transferAmount).toString(),
        defichainAddress: toAddress,
        expiryDate: new Date(expiryDate),
        tokenSymbol: dTokenDetails.symbol,
      },
    });
    return `Draft queue transaction created for ${transactionHash}`;
  }

  async verify(transactionHash: string): Promise<VerifyQueueTransactionDto> {
    const isValidTxn = await this.evmTransactionConfirmerService.verifyIfValidTxn(transactionHash);
    const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);

    // if transaction is still pending
    if (txReceipt === null) {
      return { numberOfConfirmations: 0, isConfirmed: false };
    }

    // Sanity check that the contractAddress, decoded name and signature are correct
    if (txReceipt.to !== this.contractAddress || !isValidTxn) {
      return { numberOfConfirmations: 0, isConfirmed: false };
    }

    // if transaction is reverted
    const isReverted = txReceipt.status === 0;
    if (isReverted === true) {
      throw new BadRequestException(`Transaction Reverted`);
    }

    const currentBlockNumber = await this.ethersRpcProvider.getBlockNumber();
    const numberOfConfirmations = BigNumber.max(currentBlockNumber - txReceipt.blockNumber, 0).toNumber();

    if (numberOfConfirmations < this.MIN_REQUIRED_EVM_CONFIRMATION) {
      return { numberOfConfirmations, isConfirmed: false };
    }

    if (numberOfConfirmations < this.MIN_REQUIRED_EVM_CONFIRMATION) {
      return { numberOfConfirmations, isConfirmed: false };
    }
    await this.prisma.ethereumQueue.update({
      where: {
        transactionHash,
      },
      data: {
        ethereumStatus: EthereumTransactionStatus.CONFIRMED,
        status: QueueStatus.IN_PROGRESS,
      },
    });

    await this.prisma.adminEthereumQueue.create({
      data: {
        queueTransactionHash: transactionHash,
        defichainStatus: DeFiChainTransactionStatus.NOT_CONFIRMED,
      },
    });

    return { numberOfConfirmations, isConfirmed: true };
  }
}
