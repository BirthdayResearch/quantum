import { BadRequestException, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, ethers } from 'ethers';
import { BridgeV1__factory } from 'smartcontracts';

import { ETHERS_RPC_PROVIDER } from '../../modules/EthersModule';
import { PrismaService } from '../../PrismaService';
import { getNextDayTimestamp } from '../../utils/DateUtils';

@Injectable()
export class EVMTransactionConfirmerService {
  private contract: Contract;

  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.contract = new ethers.Contract(
      this.configService.getOrThrow('ethereum.contracts.bridgeProxy.address'),
      BridgeV1__factory.abi,
      this.ethersRpcProvider,
    );
  }

  async handleTransaction(transactionHash: string): Promise<HandledEVMTransaction> {
    const txReceipt = await this.ethersRpcProvider.getTransactionReceipt(transactionHash);
    const isReverted = txReceipt.status === 0;
    if (isReverted === true) {
      throw new BadRequestException(`Transaction Reverted`);
    }
    const currentBlockNumber = await this.ethersRpcProvider.getBlockNumber();
    const numberOfConfirmations = currentBlockNumber - txReceipt.blockNumber;
    const txHashFound = await this.prisma.bridgeEventTransactions.findFirst({
      where: {
        transactionHash,
      },
    });
    if (txHashFound === null) {
      if (numberOfConfirmations < 65) {
        await this.prisma.bridgeEventTransactions.create({
          data: {
            transactionHash,
            status: 'NOT_CONFIRMED',
          },
        });
        return { numberOfConfirmations, isConfirmed: false };
      }
      await this.prisma.bridgeEventTransactions.create({
        data: {
          transactionHash,
          status: 'CONFIRMED',
        },
      });
      return { numberOfConfirmations, isConfirmed: true };
    }
    if (numberOfConfirmations < 65) {
      return { numberOfConfirmations, isConfirmed: false };
    }
    await this.prisma.bridgeEventTransactions.update({
      where: {
        id: txHashFound?.id,
      },
      data: {
        status: 'CONFIRMED',
      },
    });
    return { numberOfConfirmations, isConfirmed: true };
  }

  async signClaim({
    receiverAddress,
    tokenAddress,
    amount,
  }: SignClaim): Promise<{ signature: string; nonce: number; deadline: number }> {
    try {
      // Connect signer ETH wallet (admin/operational wallet)
      const wallet = new ethers.Wallet(
        this.configService.getOrThrow('ethereum.ethWalletPrivKey'),
        this.ethersRpcProvider,
      );

      const { chainId } = await this.ethersRpcProvider.getNetwork();
      const nonce = await this.contract.eoaAddressToNonce(receiverAddress);
      const domainName = await this.contract.name();
      const domainVersion = await this.contract.version();
      const deadline = getNextDayTimestamp();

      const domain = {
        name: domainName,
        chainId,
        verifyingContract: this.contract.address,
        version: domainVersion,
      };
      const types = {
        CLAIM: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' },
          { name: 'tokenAddress', type: 'address' },
        ],
      };
      const data = {
        to: receiverAddress,
        amount: ethers.utils.parseEther(amount),
        nonce,
        deadline,
        tokenAddress,
      };

      // eslint-disable-next-line no-underscore-dangle
      const signature = await wallet._signTypedData(domain, types, data);
      return { signature, nonce, deadline };
    } catch (e: any) {
      throw new HttpException(
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          error: 'There is a problem in signing this claim',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}

interface SignClaim {
  receiverAddress: string;
  tokenAddress: string;
  amount: string;
}

export interface HandledEVMTransaction {
  numberOfConfirmations: number;
  isConfirmed: boolean;
}
