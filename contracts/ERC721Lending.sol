pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts/ownership/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

// 0xc3dbf84abb494ce5199d5d4d815b10ec29529ff8 DAI ERC20 in Rinkeby testnet

contract ERC721Lending is Initializable, Ownable {
  struct ERC721ForLend {
    uint256 durationHours;
    uint256 initialWorth;
    uint256 earningGoal;
    uint256 borrowedAtTimestamp;
    address lender;
    address borrower;
  }

  address public acceptedPayTokenAddress;
  mapping(address => mapping(uint256 => ERC721ForLend)) public lentERC721List;

  function initialize(address tokenAddress) initializer onlyOwner public {
    acceptedPayTokenAddress = tokenAddress;
  }

  function setLendSettings(address tokenAddress, uint256 tokenId, uint256 durationHours, uint256 initialWorth, uint256 earningGoal) public {
    require(initialWorth > 0, 'Lending: Initial token worth must be above 0');
    require(earningGoal > 0, 'Lending: Earning goal must be above 0');
    require(durationHours > 0, 'Lending: Lending duration must be above 0');
    require(lentERC721List[tokenAddress][tokenId].borrower == address(0), 'Lending: Cannot change settings, token already lent');
    require(IERC721(tokenAddress).getApproved(tokenId) == address(this), 'Lending: Token usage by smart contract needs to be approved');

    IERC721(tokenAddress).transferFrom(msg.sender, address(this), tokenId);
    lentERC721List[tokenAddress][tokenId] = ERC721ForLend(durationHours, initialWorth, earningGoal, 0, msg.sender, address(0));
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
  }

  function stopBorrowing(address tokenAddress, uint256 tokenId) public {
    // TODO: check if time is not yet expired and prevent from stopping if so
    address _borrower = lentERC721List[tokenAddress][tokenId].borrower;
    require(_borrower == msg.sender, 'Borrowing: Can be stopped only by borrower');
    require(IERC721(tokenAddress).getApproved(tokenId) == address(this), 'Borrowing: Token transfer needs to be approved');

    IERC721(tokenAddress).transferFrom(msg.sender, address(this), tokenId);

    uint256 _borrowedAtTimestamp = lentERC721List[tokenAddress][tokenId].borrowedAtTimestamp;
    uint256 _initialWorth = lentERC721List[tokenAddress][tokenId].initialWorth;

    IERC20(acceptedPayTokenAddress).transfer(_borrower, _initialWorth);

    lentERC721List[tokenAddress][tokenId].borrower = address(0);
    lentERC721List[tokenAddress][tokenId].borrowedAtTimestamp = 0;

    address _lender = lentERC721List[tokenAddress][tokenId].lender;
    uint256 _earningGoal = lentERC721List[tokenAddress][tokenId].earningGoal;

    IERC20(acceptedPayTokenAddress).transfer(_lender, _earningGoal);
  }

  function calculateLendSum(address tokenAddress, uint256 tokenId) public view returns(uint256) {
    uint256 _earningGoal = lentERC721List[tokenAddress][tokenId].earningGoal;
    uint256 _initialWorth = lentERC721List[tokenAddress][tokenId].initialWorth;
    return _initialWorth + _earningGoal;
  }

  function cancelLending(address tokenAddress, uint256 tokenId) public {
    require(lentERC721List[tokenAddress][tokenId].borrower == address(0), 'Lending: Cannot cancel if in lend');
    require(lentERC721List[tokenAddress][tokenId].lender == msg.sender, 'Lending: Cannot cancel if not owned');
    IERC721(tokenAddress).transferFrom(address(this), msg.sender, tokenId);
    lentERC721List[tokenAddress][tokenId] = ERC721ForLend(0, 0, 0, 0, address(0), address(0)); // reset
  }

  function claimExpiredBorrow(address tokenAddress, uint256 tokenId) public {
    // TODO: check if borrow expired and lender is available to take collateral + interest
  }
}
