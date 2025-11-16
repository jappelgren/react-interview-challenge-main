import { validateWithdrawl } from './transactions';
import { AccountType, IAccount } from '../model/account';
import { ITransActions, TransactionType } from '../model/transaction';

describe('validateWithdrawl', () => {
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
    transaction_type: TransactionType.withdrawl,
    amount: 50,
    ts: new Date().toISOString(),
    ...overrides,
  });

  describe('Transaction amount validation', () => {
    it('should reject withdrawls over $200', () => {
      const account = createAccount();
      const result = validateWithdrawl(201, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('Withdrawls are limited to $200 per transaction.');
    });

    it('should accept withdrawls of exactly $200', () => {
      const account = createAccount({ amount: 200 });
      const result = validateWithdrawl(200, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should reject withdrawls not in $5 increments', () => {
      const account = createAccount();
      const result = validateWithdrawl(23, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('This ATM can only accept withdrawls in $5 increments.');
    });

    it('should accept withdrawls in $5 increments', () => {
      const account = createAccount();
      const result = validateWithdrawl(50, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should reject $0 withdrawls (not a $5 increment)', () => {
      const account = createAccount();
      const result = validateWithdrawl(0, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('This ATM can only accept withdrawls in $5 increments.');
    });
  });

  describe('Balance validation for checking accounts & savings', () => {
    it('should reject withdrawls exceeding balance', () => {
      const account = createAccount({ amount: 100, type: AccountType.checking });
      const result = validateWithdrawl(150, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('Transaction exceeds available account balance of 100.');
    });

    it('should accept withdrawls equal to balance', () => {
      const account = createAccount({ amount: 100 });
      const result = validateWithdrawl(100, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should accept withdrawls less than balance', () => {
      const account = createAccount({ amount: 100 });
      const result = validateWithdrawl(50, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should reject withdrawls exceeding balance', () => {
      const account = createAccount({ amount: 100, type: AccountType.savings });
      const result = validateWithdrawl(150, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('Transaction exceeds available account balance of 100.');
    });

    it('should accept valid withdrawls from savings', () => {
      const account = createAccount({ amount: 200, type: AccountType.savings });
      const result = validateWithdrawl(50, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });
  });

  describe('Credit account validation', () => {
    it('should accept withdrawls within credit limit when balance is exceeded', () => {
      const account = createAccount({
        amount: 50,
        type: AccountType.credit,
        credit_limit: 200,
      });
      const result = validateWithdrawl(100, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });

    it('should reject withdrawls exceeding balance + credit limit', () => {
      const account = createAccount({
        amount: -50,
        type: AccountType.credit,
        credit_limit: 200,
      });
      const result = validateWithdrawl(200, account, []);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('Transaction exceeds available credit limit of 150.');
    });

    it('should accept withdrawls equal to balance + credit limit', () => {
      const account = createAccount({
        amount: 50,
        type: AccountType.credit,
        credit_limit: 150,
      });
      const result = validateWithdrawl(200, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });
  });
  
  describe('Daily withdrawl limit validation', () => {
    it('should reject 5th withdrawl in a day', () => {
      const account = createAccount();
      const withdrawls = [
        createTransaction({ id: 1 }),
        createTransaction({ id: 2 }),
        createTransaction({ id: 3 }),
        createTransaction({ id: 4 }),
      ];
      const result = validateWithdrawl(50, account, withdrawls);

      expect(result.valid).toBe(false);
      expect(result.msg).toBe('This account only allows 4 withdrawls a day.');
    });

    it('should accept first withdrawl with empty transaction history', () => {
      const account = createAccount();
      const result = validateWithdrawl(50, account, []);

      expect(result.valid).toBe(true);
      expect(result.msg).toBe('ok');
    });
  });
})