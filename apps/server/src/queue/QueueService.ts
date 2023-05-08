import { fromAddress } from '@defichain/jellyfish-address';
import { WhaleWalletAccount } from '@defichain/whale-api-wallet';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DeFiChainTransactionStatus } from '@prisma/client';
import { EnvironmentNetwork, getJellyfishNetwork } from '@waveshq/walletkit-core';
import BigNumber from 'bignumber.js';
import { BigNumber as EthBigNumber, ethers } from 'ethers';
import { BridgeV1, BridgeV1__factory } from 'smartcontracts';

import { TokenSymbol, VerifyObject } from '../defichain/model/VerifyDto';
import { DeFiChainTransactionService } from '../defichain/services/DeFiChainTransactionService';
import { WhaleApiService } from '../defichain/services/WhaleApiService';
import { ContractType, VerificationService } from '../ethereum/services/VerificationService';
import { ETHERS_RPC_PROVIDER } from '../modules/EthersModule';
import { PrismaService } from '../PrismaService';
import { VerifyQueueTransactionDto } from './QueueDto';

@Injectable()
export class QueueService {
  private contract: BridgeV1;

  private contractAddress: string;

  private network: EnvironmentNetwork;

  private readonly MIN_REQUIRED_DFC_CONFIRMATION = 35;

  constructor(
    @Inject(ETHERS_RPC_PROVIDER) readonly ethersRpcProvider: ethers.providers.StaticJsonRpcProvider,
    private configService: ConfigService,
    private readonly deFiChainTransactionService: DeFiChainTransactionService,
    private verficationService: VerificationService,
    private readonly whaleClient: WhaleApiService,
    private prisma: PrismaService,
  ) {
    this.network = this.configService.getOrThrow<EnvironmentNetwork>(`defichain.network`);
    this.contractAddress = this.configService.getOrThrow('ethereum.contracts.queueBridgeProxy.address');
    this.contract = BridgeV1__factory.connect(this.contractAddress, this.ethersRpcProvider);
  }

  // transactionHash is sendTransactionHash from the frontend
  async defichainQueueVerify(transactionHash: string): Promise<any> {
    // to be updated

    const client = this.whaleClient.getClient();
    const txnDetails = await client.transactions.get(transactionHash);

    console.log('txnDetails', txnDetails);

    return txnDetails;

    // try {
    //   await this.prisma.$transaction(async (prisma) => {
    //     // verify txn exist and get hotWwallet address from DB
    //     const txHashFound = await prisma.adminEthereumQueue.findFirst({
    //       where: {
    //         queueTransactionHash: transactionHash,
    //       },
    //     });

    //     const client = this.whaleClient.getClient();
    //     const txnDetails = await client.transactions.get(transactionHash);

    //     // verify the txn is valid
    //     const wallet = txHashFound?.hotWalletAddress;
    //     const txInfo = await this.getDfcTxnConfirmations(wallet, txnDetails);

    //     // Verify if the address is valid
    //     const { isAddressValid } = this.verifyValidAddress(wallet, this.network);
    //     if (!isAddressValid) {
    //       return false;
    //     }

    //     // Verify if amount > 0
    //     if (new BigNumber(verify.amount).isLessThanOrEqualTo(0)) {
    //       return { isValid: false, statusCode: CustomErrorCodes.AmountNotValid };
    //     }

    //     if (txHashFound) {
    //       // check if its more than 35, if yes then update defiChainstatus

    //       if (txHashFound.defichainStatus === DeFiChainTransactionStatus.NOT_CONFIRMED) {
    //         const { numberOfConfirmations } = await this.deFiChainTransactionService.getTxn(transactionHash);

    //         if (numberOfConfirmations < this.MIN_REQUIRED_DFC_CONFIRMATION) {
    //           return { numberOfConfirmations, isConfirmed: false };
    //         }

    //         await prisma.adminEthereumQueue.update({
    //           where: {
    //             queueTransactionHash: transactionHash,
    //           },
    //           data: {
    //             defichainStatus: DeFiChainTransactionStatus.CONFIRMED,
    //           },
    //         });
    //       } else {
    //         throw new Error('Error: Transaction already confirmed'); // TODO: Update this placeholder error message
    //       }
    //     }
    //   });
    // } catch (e: any) {
    //   throw new HttpException(
    //     {
    //       status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
    //       error: `API call for verify was unsuccessful: ${e.message}`,
    //     },
    //     HttpStatus.INTERNAL_SERVER_ERROR,
    //     {
    //       cause: e,
    //     },
    //   );
    // }
  }

  private verifyValidAddress(address: string, network: EnvironmentNetwork): { isAddressValid: boolean } {
    const decodedAddress = fromAddress(address, getJellyfishNetwork(network).name);
    return { isAddressValid: decodedAddress !== undefined };
  }

  private async validateBlockTxn(wallet: WhaleWalletAccount, verify: VerifyObject) {
    const txInfo = await this.getDfcTxnConfirmations(wallet, verify);

    // Verify that user sent one transaction with exact amount needed
    if (txInfo === undefined) {
      return false;
    }
    const { numberOfConfirmations } = txInfo;

    if (numberOfConfirmations < this.MIN_REQUIRED_DFC_CONFIRMATION) {
      // Verify that required number of confirmation block is reached
      return false;
    }
    return true;
  }

  private async getDfcTxnConfirmations(
    wallet: WhaleWalletAccount,
    verify: VerifyObject,
  ): Promise<{ numberOfConfirmations: number } | undefined> {
    try {
      const dfiTokenTxns = await wallet.client.address.listTransaction(verify.address);
      const otherTokensTxns = await wallet.client.address.listAccountHistory(verify.address);

      let txid: string;
      if (verify.symbol === TokenSymbol.DFI && dfiTokenTxns.length > 0) {
        // Find DFI txn with exact amount
        const transaction = dfiTokenTxns.find((tx) => verify.amount.isEqualTo(tx.value));
        if (transaction === undefined) {
          throw new Error(`No txn found with same amount needed (${verify.symbol}).`);
        }
        txid = transaction.txid;
      } else {
        // Find non-DFI token txn with exact amount
        const transaction = otherTokensTxns.find((tx) => {
          const txAmountSymbol = tx.amounts[0]?.split('@');
          const tokenSymbol = txAmountSymbol[1];
          return verify.amount.isEqualTo(txAmountSymbol[0]) && verify.symbol === tokenSymbol;
        });
        if (transaction === undefined) {
          throw new Error(`No txn found with same amount needed (${verify.symbol}).`);
        }
        txid = transaction.txid;
      }

      const { numberOfConfirmations } = await this.deFiChainTransactionService.getTxn(txid);

      return { numberOfConfirmations };
    } catch (e: any) {
      return undefined;
    }
  }
}
