pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";

contract Sablier {
  function createSalary(address recipient, uint256 deposit, address tokenAddress, uint256 startTime, uint256 stopTime) public returns(uint256);
  function cancelSalary(uint256 salaryId) public returns (bool);
  function getSalary(uint256 salaryId) public view returns (
    address company,
    address employee,
    uint256 salary,
    address tokenAddress,
    uint256 startTime,
    uint256 stopTime,
    uint256 remainingBalance,
    uint256 rate
  );
}

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
    uint256 sablierSalaryId;
    uint256 platformFeesPercent;
  }

  // V1 mapping
  mapping(address => mapping(uint256 => ERC721ForLend)) public lentERC721List;

  struct ERC721TokenEntry {
    address lenderAddress;
    address tokenAddress;
    uint256 tokenId;
  }

  ERC721TokenEntry[] public lendersWithTokens;

  event ERC721ForLendUpdated(address tokenAddress, uint256 tokenId);
  event ERC721ForLendRemoved(address tokenAddress, uint256 tokenId);

  address public sablierContractAddress;

  // V2, token address -> token id -> owner (lender) address -> lending details
  mapping(address => mapping(uint256 => mapping(address => ERC721ForLend))) public lendingPool;

  // Note: version helper for migrations
  uint256 migrateVersion;

  address public feesContractAddress;

  event ERC721ForLendUpdatedV2(address lenderAddress, address tokenAddress, uint256 tokenId);
  event ERC721ForLendRemovedV2(address lenderAddress, address tokenAddress, uint256 tokenId);

  function initialize(address tokenAddress) public initializer {
    acceptedPayTokenAddress = tokenAddress;
  }

  function setSablierContractAddress(address contractAddress) public {
    require(sablierContractAddress == address(0), 'Sablier contract address already set');
    sablierContractAddress = contractAddress;
  }

  function setFeesContractAddress(address contractAddress) public {
    require(feesContractAddress == address(0), 'Fees contract address already set');
    feesContractAddress = contractAddress;
  }

  function setLendSettings(address tokenAddress, uint256 tokenId, uint256 durationHours, uint256 initialWorth, uint256 earningGoal) public {
    require(initialWorth > 0, 'Lending: Initial token worth must be above 0');
    require(earningGoal > 0, 'Lending: Earning goal must be above 0');
    require(durationHours > 0, 'Lending: Lending duration must be above 0');
    require(lentERC721List[tokenAddress][tokenId].borrower == address(0), 'Lending: Cannot change settings, token already lent');
    require(lentERC721List[tokenAddress][tokenId].lenderClaimedCollateral == false, 'Lending: Collateral already claimed');

    // assuming token transfer is approved
    IERC721(tokenAddress).transferFrom(msg.sender, address(this), tokenId);

    lentERC721List[tokenAddress][tokenId] = ERC721ForLend(durationHours, initialWorth, earningGoal, 0, msg.sender, address(0), false, 0, 0);

    lendersWithTokens.push(ERC721TokenEntry(msg.sender, tokenAddress, tokenId));

    emit ERC721ForLendUpdated(tokenAddress, tokenId);
  }

  function startBorrowing(address tokenAddress, uint256 tokenId) public {
    require(lentERC721List[tokenAddress][tokenId].borrower == address(0), 'Borrowing: Already lent');
    require(lentERC721List[tokenAddress][tokenId].earningGoal > 0, 'Borrowing: Lender did not set earning goal yet');
    require(lentERC721List[tokenAddress][tokenId].initialWorth > 0, 'Borrowing: Lender did not set initial worth yet');

    IERC20 _payToken = IERC20(acceptedPayTokenAddress);
    uint256 _requiredSum = calculateLendSum(tokenAddress, tokenId);
    uint256 _allowedCollateral = _payToken.allowance(msg.sender, address(this));
    require(_allowedCollateral >= _requiredSum, 'Borrowing: Not enough collateral received');

    IERC20(acceptedPayTokenAddress).transferFrom(msg.sender, address(this), _requiredSum);

    // check if needs approval as some tokens fail due this
    (bool success,) = tokenAddress.call(abi.encodeWithSignature(
        "approve(address,uint256)",
        address(this),
        tokenId
      ));
    if (success) {
      IERC721(tokenAddress).approve(address(this), tokenId);
    }
    IERC721(tokenAddress).transferFrom(address(this), msg.sender, tokenId);

    lentERC721List[tokenAddress][tokenId].borrower = msg.sender;
    lentERC721List[tokenAddress][tokenId].borrowedAtTimestamp = now;

    // check if sablier address set and setup salary
    createSalaryIfPossible(tokenAddress, tokenId);

    emit ERC721ForLendUpdated(tokenAddress, tokenId);
  }

  function stopBorrowing(address tokenAddress, uint256 tokenId) public {
    address _borrower = lentERC721List[tokenAddress][tokenId].borrower;
    require(_borrower == msg.sender, 'Borrowing: Can be stopped only by active borrower');

    if (lentERC721List[tokenAddress][tokenId].lenderClaimedCollateral == false) {
      // assuming token transfer is approved
      IERC721(tokenAddress).transferFrom(msg.sender, address(this), tokenId);

      uint256 _initialWorth = lentERC721List[tokenAddress][tokenId].initialWorth;

      IERC20(acceptedPayTokenAddress).transfer(_borrower, _initialWorth);

      lentERC721List[tokenAddress][tokenId].borrower = address(0);
      lentERC721List[tokenAddress][tokenId].borrowedAtTimestamp = 0;

      address lenderAddress = lentERC721List[tokenAddress][tokenId].lender;

      uint256 _sablierSalaryId = lentERC721List[tokenAddress][tokenId].sablierSalaryId;
      if (_sablierSalaryId != 0) {
        // get balance that is not streamed during period, it will be returned to borrower
        (
        ,
        ,
        uint256 _streamSalaryAmount,
        ,
        uint256 _streamStartTime,
        uint256 _streamStopTime,
        ,
        uint256 _streamRatePerSecond
        ) = Sablier(sablierContractAddress).getSalary(_sablierSalaryId);

        int256 _balanceNotStreamed = 0;
        if (now < _streamStopTime) {
          _balanceNotStreamed = int256(_streamSalaryAmount) - int256(SafeMath.mul(now - _streamStartTime, _streamRatePerSecond));
        }

        // cancel salary to lender if sablier salary exists
        Sablier(sablierContractAddress).cancelSalary(_sablierSalaryId);
        lentERC721List[tokenAddress][tokenId].sablierSalaryId = 0;

        // check if lending entry has fees
        uint256 _platformFeeToCollect = 0;
        uint256 _feesPercent = lentERC721List[tokenAddress][tokenId].platformFeesPercent;
        if (_feesPercent > 0) {
          _platformFeeToCollect = SafeMath.mul(SafeMath.div(_streamSalaryAmount, 100), _feesPercent);
        }

        if (_balanceNotStreamed > 0) {
          // check if lending has fees
          if (_platformFeeToCollect > 0) {
            // lending did not go through full period, fees percent will be lower, lets refund to lender
            uint256 _actualSalaryLenderReceives = SafeMath.sub(_streamSalaryAmount, uint256(_balanceNotStreamed));
            uint256 _platformFeeToCollectUpdated = SafeMath.mul(SafeMath.div(_actualSalaryLenderReceives, 100), _feesPercent);
            uint256 _platformFeeToRefund = SafeMath.sub(_platformFeeToCollect, _platformFeeToCollectUpdated);
            _platformFeeToCollect =_platformFeeToCollectUpdated;
            IERC20(acceptedPayTokenAddress).transfer(lenderAddress, uint256(_platformFeeToRefund));
          }

          // return unstreamed balance to borrower
          IERC20(acceptedPayTokenAddress).transfer(_borrower, uint256(_balanceNotStreamed));
        }

        // check if fees collecting address set and lending has fees
        if (feesContractAddress != address(0) && _platformFeeToCollect > 0) {
          IERC20(acceptedPayTokenAddress).transfer(feesContractAddress, _platformFeeToCollect);
        }
      } else {
        // legacy: send lender his interest
        uint256 _earningGoal = lentERC721List[tokenAddress][tokenId].earningGoal;
        IERC20(acceptedPayTokenAddress).transfer(lenderAddress, _earningGoal);
      }
    } else {
      // lender claimed collateral, this is borrower's last call, let's reset everything
      lentERC721List[tokenAddress][tokenId] = ERC721ForLend(0, 0, 0, 0, address(0), address(0), false, 0, 0); // reset details
    }

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

  function createSalaryIfPossible(address tokenAddress, uint256 tokenId) internal {
    if (sablierContractAddress != address(0)) {
      uint256 _salaryStartTime = now + 60;
      uint256 _salaryStopTime = _salaryStartTime + (lentERC721List[tokenAddress][tokenId].durationHours * 3600);
      uint256 _actualSalaryAmount = lentERC721List[tokenAddress][tokenId].earningGoal;

      // set platform fees percent for borrowed entry
      // v1.1
//      uint256 _feesPercent = 5;
//      lentERC721List[tokenAddress][tokenId].platformFeesPercent = _feesPercent;

      // reserve fees percent from salary
//      uint256 _actualSalaryAmountAfterPlatformFees = SafeMath.sub(
//        _actualSalaryAmount,
//        SafeMath.mul(SafeMath.div(_actualSalaryAmount, 100), _feesPercent)
//      );

      // per Sablier docs – deposit amount must be divided by the time delta
      // and then the remainder subtracted from the initial deposit number
      uint256 _timeDelta = _salaryStopTime - _salaryStartTime;
      uint256 _salaryAmount = _actualSalaryAmount - (_actualSalaryAmount % _timeDelta);

      // approve amount for Sablier contract usage
      IERC20(acceptedPayTokenAddress).approve(sablierContractAddress, _salaryAmount);

      // the salary id is needed later to withdraw from or cancel the salary
      uint256 _sablierSalaryId = Sablier(sablierContractAddress).createSalary(
        lentERC721List[tokenAddress][tokenId].lender,
        _salaryAmount,
        acceptedPayTokenAddress,
        _salaryStartTime,
        _salaryStopTime
      );

      lentERC721List[tokenAddress][tokenId].sablierSalaryId = _sablierSalaryId;
    }
  }

  function removeFromLending(address tokenAddress, uint256 tokenId) public {
    require(lentERC721List[tokenAddress][tokenId].lender == msg.sender, 'Claim: Cannot claim not owned lend');

    require(lentERC721List[tokenAddress][tokenId].borrower == address(0), 'Lending: Cannot cancel if lent');
    require(lentERC721List[tokenAddress][tokenId].lenderClaimedCollateral == false, 'Lending: Collateral claimed');

    // check if needs approval as some tokens fail due this
    (bool success,) = tokenAddress.call(abi.encodeWithSignature(
        "approve(address,uint256)",
        address(this),
        tokenId
      ));
    if (success) {
      IERC721(tokenAddress).approve(address(this), tokenId);
    }
    IERC721(tokenAddress).transferFrom(address(this), msg.sender, tokenId);

    lentERC721List[tokenAddress][tokenId] = ERC721ForLend(0, 0, 0, 0, address(0), address(0), false, 0, 0); // reset details

    // reset lenders to sent token mapping, swap with last element to fill the gap
    removeFromLendersWithTokens(tokenAddress, tokenId);

    emit ERC721ForLendRemoved(tokenAddress, tokenId);
  }

  function claimBorrowerCollateral(address tokenAddress, uint256 tokenId) public {
    require(lentERC721List[tokenAddress][tokenId].borrower != address(0), 'Claim: Cannot claim if stopped');
    require(lentERC721List[tokenAddress][tokenId].lender == msg.sender, 'Claim: Cannot claim not owned lend');

    uint256 _borrowedAtTimestamp = lentERC721List[tokenAddress][tokenId].borrowedAtTimestamp;
    uint256 _durationHours = lentERC721List[tokenAddress][tokenId].durationHours;
    require(isDurationExpired(_borrowedAtTimestamp, _durationHours), 'Claim: Cannot claim before lending expired');

    require(lentERC721List[tokenAddress][tokenId].lenderClaimedCollateral == false, 'Claim: Already claimed');

    lentERC721List[tokenAddress][tokenId].lenderClaimedCollateral = true;

    uint256 _sablierSalaryId = lentERC721List[tokenAddress][tokenId].sablierSalaryId;
    if (_sablierSalaryId != 0) {
      // get salary amount to send to fees collector address
      (,, uint256 _streamSalaryAmount,,,,,) = Sablier(sablierContractAddress).getSalary(_sablierSalaryId);

      // if salary exists cancel salary and send only initial worth collateral amount
      IERC20(acceptedPayTokenAddress).transfer(msg.sender, lentERC721List[tokenAddress][tokenId].initialWorth);
      Sablier(sablierContractAddress).cancelSalary(_sablierSalaryId);
      lentERC721List[tokenAddress][tokenId].sablierSalaryId = 0;

      // check if lending entry has fees
      uint256 _feesPercent = lentERC721List[tokenAddress][tokenId].platformFeesPercent;
      if (feesContractAddress != address(0) && _feesPercent > 0) {
        // send collected fees to collecting contract address
        uint256 _platformFeeToCollect = SafeMath.mul(SafeMath.div(_streamSalaryAmount, 100), _feesPercent);
        IERC20(acceptedPayTokenAddress).transfer(feesContractAddress, _platformFeeToCollect);
      }
    } else {
      // legacy: send interest and collateral sum amount
      uint256 _collateralSum = calculateLendSum(tokenAddress, tokenId);
      IERC20(acceptedPayTokenAddress).transfer(msg.sender, _collateralSum);
    }

    // reset lenders to sent token mapping, swap with last element to fill the gap
    removeFromLendersWithTokens(tokenAddress, tokenId);

    emit ERC721ForLendUpdated(tokenAddress, tokenId);
  }

  function isValidNFT(address tokenAddress, uint256 tokenId) public view returns(bool) {
    // no owner is most likely burnt NFT
    return IERC721(tokenAddress).ownerOf(tokenId) != address(0);
  }
}
