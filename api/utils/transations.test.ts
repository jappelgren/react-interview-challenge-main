import { validateWithdrawal } from './transactions';
import { AccountType, IAccount } from '../model/account';
import { ITransActions, TransactionType } from '../model/transaction';

describe('validateWithdrawal', () => {
  const createAccount = (overrides?: Partial<IAccount>): IAccount => ({
    account_number: 12345,
    name: 'Test User',
    amount: 500,
    type: AccountType.checking,
    ...overrides,
  });

  const createTransaction = (overrides?: Partial<ITransActions>): ITransActions => ({
    id: 1,
    account_number: 12345,
    transaction_type: TransactionType.withdrawal,
    amount: 50,
    ts: new Date().toISOString(),
    ...overrides,
  });

  describe('Transaction amount validation', () => {
    it('should reject withdrawals over $200', () => {
      const account = createAccount();
      const result = validateWithdrawal(201, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('Withdrawals are limited to $200 per transaction.');
    });

    it('should accept withdrawals of exactly $200', () => {
      const account = createAccount({ amount: 200 });
      const result = validateWithdrawal(200, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should reject withdrawals not in $5 increments', () => {
      const account = createAccount();
      const result = validateWithdrawal(23, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('This ATM can only accept withdrawals in $5 increments.');
    });

    it('should accept withdrawals in $5 increments', () => {
      const account = createAccount();
      const result = validateWithdrawal(50, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should reject $0 withdrawals (not a $5 increment)', () => {
      const account = createAccount();
      const result = validateWithdrawal(0, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('This ATM can only accept withdrawals in $5 increments.');
    });
  });

  describe('Balance validation for checking accounts & savings', () => {
    it('should reject withdrawals exceeding balance', () => {
      const account = createAccount({ amount: 100, type: AccountType.checking });
      const result = validateWithdrawal(150, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('Transaction exceeds available account balance of 100.');
    });

    it('should accept withdrawals equal to balance', () => {
      const account = createAccount({ amount: 100 });
      const result = validateWithdrawal(100, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should accept withdrawals less than balance', () => {
      const account = createAccount({ amount: 100 });
      const result = validateWithdrawal(50, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should reject withdrawals exceeding balance', () => {
      const account = createAccount({ amount: 100, type: AccountType.savings });
      const result = validateWithdrawal(150, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('Transaction exceeds available account balance of 100.');
    });

    it('should accept valid withdrawals from savings', () => {
      const account = createAccount({ amount: 200, type: AccountType.savings });
      const result = validateWithdrawal(50, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });
  });

  describe('Credit account validation', () => {
    it('should accept withdrawals within credit limit when balance is exceeded', () => {
      const account = createAccount({
        amount: 50,
        type: AccountType.credit,
        credit_limit: 200,
      });
      const result = validateWithdrawal(100, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should reject withdrawals exceeding balance + credit limit', () => {
      const account = createAccount({
        amount: -50,
        type: AccountType.credit,
        credit_limit: 200,
      });
      const result = validateWithdrawal(200, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('Transaction exceeds available credit limit of 150.');
    });

    it('should accept withdrawals equal to balance + credit limit', () => {
      const account = createAccount({
        amount: 50,
        type: AccountType.credit,
        credit_limit: 150,
      });
      const result = validateWithdrawal(200, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });
  });

  describe('Daily withdrawal limit validation', () => {
    it('should reject 5th withdrawal in a day', () => {
      const account = createAccount();
      const withdrawals = [
        createTransaction({ id: 1 }),
        createTransaction({ id: 2 }),
        createTransaction({ id: 3 }),
        createTransaction({ id: 4 }),
      ];
      const result = validateWithdrawal(50, account, withdrawals);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('This account only allows 4 withdrawals a day.');
    });

    it('should accept first withdrawal with empty transaction history', () => {
      const account = createAccount();
      const result = validateWithdrawal(50, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });
  });
});