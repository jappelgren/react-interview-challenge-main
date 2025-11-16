export interface IAccount {
  account_number: number;
  name: string;
  amount: number;
  type: AccountType;
  credit_limit?: number;
}

export enum AccountType {
  checking = 'checking',
  savings = 'savings',
  credit = 'credit'
};