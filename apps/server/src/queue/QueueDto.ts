export interface CreateQueueTransactionDto {
  result: string;
}

export interface VerifyQueueTransactionDto {
  numberOfConfirmations: number;
  isConfirmed: boolean;
}
