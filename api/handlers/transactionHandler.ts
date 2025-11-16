import { query } from "../utils/db";
import { getAccount } from "./accountHandler";
import { validateDeposit, validateWithdrawal } from '../utils/transactions';
import { ITransActions, TransactionType } from "../model/transaction";

export const withdrawal = async (accountID: string, amount: number) => {
  try {
    await query('BEGIN');
    const account = await getAccount(accountID);

    const todaysWithdrawals = await getCurrDayTransactions(account.account_number, TransactionType.withdrawal);

    const validWithdrawal = validateWithdrawal(amount, account, todaysWithdrawals);

    if (validWithdrawal.valid) {
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

      recordTransaction(account.account_number, amount, TransactionType.withdrawal);
      await query('COMMIT');
      return account;
    }

    throw new Error(`Invalid withdrawal. ${validWithdrawal.msg}`);
  } catch (error) {
    await query('ROLLBACK');
    if (error instanceof Error) {
      console.error(`Account ID: ${accountID}. Error: ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }
};


export const deposit = async (accountID: string, amount: number) => {
  try {
    const account = await getAccount(accountID);
    const validDeposit = validateDeposit(amount, account);

    if (validDeposit.valid) {
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

    throw new Error(`Invalid deposit. ${validDeposit.msg}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Account ID: ${accountID}, Error: ${error.message}`);
      throw new Error(`${error.message}`);
    }
  }
};

export const recordTransaction = async (accountID: number, amount: number, transactionType: TransactionType) => {
  try {
    const sql = `
      INSERT INTO transactions (account_number, transaction_type, amount)
      VALUES($1, $2, $3)
    `;

    const res = await query(sql, [accountID, transactionType, amount]);

    if (res.rowCount === 0) {
      throw new Error("Transaction failed");
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error while recording transactions. Error: ${error.message}`);
    }
  }
};

export const getCurrDayTransactions = async (accountID: number, transactionType: TransactionType): Promise<ITransActions[]> => {
  const yesterday = new Date();
  const tomorrow = new Date();

  yesterday.setDate(yesterday.getDate() - 1);
  tomorrow.setDate(tomorrow.getDate() + 1);

  try {
    const sql = `
      SELECT *
      FROM transactions
      WHERE account_number = $1
      AND date(ts) = current_date
      AND transaction_type = $2
    `;

    const res = await query(sql, [accountID, transactionType]);
    return res.rows;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error fetching transaction history. Error: ${error.message}`);
    }
  }
  return [];
};