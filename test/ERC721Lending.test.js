const { constants: helperConstants } = require('@openzeppelin/test-helpers');
const { accounts, contract: contractLoader, web3 } = require('@openzeppelin/test-environment');

const ERC20Contract = contractLoader.fromArtifact('TestERC20');
const ERC721Contract = contractLoader.fromArtifact('TestERC721');
const ERC721Lending = contractLoader.fromArtifact('ERC721Lending');

const testTokenDecimals = 18;
const parseDecimalValue = (value) => web3.utils.toBN(value * ( 10 ** testTokenDecimals ));

describe('ERC721Lending', () => {
  // blockchain test setup
  const [ owner, lender, borrower ] = accounts;
  let erc20;
  let erc721;
  let lendingContract;

  // erc721 token
  const lendTokenName = 'lendTokenName';
  const lendTokenId = 123;
  const lendTokenUri = 'lendTokenUri';

  // erc20 token
  const borrowerTokenBalance = 15;

  // lend settings
  const lendDurationHours = 1;
  const lendInitialWorth = parseDecimalValue(2.7);
  const lendEarningGoal = parseDecimalValue(0.3);

  // default mocks
  const successfullyLendToken = async () => {
    await erc721.approve(lendingContract.address, lendTokenId, { from: lender });
    await lendingContract.setLendSettings(erc721.address, lendTokenId, lendDurationHours, lendInitialWorth, lendEarningGoal, { from: lender });
  };
  const successfullyBorrowToken = async () => {
    const collateralAmount = lendInitialWorth.add(lendEarningGoal);
    await erc20.approve(lendingContract.address, collateralAmount, { from: borrower });
    await lendingContract.startBorrowing(erc721.address, lendTokenId, { from: borrower })
  };

  beforeEach(async () => {
    // erc20 basic implementation to supply test borrower
    erc20 = await ERC20Contract.new({ from: owner });
    await erc20.mint(borrower, parseDecimalValue(borrowerTokenBalance), { from: owner });

    // erc20 basic implementation to supply test lender
    erc721 = await ERC721Contract.new({ from: owner });
    await erc721.mint(lender, lendTokenId, { from: owner });

    // lend721 smart contract
    lendingContract = await ERC721Lending.new({ from: owner });
    lendingContract.initialize(erc20.address, { from: owner });
  });

  it('test balances should be correct', async () => {
    const lentTokenOwner = await erc721.ownerOf(lendTokenId); // test lender setup
    const existingBorrowerTokenBalance = await erc20.balanceOf(borrower);  // test borrower setup
    const lendingContractPayTokenAddress = await lendingContract.acceptedPayTokenAddress();

    expect(lendingContractPayTokenAddress).toBe(erc20.address);
    expect(lentTokenOwner).toBe(lender);
    expect(parseDecimalValue(borrowerTokenBalance).eq(existingBorrowerTokenBalance)).toBe(true);
  });

  describe('setLendSettings()', () => {

    it('should throw empty duration message', async () => {
      const result = await lendingContract
        .setLendSettings(erc721.address, lendTokenId, 0, lendInitialWorth, lendEarningGoal, { from: lender })
        .catch((error) => error);

      expect(result).toBeInstanceOf(Error);
      expect(result.reason).toBe('Lending: Lending duration must be above 0');
    });

    it('should throw zero initial worth message', async () => {
      const result = await lendingContract
        .setLendSettings(erc721.address, lendTokenId, lendDurationHours, 0, lendEarningGoal, { from: lender })
        .catch((error) => error);

      expect(result).toBeInstanceOf(Error);
      expect(result.reason).toBe('Lending: Initial token worth must be above 0');
    });

    it('should throw zero earning goal message', async () => {
      const result = await lendingContract
        .setLendSettings(erc721.address, lendTokenId, lendDurationHours, lendInitialWorth, 0, { from: lender })
        .catch((error) => error);

      expect(result).toBeInstanceOf(Error);
      expect(result.reason).toBe('Lending: Earning goal must be above 0');
    });

    it('should throw token not approved message', async () => {
      const result = await lendingContract
        .setLendSettings(erc721.address, lendTokenId, lendDurationHours, lendInitialWorth, lendEarningGoal, { from: lender })
        .catch((error) => error);

      expect(result).toBeInstanceOf(Error);
      expect(result.reason).toBe('Lending: Token usage by smart contract needs to be approved');
    });

    it('should lend successfully and take token', async () => {
      await erc721.approve(lendingContract.address, lendTokenId, { from: lender });
      const approvedAddress = await erc721.getApproved(lendTokenId);
      const ownerOfToken = await erc721.ownerOf(lendTokenId);
      const result = await lendingContract
        .setLendSettings(erc721.address, lendTokenId, lendDurationHours, lendInitialWorth, lendEarningGoal, { from: lender })
        .catch((error) => error);
      const ownerOfTokenAfterLend = await erc721.ownerOf(lendTokenId);
      // const savedLendSettings = await lendingContract.lentERC721List(erc721.address, lendTokenId);
      // TODO: expect match settings
      expect(ownerOfToken).toBe(lender);
      expect(approvedAddress).toBe(lendingContract.address);
      expect(result).not.toBeInstanceOf(Error);
      expect(ownerOfTokenAfterLend).toBe(lendingContract.address);
    });
  });

  describe('removeFromLending()', () => {
    beforeEach(async () => {
      await successfullyLendToken();
    });

    it('should let cancel lending and return token', async () => {
      const ownerOfToken = await erc721.ownerOf(lendTokenId);
      const result = await lendingContract
        .removeFromLending(erc721.address, lendTokenId, { from: lender })
        .catch((error) => error);
      const ownerOfTokenAfterCancel = await erc721.ownerOf(lendTokenId);
      const approvedAddressAfterCancel = await erc721.getApproved(lendTokenId);

      expect(ownerOfToken).toBe(lendingContract.address);
      expect(result).not.toBeInstanceOf(Error);
      expect(ownerOfTokenAfterCancel).toBe(lender);
      expect(approvedAddressAfterCancel).toBe(helperConstants.ZERO_ADDRESS);
    });
  });

  describe('startBorrowing()', () => {
    beforeEach(async () => {
      await successfullyLendToken();
    });

    it('should throw not enough collateral message on zero collateral', async () => {
      const result = await lendingContract
        .startBorrowing(erc721.address, lendTokenId, { from: borrower })
        .catch((error) => error);

      expect(result).toBeInstanceOf(Error);
      expect(result.reason).toBe('Borrowing: Not enough collateral received');
    });

    it('should throw not enough collateral message on not enough collateral', async () => {
      await erc20.approve(lendingContract.address, parseDecimalValue(2.9));
      const result = await lendingContract
        .startBorrowing(erc721.address, lendTokenId, { from: borrower })
        .catch((error) => error);

      expect(result).toBeInstanceOf(Error);
      expect(result.reason).toBe('Borrowing: Not enough collateral received');
    });

    it('should successfully borrow and receive lent erc721 token', async () => {
      const collateralAmount = lendInitialWorth.add(lendEarningGoal);
      await erc20.approve(lendingContract.address, collateralAmount, { from: borrower });
      const borrowerAllowanceForLendingContract = await erc20.allowance(borrower, lendingContract.address);
      const result = await lendingContract
        .startBorrowing(erc721.address, lendTokenId, { from: borrower })
        .catch((error) => error);
      const ownerOfToken = await erc721.ownerOf(lendTokenId);

      expect(borrowerAllowanceForLendingContract.eq(collateralAmount)).toBeTruthy();
      expect(result).not.toBeInstanceOf(Error);
      expect(ownerOfToken).toBe(borrower);
    });
  });

  describe('claimBorrowerCollateral()', () => {
    beforeEach(async () => {
      await successfullyLendToken();
      await successfullyBorrowToken();
    });

    it('should successfully claim collateral', async () => {
      // const collateralAmount = lendInitialWorth.add(lendEarningGoal);
      // await erc20.approve(lendingContract.address, collateralAmount, { from: borrower });
      // const borrowerAllowanceForLendingContract = await erc20.allowance(borrower, lendingContract.address);
      const result = await lendingContract
        .claimBorrowerCollateral(erc721.address, lendTokenId, { from: lender })
        .catch((error) => error);
      console.log('result: ', result);
    });
  });
});
