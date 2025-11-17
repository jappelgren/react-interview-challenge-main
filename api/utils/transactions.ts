import { AccountType, IAccount } from "../model/account";
import { ITransActions, ITransactionValidation } from "../model/transaction";

export const validateWithdrawal = (transactionAmount: number, account: IAccount, withdrawals: Array<ITransActions>): ITransactionValidation => {
  const { amount: curBalance, type: accType, credit_limit: creditLimit } = account;

  //withdrawal $200 or less
  if (transactionAmount > 200) {
    return { valid: false, msg: 'Withdrawals are limited to $200 per transaction.' };
  }

  //withdrawal in $5 increments
  if (transactionAmount % 5 > 0 || transactionAmount < 1) {
    return { valid: false, msg: 'This ATM can only accept withdrawals in $5 increments.' };
  }

  //no more than 4 withdrawals in a day
  if (withdrawals.length >= 4) {
    return { valid: false, msg: 'This account only allows 4 withdrawals a day.' };
  }

  //withdrawal does not exceed available balance: checking & savings
  if (transactionAmount > curBalance && (account.type === AccountType.checking || account.type === AccountType.savings)) {
    return { valid: false, msg: `Transaction exceeds available account balance of ${curBalance}.` };
  }

  //withdrawal does not exceed available balance: credit
  if (transactionAmount > curBalance && accType === AccountType.credit && creditLimit && curBalance + creditLimit < transactionAmount) {
    return { valid: false, msg: `Transaction exceeds current available credit of ${curBalance + creditLimit}.` };
  }

  return { valid: true, msg: "ok" };
};

export const validateDeposit = (transactionAmount: number, account: IAccount): ITransactionValidation => {
  //deposit is $1000 or less
  if (transactionAmount > 1000) {
    return { valid: false, msg: "Account deposits are capped at $1000 per transaction." };
  }

  //deposit to credit account does not bring balance above $0
  if (account.type === AccountType.credit && transactionAmount + account.amount > 0) {
    return { valid: false, msg: `ATM will only accept deposits at or below current negative balance of credit account. Current deposit exceeds that limit by ${transactionAmount + account.amount}.` };
  }

  return { valid: true, msg: "ok" };
};