import { query } from "../utils/db";
import { getAccount } from "./accountHandler";
import { validateWithdrawl } from '../utils/transactions'
import { ITransActions, TransactionType } from "../model/transaction";

export const withdrawal = async (accountID: string, amount: number) => {
  try {
    await query('BEGIN')
    const account = await getAccount(accountID);
    
    const todaysWithdrawls = await getCurrDayTransactions(account.account_number, TransactionType.withdrawl)
    const validWithdrawl = validateWithdrawl(amount, account, todaysWithdrawls)
    
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

      recordTransaction(account.account_number, amount, TransactionType.withdrawl)
      await query('COMMIT')
      return account;
    }

    throw new Error(`Invalid withdrawl. Reason: ${validWithdrawl.msg}`)
  } catch (error) {
    await query('ROLLBACK')
    if (error instanceof Error) {
      console.error(error.message)
      throw new Error(`Error while withdrawing funds. Error: ${error.message}`)
    }
  }
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

export const recordTransaction = async (accountID: number, amount: number, transactionType: TransactionType) => {
  try {
    const sql = `
      INSERT INTO transactions (account_number, transaction_type, amount)
      VALUES($1, $2, $3)
    `;

    const res = await query(sql, [accountID, transactionType, amount])

    if (res.rowCount === 0) {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error while recording transactions. Error: ${error.message}`)
    }
  }
}

export const getCurrDayTransactions = async (accountID: number, transactionType: TransactionType): Promise<ITransActions[]> => {
  const yesterday = new Date();
  const tomorrow = new Date();

  yesterday.setDate(yesterday.getDate() - 1)
  tomorrow.setDate(tomorrow.getDate() + 1)

  try {
    const sql = `
      SELECT *
      FROM transactions
      WHERE account_number = $1
      AND ts > date('${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}')
      AND ts < date('${tomorrow.getFullYear()}-${tomorrow.getMonth() + 1}-${tomorrow.getDate()}')
      AND transaction_type = $2
    `;

    const res = await query(sql, [accountID, transactionType]);
    return res.rows
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching transaction history. Error: ${error.message}`)
    }
  }
  return [];
}