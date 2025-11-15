import { AccountType, IAccount } from "../model/account"
import { ITransActions, IWithdrawlValidation } from "../model/transaction";

export const validateWithdrawl = (transactionAmount: number, account: IAccount, withdrawls: Array<ITransActions>): IWithdrawlValidation => {
  const { amount: curBalance, type: accType, credit_limit: creditLimit } = account;

  if (transactionAmount > 200) {
    return { valid: false, msg: 'Withdrawls are limited to $200 per transaction.' }
  }

  if (transactionAmount % 5 > 0) {
    return { valid: false, msg: 'ATM can only accept withdrawls which can be evenly dispersed in $5 bills.' }
  }

  if (transactionAmount > curBalance) {
    if (accType === AccountType.credit && creditLimit && curBalance + creditLimit >= transactionAmount) {
      return { valid: true, msg: "ok" }
    }
    return { valid: false, msg: `Transaction exceeds available ${accType === AccountType.credit ? 'credit limit' : 'account balance'} of ${AccountType.credit && creditLimit ? creditLimit + curBalance : curBalance}.` }
  }

  if (withdrawls.length >= 4) {
    return {valid: false, msg: 'This account only allows 4 withdrawls a day. Current withdrawl exceeds that limit.'}
  }

  return { valid: true, msg: "ok" }
} 