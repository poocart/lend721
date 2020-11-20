import { store, log } from '@graphprotocol/graph-ts';
import { ERC721ForLendUpdated, ERC721ForLendRemoved, LEND721 } from './generated/LEND721/LEND721';
import { ERC721ForLend } from './generated/schema';

export function handleERC721ForLendUpdated(event: ERC721ForLendUpdated): void {
  const entryId = event.params.tokenAddress.toHex() + '-' + event.params.tokenId.toHex() + '-' + event.params.lenderAddress.toHex();
  let lendEntry = ERC721ForLend.load(entryId);
  if (lendEntry == null) {
    lendEntry = new ERC721ForLend(entryId);
  }

  let contract = LEND721.bind(event.address);
  let contractEntry = contract.try_lendingPool(event.params.tokenAddress, event.params.tokenId, event.params.lenderAddress);

  if (!contractEntry.reverted) {
    let contractEntryValue = contractEntry.value;
    lendEntry.durationHours = contractEntryValue.value0;
    lendEntry.initialWorth = contractEntryValue.value1;
    lendEntry.earningGoal = contractEntryValue.value2;
    lendEntry.borrowedAtTimestamp = contractEntryValue.value3;
    lendEntry.lender = contractEntryValue.value4;
    lendEntry.borrower = contractEntryValue.value5;
    lendEntry.lenderClaimedCollateral = contractEntryValue.value6;
    lendEntry.sablierStreamId = contractEntryValue.value7;
    lendEntry.tokenAddress = event.params.tokenAddress;
    lendEntry.tokenId = event.params.tokenId;
    lendEntry.save()
  } else {
    log.warning('Mapping received reverted', [event.transaction.hash.toHex()])
  }
}

export function handleERC721ForLendRemoved(event: ERC721ForLendRemoved): void {
  const entryId = event.params.tokenAddress.toHex() + '-' + event.params.tokenId.toHex() + '-' + event.params.lenderAddress.toHex();
  let lendEntry = ERC721ForLend.load(entryId);
  if (lendEntry == null) return;
  store.remove('ERC721ForLend', entryId);
}
