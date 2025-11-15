export interface IAccount {
  account_number: number;
  name: string;
  amount: number;
  type: ACC_TYPE;
  credit_limit?: number;
}

export enum ACC_TYPE {
  checking = 'checking',
  savings = 'savings',
  credit = 'credit'
}