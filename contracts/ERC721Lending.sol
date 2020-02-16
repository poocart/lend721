pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/ERC721Full.sol";

contract ERC721Lending is Initializable {
  struct ERC721ForLend {
    uint256 durationMilliseconds;
    uint256 initialWorth;
    uint256 interest;
    address lender;
    address borrower;
  }

  address public acceptedPayTokenAddress;
  mapping(address => mapping(uint256 => ERC721ForLend)) public lentERC721List;

  function initialize() initializer public {
    acceptedPayTokenAddress = address(0x26b4AFb60d6C903165150C6F0AA14F8016bE4aec);
  }

  function lendForTime(address tokenAddress, uint256 tokenId, uint256 durationMilliseconds, uint256 initialWorth, uint256 interest) public {
    require(initialWorth > 0, 'Lending: Initial token worth must be above 0');
    require(interest > 0, 'Lending: Interest percentage must be above 0');
    require(lentERC721List[tokenAddress][tokenId].borrower == address(0), 'Lending: Already lent');
    require(ERC721Full(tokenAddress).getApproved(tokenId) == address(this), 'Lending: Token transfer needs to be approved');

    ERC721Full(tokenAddress).transferFrom(msg.sender, address(this), tokenId);
    lentERC721List[tokenAddress][tokenId] = ERC721ForLend(durationMilliseconds, initialWorth, interest, msg.sender, address(0));
  }

  function startBorrowing(address tokenAddress, uint256 tokenId) public {
    require(lentERC721List[tokenAddress][tokenId].borrower == address(0), 'Borrowing: Already lent');
    require(lentERC721List[tokenAddress][tokenId].interest > 0, 'Borrowing: Lender did not set interest yet');
    require(lentERC721List[tokenAddress][tokenId].initialWorth > 0, 'Borrowing: Lender did not set initial worth yet');

    uint256 _requiredSum = calculateLendSum(tokenAddress, tokenId);
    require(ERC20Detailed(acceptedPayTokenAddress).allowance(msg.sender, address(this)) >= _requiredSum, 'Borrowing: Not enough collateral paid');

    ERC721Full(tokenAddress).transferFrom(address(this), msg.sender, tokenId);
    ERC20Detailed(acceptedPayTokenAddress).transferFrom(msg.sender, address(this), _requiredSum);
    lentERC721List[tokenAddress][tokenId].borrower = msg.sender;
  }

  function stopBorrowing(address tokenAddress, uint256 tokenId) public {
    // TODO: check if time is not yet expired and prevent from stopping if so
    require(ERC721Full(tokenAddress).getApproved(tokenId) == address(this), 'Borrowing: Token transfer needs to be approved');

    ERC721Full(tokenAddress).transferFrom(msg.sender, address(this), tokenId);

    address _borrower = lentERC721List[tokenAddress][tokenId].borrower;
    uint256 _initialWorth = lentERC721List[tokenAddress][tokenId].initialWorth;
    ERC20Detailed(acceptedPayTokenAddress).transfer(_borrower, _initialWorth);
    lentERC721List[tokenAddress][tokenId].borrower = address(0);

    address _lender = lentERC721List[tokenAddress][tokenId].lender;
    uint256 _interest = calculateLendInterest(tokenAddress, tokenId);
    ERC20Detailed(acceptedPayTokenAddress).transfer(_lender, _interest);
  }

  function calculateLendInterest(address tokenAddress, uint256 tokenId) public view returns(uint256) {
    uint256 _initialWorth = lentERC721List[tokenAddress][tokenId].initialWorth;
    return _initialWorth / 100  * lentERC721List[tokenAddress][tokenId].interest;
  }

  function calculateLendSum(address tokenAddress, uint256 tokenId) public view returns(uint256) {
    uint256 _interest = calculateLendInterest(tokenAddress, tokenId);
    return lentERC721List[tokenAddress][tokenId].initialWorth + _interest;
  }

  function cancelLending(address tokenAddress, uint256 tokenId) public {
    require(lentERC721List[tokenAddress][tokenId].borrower == address(0), 'Lending: Cannot cancel if in lend');
    require(lentERC721List[tokenAddress][tokenId].lender == msg.sender, 'Lending: Cannot cancel if not owned');
    ERC721Full(tokenAddress).transferFrom(address(this), msg.sender, tokenId);
    lentERC721List[tokenAddress][tokenId] = ERC721ForLend(0, 0, 0, address(0), address(0)); // reset
  }

  function claimExpiredBorrow(address tokenAddress, uint256 tokenId) public {
    // TODO: check if borrow expired and lender is available to take collateral + interest
  }
}
