import { IAccount } from "../model/account";
import { query } from "../utils/db";
import { getAccount } from "./accountHandler";
import { validateWithdrawl } from '../utils/transactions'

export const withdrawal = async (accountID: string, amount: number) => {
  let account: IAccount;

  try {
    account = await getAccount(accountID);
  } catch (error) {
    console.error(error)
    throw new Error(`Error retreiving account. Error: ${JSON.stringify(error)}`);
  }
  const validWithdrawl = validateWithdrawl(amount, account)
  if (validWithdrawl.valid) {
    account.amount -= amount;
    const res = await query(`
      UPDATE accounts
      SET amount = $1 
      WHERE account_number = $2`,
      [account.amount, accountID]
    );

    if (res.rowCount === 0) {
      throw new Error("Transaction failed");
    }
    console.log(validWithdrawl.msg);
    return account;
  }
  console.log(validWithdrawl.msg);
  return account;

}

export const deposit = async (accountID: string, amount: number) => {
  const account = await getAccount(accountID);
  account.amount += amount;
  const res = await query(`
    UPDATE accounts
    SET amount = $1 
    WHERE account_number = $2`,
    [account.amount, accountID]
  );

  if (res.rowCount === 0) {
    throw new Error("Transaction failed");
  }

  return account;
}