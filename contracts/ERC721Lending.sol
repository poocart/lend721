pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/IERC721.sol";

contract ERC721Lending is Initializable {
  address public acceptedPayTokenAddress;

  struct ERC721ForLend {
    uint256 durationHours;
    uint256 initialWorth;
    uint256 earningGoal;
    uint256 borrowedAtTimestamp;
    address lender;
    address borrower;
    bool lenderClaimedCollateral;
  }

  mapping(address => mapping(uint256 => ERC721ForLend)) public lentERC721List;

  struct ERC721TokenEntry {
    address lenderAddress;
    address tokenAddress;
    uint256 tokenId;
  }

  ERC721TokenEntry[] public lendersWithTokens;

  event ERC721ForLendUpdated(address tokenAddress, uint256 tokenId);
  event ERC721ForLendRemoved(address tokenAddress, uint256 tokenId);

  function initialize(address tokenAddress) initializer public {
    acceptedPayTokenAddress = tokenAddress;
  }

  function setLendSettings(address tokenAddress, uint256 tokenId, uint256 durationHours, uint256 initialWorth, uint256 earningGoal) public {
    require(initialWorth > 0, 'Lending: Initial token worth must be above 0');
    require(earningGoal > 0, 'Lending: Earning goal must be above 0');
    require(durationHours > 0, 'Lending: Lending duration must be above 0');
    require(lentERC721List[tokenAddress][tokenId].borrower == address(0), 'Lending: Cannot change settings, token already lent');
    require(IERC721(tokenAddress).getApproved(tokenId) == address(this), 'Lending: Token usage by smart contract needs to be approved');
    require(lentERC721List[tokenAddress][tokenId].lenderClaimedCollateral == false, 'Lending: Collateral already claimed');

    IERC721(tokenAddress).transferFrom(msg.sender, address(this), tokenId);

    lentERC721List[tokenAddress][tokenId] = ERC721ForLend(durationHours, initialWorth, earningGoal, 0, msg.sender, address(0), false);
    lendersWithTokens.push(ERC721TokenEntry(msg.sender, tokenAddress, tokenId));

    emit ERC721ForLendUpdated(tokenAddress, tokenId);
  }

  function startBorrowing(address tokenAddress, uint256 tokenId) public {
    require(lentERC721List[tokenAddress][tokenId].borrower == address(0), 'Borrowing: Already lent');
    require(lentERC721List[tokenAddress][tokenId].earningGoal > 0, 'Borrowing: Lender did not set earning goal yet');
    require(lentERC721List[tokenAddress][tokenId].initialWorth > 0, 'Borrowing: Lender did not set initial worth yet');

    uint256 _requiredSum = calculateLendSum(tokenAddress, tokenId);
    uint256 _allowedCollateral = IERC20(acceptedPayTokenAddress).allowance(msg.sender, address(this));
    require(_allowedCollateral >= _requiredSum, 'Borrowing: Not enough collateral received');

    IERC20(acceptedPayTokenAddress).transferFrom(msg.sender, address(this), _requiredSum);
    IERC721(tokenAddress).transferFrom(address(this), msg.sender, tokenId);
    lentERC721List[tokenAddress][tokenId].borrower = msg.sender;
    lentERC721List[tokenAddress][tokenId].borrowedAtTimestamp = now;

    emit ERC721ForLendUpdated(tokenAddress, tokenId);
  }

  function stopBorrowing(address tokenAddress, uint256 tokenId) public {
    address _borrower = lentERC721List[tokenAddress][tokenId].borrower;
    require(_borrower == msg.sender, 'Borrowing: Can be stopped only by active borrower');
    require(IERC721(tokenAddress).getApproved(tokenId) == address(this), 'Borrowing: Token transfer needs to be approved');
    require(lentERC721List[tokenAddress][tokenId].lenderClaimedCollateral == false, 'Borrowing: Too late, lender claimed collateral');

    IERC721(tokenAddress).transferFrom(msg.sender, address(this), tokenId);

    uint256 _initialWorth = lentERC721List[tokenAddress][tokenId].initialWorth;

    IERC20(acceptedPayTokenAddress).transfer(_borrower, _initialWorth);

    lentERC721List[tokenAddress][tokenId].borrower = address(0);
    lentERC721List[tokenAddress][tokenId].borrowedAtTimestamp = 0;

    address _lender = lentERC721List[tokenAddress][tokenId].lender;
    uint256 _earningGoal = lentERC721List[tokenAddress][tokenId].earningGoal;

    IERC20(acceptedPayTokenAddress).transfer(_lender, _earningGoal);

    emit ERC721ForLendUpdated(tokenAddress, tokenId);
  }

  function calculateLendSum(address tokenAddress, uint256 tokenId) public view returns(uint256) {
    uint256 _earningGoal = lentERC721List[tokenAddress][tokenId].earningGoal;
    uint256 _initialWorth = lentERC721List[tokenAddress][tokenId].initialWorth;
    return _initialWorth + _earningGoal;
  }

  function isDurationExpired(uint256 borrowedAtTimestamp, uint256 durationHours) public view returns(bool) {
    uint256 secondsPassed = now - borrowedAtTimestamp;
    uint256 hoursPassed = secondsPassed * 60 * 60;
    return hoursPassed > durationHours;
  }

  function removeFromLendersWithTokens(address tokenAddress, uint256 tokenId) internal {
    // reset lenders to sent token mapping, swap with last element to fill the gap
    uint totalCount = lendersWithTokens.length;
    if (totalCount > 1) {
      for (uint i = 0; i<totalCount; i++) {
        ERC721TokenEntry memory tokenEntry = lendersWithTokens[i];
        if (tokenEntry.lenderAddress == msg.sender && tokenEntry.tokenAddress == tokenAddress && tokenEntry.tokenId == tokenId) {
          lendersWithTokens[i] = lendersWithTokens[totalCount-1]; // insert last from array
        }
      }
      lendersWithTokens.length--;
    } else {
      delete lendersWithTokens[0];
    }
  }

  function removeFromLending(address tokenAddress, uint256 tokenId) public {
    require(lentERC721List[tokenAddress][tokenId].borrower == address(0), 'Lending: Cannot cancel if in lend');
    require(lentERC721List[tokenAddress][tokenId].lender == msg.sender, 'Lending: Cannot cancel if not owned');
    require(lentERC721List[tokenAddress][tokenId].lenderClaimedCollateral == false, 'Lending: Collateral claimed');
    IERC721(tokenAddress).transferFrom(address(this), msg.sender, tokenId);
    lentERC721List[tokenAddress][tokenId] = ERC721ForLend(0, 0, 0, 0, address(0), address(0), false); // reset lend mappings

    // reset lenders to sent token mapping, swap with last element to fill the gap
    removeFromLendersWithTokens(tokenAddress, tokenId);

    emit ERC721ForLendRemoved(tokenAddress, tokenId);
  }

  function claimBorrowerCollateral(address tokenAddress, uint256 tokenId) public {
    uint256 _borrowedAtTimestamp = lentERC721List[tokenAddress][tokenId].borrowedAtTimestamp;
    uint256 _durationHours = lentERC721List[tokenAddress][tokenId].durationHours;
    require(isDurationExpired(_borrowedAtTimestamp, _durationHours), 'Claim: Cannot claim before lend expired');
    require(lentERC721List[tokenAddress][tokenId].lender == msg.sender, 'Claim: Cannot claim not owned lend');
    require(lentERC721List[tokenAddress][tokenId].lenderClaimedCollateral == false, 'Claim: Already claimed');

    lentERC721List[tokenAddress][tokenId].lenderClaimedCollateral = true;

    // reset lenders to sent token mapping, swap with last element to fill the gap
    removeFromLendersWithTokens(tokenAddress, tokenId);

    uint256 _collateralSum = calculateLendSum(tokenAddress, tokenId);
    IERC20(acceptedPayTokenAddress).transfer(msg.sender, _collateralSum);

    emit ERC721ForLendUpdated(tokenAddress, tokenId);
  }
}
