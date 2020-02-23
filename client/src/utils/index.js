import toLower from 'lodash/toLower';


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
    return `${firstWord.slice(0, startCharsCount)}${separator}${firstWord.slice(-endCharsCount)}`
  }

  return targetString;
};

export const isCaseInsensitiveMatch = (a, b) => {
  if (!a || !b) return false;
  if (a === b) return true;
  return toLower(a) === toLower(b);
};
