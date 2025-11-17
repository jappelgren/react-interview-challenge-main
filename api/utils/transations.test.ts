import { validateDeposit, validateWithdrawal } from './transactions';
import { AccountType, IAccount } from '../model/account';
import { ITransActions, TransactionType } from '../model/transaction';

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

describe('validateWithdrawal', () => {

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
      expect(result.msg).toBe('Transaction exceeds current available credit of 150.');
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

describe('validateDeposit', () => {
  describe('deposit amount validation', () => {
    it('should reject deposits over $1000', () => {
      const account = createAccount();
      const result = validateDeposit(1001, account);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('Account deposits are capped at $1000 per transaction.');
    });

    it('should accept deposits exactly at $1000', () => {
      const account = createAccount();
      const result = validateDeposit(1000, account);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should accept deposits under $1000', () => {
      const account = createAccount();
      const result = validateDeposit(999, account);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });
  });

  describe('checking & savings account deposits', () => {
    it('should accept any valid deposit amount to checking account', () => {
      const account = createAccount({
        type: AccountType.checking,
        amount: 100
      });
      const result = validateDeposit(500, account);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should accept any valid deposit amount to savings account', () => {
      const account = createAccount({
        type: AccountType.savings,
        amount: 5000
      });
      const result = validateDeposit(750, account);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });
  });

  describe('credit account deposits', () => {
    it('should accept deposit that brings balance exactly to $0', () => {
      const account = createAccount({
        type: AccountType.credit,
        amount: -500,
        credit_limit: 5000
      });
      const result = validateDeposit(500, account);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should accept deposit that keeps balance negative', () => {
      const account = createAccount({
        type: AccountType.credit,
        amount: -800,
        credit_limit: 5000
      });
      const result = validateDeposit(200, account);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should reject deposit that would bring balance above $0', () => {
      const account = createAccount({
        type: AccountType.credit,
        amount: -300,
        credit_limit: 5000
      });
      const result = validateDeposit(400, account);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe(
        'ATM will only accept deposits at or below current negative balance of credit account. Current deposit exceeds that limit by 100.'
      );
    });
  });
});