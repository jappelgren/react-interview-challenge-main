import { AccountType, IAccount } from "../model/account";
import { ITransActions, ITransactionValidation } from "../model/transaction";

export const validateWithdrawal = (transactionAmount: number, account: IAccount, withdrawals: Array<ITransActions>): ITransactionValidation => {
  const { amount: curBalance, type: accType, credit_limit: creditLimit } = account;

  if (transactionAmount > 200) {
    return { valid: false, msg: 'Withdrawals are limited to $200 per transaction.' };
  }

  if (transactionAmount % 5 > 0 || transactionAmount < 1) {
    return { valid: false, msg: 'This ATM can only accept withdrawals in $5 increments.' };
  }

  if (transactionAmount > curBalance) {
    if (accType === AccountType.credit && creditLimit && curBalance + creditLimit >= transactionAmount) {
      return { valid: true, msg: "ok" };
    }
    return { valid: false, msg: `Transaction exceeds available ${accType === AccountType.credit ? 'credit limit' : 'account balance'} of ${AccountType.credit && creditLimit ? creditLimit + curBalance : curBalance}.` };
  }

  if (withdrawals.length >= 4) {
    return { valid: false, msg: 'This account only allows 4 withdrawals a day.' };
  }

  return { valid: true, msg: "ok" };
};

export const validateDeposit = (transactionAmount: number, account: IAccount): ITransactionValidation => {
  if (transactionAmount > 1000) {
    return { valid: false, msg: "Account deposits are capped at $1000 per transaction." };
  }

  if (account.type === AccountType.credit && transactionAmount + account.amount > 0) {
    return { valid: false, msg: `ATM will only accept deposits at or below current negative balance of credit account. Current deposit exceeds that limit by ${transactionAmount + account.amount}.` };
  }

  return { valid: true, msg: "ok" };
};