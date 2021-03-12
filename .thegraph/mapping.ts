import { store, log, ethereum } from '@graphprotocol/graph-ts';

import {
  ERC721ForLendUpdated,
  ERC721ForLendRemoved,
  LEND721,
  LEND721__lentERC721ListResult
} from './generated/LEND721/LEND721';
import { ERC721ForLend } from './generated/schema';
import { PreSablierLEND721 } from "./generated/LEND721/PreSablierLEND721";
import { PreFeesLEND721 } from "./generated/LEND721/PreFeesLEND721";

export function handleERC721ForLendUpdated(event: ERC721ForLendUpdated): void {
  let tokenAddress = event.params.tokenAddress;
  let tokenId = event.params.tokenId;

  let entryId = tokenAddress.toHex() + '-' + tokenId.toHex();
  let lendEntry = ERC721ForLend.load(entryId);
  if (lendEntry == null) {
    lendEntry = new ERC721ForLend(entryId);
  }

  let contract = LEND721.bind(event.address);

  // try latest first
  let lendEntryResult = contract.try_lentERC721List(tokenAddress, tokenId);

  // if reverted try with pre Sablier contract call
  if (lendEntryResult.reverted) {
    let legacyContract = PreSablierLEND721.bind(event.address);
    lendEntryResult = legacyContract.try_lentERC721List(tokenAddress, tokenId) as ethereum.CallResult<LEND721__lentERC721ListResult>;
  }

  // if reverted try with pre fees contract call
  if (lendEntryResult.reverted) {
    let legacyContract = PreFeesLEND721.bind(event.address);
    lendEntryResult = legacyContract.try_lentERC721List(tokenAddress, tokenId) as ethereum.CallResult<LEND721__lentERC721ListResult>;
  }

  if (!lendEntryResult.reverted) {
    let lentEntryValue = lendEntryResult.value;

    lendEntry.durationHours = lentEntryValue.value0;
    lendEntry.initialWorth = lentEntryValue.value1;
    lendEntry.earningGoal = lentEntryValue.value2;
    lendEntry.borrowedAtTimestamp = lentEntryValue.value3;
    lendEntry.lender = lentEntryValue.value4;
    lendEntry.borrower = lentEntryValue.value5;
    lendEntry.lenderClaimedCollateral = lentEntryValue.value6;
    lendEntry.tokenAddress = event.params.tokenAddress;
    lendEntry.tokenId = event.params.tokenId;

    // sablierStreamId is optional
    if (!lentEntryValue.value7 || lentEntryValue.value7.isZero()) {
      lendEntry.sablierStreamId = null;
    } else {
      lendEntry.sablierStreamId = lentEntryValue.value7;
    }

    lendEntry.save()
  } else {
    log.warning(
        'ERC721ForLend received reverted for ' + entryId +
        ' on transaction hash ' + event.transaction.hash.toHex() +
        ' for LEND721 contract ' + event.address.toHex() +
        ' on NFT contract ' + tokenAddress.toHex() + '-' + tokenId.toHex()
        , [
          event.block.number.toHex()
        ])
  }
}

export function handleERC721ForLendRemoved(event: ERC721ForLendRemoved): void {
  let entryId = event.params.tokenAddress.toHex() + '-' + event.params.tokenId.toHex();
  let lendEntry = ERC721ForLend.load(entryId);
  if (lendEntry == null) return;
  store.remove('ERC721ForLend', entryId);
}
