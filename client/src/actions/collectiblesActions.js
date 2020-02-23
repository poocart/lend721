// services
import { getCollectiblesByAddress } from '../services/collectibles';
import { LEND_CONTRACT_ADDRESS } from '../services/contracts';

// constants
import {
  RESET_COLLECTIBLE_TRANSACTION,
  SET_COLLECTIBLE_TRANSACTION,
  SET_CONTRACT_COLLECTIBLES,
  SET_OWNED_COLLECTIBLES,
} from '../constants/collectiblesConstants';
import {
  APPROVED_FOR_LENDING,
  AVAILABLE_FOR_BORROW,
  AVAILABLE_FOR_LENDING,
} from '../constants/collectiblesStateConstants';

// utils
import { isCaseInsensitiveMatch } from '../utils';

// assets
import erc721Abi from '../assets/abi/erc721.json';


const isMatchingCollectible = (
  collectible,
  tokenAddress,
  tokenId,
) => collectible.tokenAddress === tokenAddress && collectible.tokenId === tokenId;

export const loadCollectiblesAction = () => async (dispatch, getState) => {
  const { connectedAccount: { address } } = getState();

  // get collectibles of current account
  let accountCollectibles = [];
  if (address) {
    const fetchedAccountCollectibles = await getCollectiblesByAddress(address).catch(() => []);
    accountCollectibles = await Promise.all(fetchedAccountCollectibles.map(async (item) => {
      let approvedAddress;
      try {
        const ERC721Contract = new window.web3.eth.Contract(erc721Abi, item.tokenAddress);
        approvedAddress = await ERC721Contract.methods.getApproved(item.tokenId).call();
      } catch (e) {
        //
      }
      const stateType = isCaseInsensitiveMatch(approvedAddress, LEND_CONTRACT_ADDRESS)
        ? APPROVED_FOR_LENDING
        : AVAILABLE_FOR_LENDING;
      return { ...item, state: { type: stateType } };
    }));
  }
  dispatch({
    type: SET_OWNED_COLLECTIBLES,
    payload: accountCollectibles,
  });

  // get collectibles of smart contract (in borrow pool)
  const contractCollectibles = await getCollectiblesByAddress(LEND_CONTRACT_ADDRESS)
    .then((items) => items.map((item) => ({ ...item, state: { type: AVAILABLE_FOR_BORROW } })))
    .catch(() => []);
  dispatch({
    type: SET_CONTRACT_COLLECTIBLES,
    payload: contractCollectibles,
  });
};

export const updateCollectibleStateAction = (
  tokenAddress,
  tokenId,
  state,
) => (dispatch, getState) => {
  const { collectibles: { owned } } = getState();

  // check if exist
  if (!owned.some(
    (collectible) => isMatchingCollectible(collectible, tokenAddress, tokenId),
  )) return;

  const updatedOwned = owned.reduce((updated, collectible, index) => {
    if (isMatchingCollectible(collectible, tokenAddress, tokenId)) {
      updated[index] = { ...collectible, state };
    }
    return updated;
  }, owned);

  dispatch({
    type: SET_OWNED_COLLECTIBLES,
    payload: updatedOwned,
  });
};

export const setCollectibleForTransactionAction = (
  tokenAddress,
  tokenId,
) => (dispatch, getState) => {
  const { collectibles: { owned, contract } } = getState();
  const targetCollectible = [...owned, ...contract].find(
    (collectible) => isMatchingCollectible(collectible, tokenAddress, tokenId),
  );

  if (!targetCollectible) return;

  dispatch({
    type: SET_COLLECTIBLE_TRANSACTION,
    payload: targetCollectible,
  });
};

export const resetCollectibleForTransactionAction = () => ({ type: RESET_COLLECTIBLE_TRANSACTION });
