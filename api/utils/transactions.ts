import { ACC_TYPE, IAccount } from "../model/account"
import { IWithdrawlValidation } from "../model/transaction";

export const validateWithdrawl = (transactionAmount: number, account: IAccount): IWithdrawlValidation => {
  const { amount: curBalance, type: accType, credit_limit: creditLimit } = account;

  if (transactionAmount > 200) {
    return { valid: false, msg: 'Withdrawls are limited to $200 per transaction.' }
  }

  if (transactionAmount % 5 > 0) {
    return { valid: false, msg: 'ATM can only accept withdrawls which can be evenly dispersed in $5 bills.' }
  }

  if (transactionAmount > curBalance) {
    if (accType === ACC_TYPE.credit && creditLimit && curBalance + creditLimit >= transactionAmount) {
      return { valid: true, msg: "ok" }
    }
    return { valid: false, msg: `Transaction exceeds available ${accType === ACC_TYPE.credit ? 'credit limit' : 'account balance'} of ${ACC_TYPE.credit && creditLimit ? creditLimit + curBalance : curBalance}.` }
  }

  return { valid: true, msg: "ok" }
} 