import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { SupportedEVMTokenSymbols } from '../../AppConfig';
import { PrismaService } from '../../PrismaService';
import { TransactionsDto, TransactionsQueryDto } from '../EthereumInterface';

@Injectable()
export class EthereumTransactionsService {
  constructor(private prisma: PrismaService) {}

  async getTransactions(
    fromDate: TransactionsQueryDto['fromDate'],
    toDate: TransactionsQueryDto['toDate'],
  ): Promise<TransactionsDto[]> {
    try {
      const dateFrom = new Date(fromDate);
      const dateTo = new Date(toDate);
      const today = new Date();

      if (dateFrom > today) {
        throw new BadRequestException(`Cannot query future date`);
      }

      if (dateFrom > dateTo) {
        throw new BadRequestException(`fromDate cannot be more recent than toDate`);
      }

      const transactions = await this.prisma.bridgeEventTransactions.findMany({
        where: {
          createdAt: {
            gte: dateFrom.toISOString(),
            lt: dateTo.toISOString(),
          },
        },
      });

      return transactions.map(
        (t) =>
          new TransactionsDto(
            t.transactionHash,
            t.tokenSymbol as SupportedEVMTokenSymbols,
            t.amount ?? '',
            t.createdAt.toISOString(),
          ),
      );
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
          error: `API call for Ethereum transactions was unsuccessful: ${e.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}
