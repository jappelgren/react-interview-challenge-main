export interface ITransactionValidation {
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
  withdrawal = 'withdrawal',
  deposit = 'deposit'
}

