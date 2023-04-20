import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// import { DeFiChainTransactionStatus, EthereumTransactionStatus, OrderStatus } from '@prisma/client';
import BigNumber from 'bignumber.js';
import { ethers } from 'ethers';
import { BridgeV1__factory } from 'smartcontracts';

import { ETHERS_RPC_PROVIDER } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { VerifyOrderTransaction } from './OrderInterface';

@Injectable()
export class OrderService {
  private contractAddress: string;

  private readonly MIN_REQUIRED_EVM_CONFIRMATION = 65;

  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.contractAddress = this.configService.getOrThrow('ethereum.contracts.bridgeProxy.address');
  }

  async createOrder(transactionHash: string): Promise<string> {
    const isValidTxn = await this.verifyIfValidTxn(transactionHash);
    const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);

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

    // const currentBlockNumber = await this.ethersRpcProvider.getBlockNumber();
    // const numberOfConfirmations = BigNumber.max(currentBlockNumber - txReceipt.blockNumber, 0).toNumber();
    // const txHashFound = await this.prisma.EthereumOrders.findFirst({
    //   where: {
    //     transactionHash,
    //   },
    // });
    const txHashFound = null;
    if (txHashFound === null) {
      // await this.prisma.EthereumOrders.create({
      //     data: {
      //         transactionHash,
      //         status: OrderStatus.DRAFT
      //         ethereumStatus: EthereumTransactionStatus.NOT_CONFIRMED,
      //     },
      //     });
      return `Draft order created for ${transactionHash}`;
    }

    // await this.prisma.EthereumOrders.update({
    //     where: {
    //       id: txHashFound?.id,
    //     },
    //     data: {
    //       status: OrderStatus.DRAFT
    //     },
    //   });
    return `Draft order updated for ${transactionHash}`;
  }

  async verify(transactionHash: string): Promise<VerifyOrderTransaction> {
    const isValidTxn = await this.verifyIfValidTxn(transactionHash);
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
    // await this.prisma.EthereumOrders.update({
    //   where: {
    //     id: txHashFound?.id,
    //   },
    //   data: {
    //     status: EthereumTransactionStatus.CONFIRMED,
    //   },
    // });
    return { numberOfConfirmations, isConfirmed: true };
  }

  private async verifyIfValidTxn(transactionHash: string): Promise<boolean> {
    const { parsedTxnData } = await this.parseTxnHash(transactionHash);
    // Sanity check that the decoded function name and signature are correct
    if (
      parsedTxnData.name !== 'bridgeToDeFiChain' ||
      parsedTxnData.signature !== 'bridgeToDeFiChain(bytes,address,uint256)'
    ) {
      return false;
    }

    // TODO: Validate the txns event logs here through this.ethersRpcProvider.getLogs()

    return true;
  }

  private async parseTxnHash(transactionHash: string): Promise<{
    etherInterface: ethers.utils.Interface;
    parsedTxnData: ethers.utils.TransactionDescription;
  }> {
    const onChainTxnDetail = await this.ethersRpcProvider.getTransaction(transactionHash);
    const etherInterface = new ethers.utils.Interface(BridgeV1__factory.abi);
    const parsedTxnData = etherInterface.parseTransaction({
      data: onChainTxnDetail.data,
      value: onChainTxnDetail.value,
    });

    return { etherInterface, parsedTxnData };
  }
}
