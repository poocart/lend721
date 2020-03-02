import axios from 'axios';

// utils
import { pause } from '../utils';


const mapFromOpenSea = (data) => data.map(({
  name,
  background_color: backgroundColor,
  token_id: tokenId,
  image_url: image,
  image_preview_url: preview,
  asset_contract: { address: tokenAddress },
}) => ({
  title: name || 'Unnamed ERC-721',
  backgroundColor,
  image: image || preview,
  tokenAddress,
  tokenId,
}));

export const getCollectiblesByAddress = (address, attempt) => {
  const url = `https://rinkeby-api.opensea.io/api/v1/assets/?owner=${address}&exclude_currencies=true&order_by=listing_date&order_direction=asc`;
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
  const url = `https://rinkeby-api.opensea.io/api/v1/asset/${tokenAddress}/${tokenId}`;
  return axios.get(url, {
    timeout: 5000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': 'af952dd5eb0940a9bfc68a1a9ecec4a6',
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
