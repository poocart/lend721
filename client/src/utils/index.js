import toLower from 'lodash/toLower';
import { utils as ethersUtils } from 'ethers';
import isEmpty from 'lodash/isEmpty';

// constants
import {
  APPROVED_FOR_BORROWING,
  APPROVED_FOR_LENDING,
  APPROVED_FOR_STOP_BORROWING,
  AVAILABLE_FOR_BORROW,
  AVAILABLE_FOR_LENDING,
  LENT_AND_NOT_OWNED,
  SET_FOR_BORROWING,
  SET_FOR_LENDING,
} from '../constants/collectibleTypeConstants';


export const truncateHexString = (targetString) => {
  if (!targetString) return '';

  const startCharsCount = 6;
  const endCharsCount = 4;
  const separator = '...';
  const totalTruncatedSum = startCharsCount + endCharsCount + separator.length;

  const words = targetString.toString().split(' ');
  const firstWord = words[0];

  if (words.length === 1) {
    if (firstWord.length <= totalTruncatedSum) return firstWord;
    return `${firstWord.slice(0, startCharsCount)}${separator}${firstWord.slice(-endCharsCount)}`;
  }

  return targetString;
};

export const isCaseInsensitiveMatch = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  return toLower(a) === toLower(b);
};

export const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

export const filterOwnedCollectibles = (collectibles) => collectibles.filter(({ type }) => [
  AVAILABLE_FOR_LENDING,
  APPROVED_FOR_LENDING,
].includes(type));

export const filterCollectiblesToBorrow = (collectibles) => collectibles.filter(({ type }) => [
  AVAILABLE_FOR_BORROW,
  APPROVED_FOR_BORROWING,
].includes(type));

export const filterLentCollectibles = (collectibles) => collectibles.filter(({ type }) => [
  SET_FOR_LENDING,
  LENT_AND_NOT_OWNED,
].includes(type));

export const filterBorrowedCollectibles = (collectibles) => collectibles.filter(({ type }) => [
  SET_FOR_BORROWING,
  APPROVED_FOR_STOP_BORROWING,
].includes(type));

export const findMatchingCollectible = (
  collectibles,
  tokenAddress,
  tokenId,
  itemType,
) => !isEmpty(collectibles) && collectibles.find((
  collectible,
) => isCaseInsensitiveMatch(collectible.tokenAddress, tokenAddress)
    && isCaseInsensitiveMatch(collectible.tokenId, tokenId)
    && (!itemType || itemType === collectible.type));

export const formatTokenAmount = (value) => ethersUtils.parseUnits(value.toString(), 18);

export const parseTokenAmount = (value) => Number(ethersUtils.formatUnits(value.toString(), 18));

export const isPendingCollectibleTransaction = (
  pendingTransaction,
  tokenAddress,
  tokenId,
) => !isEmpty(pendingTransaction)
  && isCaseInsensitiveMatch(pendingTransaction.tokenAddress, tokenAddress)
  && isCaseInsensitiveMatch(pendingTransaction.tokenId, tokenId);

export const formatLendDuration = (
  duration,
) => duration >= 24 ? Math.floor(duration / 24) : duration;

export const getLendDurationTitle = (
  duration,
) => duration >= 24 ? 'day(s)' : 'hour(s)';

export const pause = (
  multiplier,
) => new Promise(resolve => setTimeout(resolve, (multiplier || 1) * 1000));

export const isProduction = !!process.env.PRODUCTION;

export const isEmptyAddress = (
  address,
) => !address || isCaseInsensitiveMatch(address, EMPTY_ADDRESS);

export const getEtherscanHostname = () => ` https://${isProduction ? '' : 'rinkeby.'}etherscan.io`;
