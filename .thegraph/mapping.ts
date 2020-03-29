import { store } from '@graphprotocol/graph-ts';
import { ERC721ForLendUpdated, ERC721ForLendRemoved, LEND721 } from './generated/LEND721/LEND721';
import { ERC721ForLend } from './generated/schema';

export function handleERC721ForLendUpdated(event: ERC721ForLendUpdated): void {
  const entryId = event.params.tokenAddress.toHex() + '-' + event.params.tokenId.toHex();
  let lendEntry = ERC721ForLend.load(entryId);
  if (lendEntry == null) {
    lendEntry = new ERC721ForLend(entryId);
  }

  let contract = LEND721.bind(event.address);
  let contractEntry = contract.lentERC721List(event.params.tokenAddress, event.params.tokenId);

  lendEntry.durationHours = contractEntry.value0;
  lendEntry.initialWorth = contractEntry.value1;
  lendEntry.earningGoal = contractEntry.value2;
  lendEntry.borrowedAtTimestamp = contractEntry.value3;
  lendEntry.lender = contractEntry.value4;
  lendEntry.borrower = contractEntry.value5;
  lendEntry.lenderClaimedCollateral = contractEntry.value6;
  lendEntry.tokenAddress = event.params.tokenAddress;
  lendEntry.tokenId = event.params.tokenId;

  lendEntry.save()
}

export function handleERC721ForLendRemoved(event: ERC721ForLendRemoved): void {
  const entryId = event.params.tokenAddress.toHex() + '-' + event.params.tokenId.toHex();
  let lendEntry = ERC721ForLend.load(entryId);
  if (lendEntry == null) return;
  store.remove('ERC721ForLend', entryId);
}
