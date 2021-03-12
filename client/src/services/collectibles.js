import axios from 'axios';
import isEmpty from 'lodash/isEmpty';

// utils
import { isProduction, pause } from '../utils';

// local
import { isValidNFT } from './contracts';


const mapFromOpenSea = (data) => data.map(({
  name,
  background_color: backgroundColor,
  token_id: tokenId,
  image_url: image,
  image_preview_url: preview,
  asset_contract: { address: tokenAddress },
  traits = [],
}) => {
  const attributes = traits.map(({ trait_type: title, value }) => ({ title, value }));
  return {
    title: name || 'Unnamed ERC-721',
    backgroundColor,
    image: image || preview,
    tokenAddress,
    tokenId,
    attributes,
  };
});

const getOpenSeaHostname = () => `https://${isProduction ? '' : 'rinkeby-'}api.opensea.io`;

export const getCollectiblesByAddress = (address, attempt) => {
  const url = `${getOpenSeaHostname()}/api/v1/assets/?owner=${address}&exclude_currencies=true&order_by=listing_date&order_direction=asc&limit=200`;
  return axios.get(url, {
    timeout: 5000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': 'af952dd5eb0940a9bfc68a1a9ecec4a6',
    },
  })
    .then(({ data: { assets: collectibles = [] } }) => collectibles)
    .then(mapFromOpenSea)
    .catch(async () => {
      if (attempt === 5) return [];
      await pause(attempt);
      return getCollectiblesByAddress(address, attempt || 2);
    });
};

export const getCollectibleByTokenData = (tokenAddress, tokenId, attempt) => {
  const url = `${getOpenSeaHostname()}/api/v1/asset/${tokenAddress}/${tokenId}`;
  return axios.get(url, {
    timeout: 5000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': process.env.OPENSEA_API_KEY,
    },
  })
    .then(({ data: asset }) => mapFromOpenSea([asset]))
    .then((items) => items[0])
    .catch(async () => {
      if (attempt === 5) return [];
      await pause(attempt);
      return getCollectibleByTokenData(tokenAddress, tokenId, attempt || 2);
    });
};

export const filterValidCollectibles = async (collectibles) => {
  const validatedAccountCollectibles = await Promise.all(collectibles.map(async (collectible) => {
    const isValid = await isValidNFT(collectible.tokenAddress, collectible.tokenId);
    if (!isValid) return null;

    return collectible;
  }));

  return validatedAccountCollectibles.filter((collectible) => !isEmpty(collectible));
};
