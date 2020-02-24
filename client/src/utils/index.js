import toLower from 'lodash/toLower';

// constants
import {
  APPROVED_FOR_LENDING,
  AVAILABLE_FOR_BORROW,
  AVAILABLE_FOR_LENDING,
  SET_FOR_LENDING,
} from '../constants/collectiblesStateConstants';


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

export const ACCOUNT_EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

export const filterOwnedCollectibles = (collectibles) => collectibles && collectibles.filter(({ type }) => [
  AVAILABLE_FOR_LENDING,
  APPROVED_FOR_LENDING,
].includes(type));

export const filterCollectiblesToBorrow = (collectibles) => collectibles && collectibles.filter(({ type }) => [
  AVAILABLE_FOR_BORROW,
].includes(type));

export const filterLentCollectibles = (collectibles) => collectibles && collectibles.filter(({ type }) => [
  SET_FOR_LENDING,
].includes(type));
