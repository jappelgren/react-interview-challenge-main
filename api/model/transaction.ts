export interface IWithdrawlValidation {
  valid: boolean;
  msg: string;
}

export interface ITransActions {
  id: number;
  account_number: number;
  transaction_type: TransactionType;
  amount: number;
  ts: string;
}

export enum TransactionType {
  withdrawl = 'withdrawl',
  deposit = 'deposit'
}

