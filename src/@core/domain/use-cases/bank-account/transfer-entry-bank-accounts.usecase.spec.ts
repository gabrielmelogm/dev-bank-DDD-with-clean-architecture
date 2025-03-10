import { BankAccountTypeOrmRepository } from 'src/@core/infra/db/implements/bank-account-typeorm.repository';
import { BankAccountSchema } from 'src/@core/infra/db/schemas/bank-account.schema';
import { DataSource, Repository } from 'typeorm';
import { FindBankAccountByAccountNumberUseCase } from './find-bank-account-by-account-number.usecase';
import { UpdateBalanceBankAccountUseCase } from './update-balance-bank-account.usecase';
import { TransferAmountEntryAccountsUseCase } from '../transfer/transfer-amount-entry-accounts.usecase';
import { UserSchema } from 'src/@core/infra/db/schemas/user.schema';
import { BankAccount } from '../../entities/bank-account';
import { TransferEntryBankAccountsUseCase } from './transfer-entry-bank-accounts.usecase';

describe('TransferEntryBankAccountsUseCase Test', () => {
  let dataSource: DataSource;
  let ormRepo: Repository<BankAccountSchema>;
  let repository: BankAccountTypeOrmRepository;
  let transferEntryBankAccountsUseCase: TransferEntryBankAccountsUseCase;
  let transferAmountEntryAccountsUseCase: TransferAmountEntryAccountsUseCase;
  let findBankAccountByAccountNumberUseCase: FindBankAccountByAccountNumberUseCase;
  let updateBalanceBankAccountUseCase: UpdateBalanceBankAccountUseCase;

  beforeEach(async () => {
    dataSource = new DataSource({
      type: 'sqlite',
      database: ':memory:',
      synchronize: true,
      logging: false,
      entities: [BankAccountSchema, UserSchema],
    });
    await dataSource.initialize();
    ormRepo = dataSource.getRepository(BankAccountSchema);
    repository = new BankAccountTypeOrmRepository(ormRepo);

    transferAmountEntryAccountsUseCase =
      new TransferAmountEntryAccountsUseCase();

    findBankAccountByAccountNumberUseCase =
      new FindBankAccountByAccountNumberUseCase(repository);

    updateBalanceBankAccountUseCase = new UpdateBalanceBankAccountUseCase(
      repository,
      findBankAccountByAccountNumberUseCase,
    );

    transferEntryBankAccountsUseCase = new TransferEntryBankAccountsUseCase(
      transferAmountEntryAccountsUseCase,
      findBankAccountByAccountNumberUseCase,
      updateBalanceBankAccountUseCase,
    );
  });

  it('should be transfer an amount from an account to other account', async () => {
    const bankAccountSrc = new BankAccount({
      balance: 150,
      account_number: '1111-11',
    });

    const bankAccountDest = new BankAccount({
      balance: 150,
      account_number: '2222-22',
    });

    await repository.insert(bankAccountSrc);
    await repository.insert(bankAccountDest);

    await transferEntryBankAccountsUseCase.handle(
      bankAccountSrc.account_number,
      bankAccountDest.account_number,
      50,
    );

    const bankAccountSrcUpdated =
      await findBankAccountByAccountNumberUseCase.handle(
        bankAccountSrc.account_number,
      );
    const bankAccountDestUpdated =
      await findBankAccountByAccountNumberUseCase.handle(
        bankAccountDest.account_number,
      );

    expect(bankAccountSrcUpdated.balance).toBe(100);
    expect(bankAccountDestUpdated.balance).toBe(200);
  });
});
