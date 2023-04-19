import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { EthereumOrderTable } from '@prisma/client';

import { PrismaService } from '../../PrismaService';

// services to insert data, where the logic lies
// calls controller via endpoint, then controller calls service and then insert into the DB

@Injectable()
export class EthereumOrderBookService {
  constructor(private prisma: PrismaService) {}

  async insertOrderBook(order: EthereumOrderTable) {
    try {
      const orderBook = await this.prisma.ethereumOrderTable.create({
        data: {
          ...order,
        },
      });
      // to display id as string in Postman
      return { ...orderBook, id: orderBook.id.toString() };
    } catch (e: any) {
      throw new HttpException(
        {
          status: e.code || HttpStatus.INTERNAL_SERVER_ERROR,
          error: `API call for Ethereum orderbook: ${e.message}`,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
        {
          cause: e,
        },
      );
    }
  }
}
