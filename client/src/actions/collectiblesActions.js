import isEmpty from 'lodash/isEmpty';

// services
import { getCollectiblesByAddress } from '../services/collectibles';
import {
  LEND_CONTRACT_ADDRESS,
  PAYABLE_TOKEN_ADDRESS,
} from '../services/contracts';

// constants
import {
  SET_COLLECTIBLE_PREVIEW_TRANSACTION,
  RESET_COLLECTIBLE_PREVIEW_TRANSACTION,
  ADD_COLLECTIBLES,
  SET_COLLECTIBLES,
  SET_COLLECTIBLE_PENDING_TRANSACTION,
  RESET_COLLECTIBLE_PENDING_TRANSACTION,
} from '../constants/collectibleConstants';
import {
  APPROVED_FOR_BORROWING,
  APPROVED_FOR_LENDING,
  AVAILABLE_FOR_BORROW,
  AVAILABLE_FOR_LENDING,
  SET_FOR_LENDING,
} from '../constants/collectibleTypeConstants';

// utils
import {
  isCaseInsensitiveMatch,
  parseTokenAmount,
} from '../utils';

// assets
import erc721Abi from '../assets/abi/erc721.json';
import erc20Abi from '../assets/abi/erc20.json';
import lend721Abi from '../assets/abi/lend721.json';


const isMatchingCollectible = (
  collectible,
  tokenAddress,
  tokenId,
) => collectible.tokenAddress === tokenAddress && collectible.tokenId === tokenId;

export const loadCollectiblesAction = () => async (dispatch, getState) => {
  const { connectedAccount: { address: connectedAccountAddress } } = getState();

  // get collectibles of current account
  let accountCollectibles = [];
  if (connectedAccountAddress) {
    const fetchedAccountCollectibles = await getCollectiblesByAddress(connectedAccountAddress)
      .catch(() => []);

    accountCollectibles = await Promise.all(fetchedAccountCollectibles.map(async (item) => {
      let approvedAddress;
      try {
        const ERC721Contract = new window.web3.eth.Contract(erc721Abi, item.tokenAddress);
        approvedAddress = await ERC721Contract.methods.getApproved(item.tokenId).call();
      } catch (e) {
        //
      }
      const itemType = isCaseInsensitiveMatch(approvedAddress, LEND_CONTRACT_ADDRESS)
        ? APPROVED_FOR_LENDING
        : AVAILABLE_FOR_LENDING;
      return { ...item, type: itemType };
    }));
  }
  dispatch({
    type: SET_COLLECTIBLES,
    payload: accountCollectibles,
  });

  // get collectibles of smart contract (in borrow pool)
  const fetchedContractCollectibles = await getCollectiblesByAddress(LEND_CONTRACT_ADDRESS)
    .catch(() => []);

  const Lend721Contract = new window.web3.eth.Contract(lend721Abi, LEND_CONTRACT_ADDRESS);

  let lentCollectibles = [];
  let contractCollectibles = [];

  await Promise.all(fetchedContractCollectibles.map(async (item) => {
    let lenderAddress;
    let lentSettings;
    let collectibleType = AVAILABLE_FOR_BORROW;
    let extra = {};
    try {
      lentSettings = await Lend721Contract.methods
        .lentERC721List(item.tokenAddress, item.tokenId)
        .call();
      ({ lender: lenderAddress } = lentSettings);
      const {
        initialWorth,
        earningGoal,
        borrower: borrowerAddress,
        durationHours,
      } = lentSettings;
      extra = {
        earningGoal: parseTokenAmount(earningGoal),
        initialWorth: parseTokenAmount(initialWorth),
        borrowerAddress,
        durationHours,
      };
    } catch (e) {
      //
    }
    if (isCaseInsensitiveMatch(lenderAddress, connectedAccountAddress)) {
      collectibleType = SET_FOR_LENDING;
    } else if (!isEmpty(extra)) {
      try {
        const ERC20Contract = new window.web3.eth.Contract(erc20Abi, PAYABLE_TOKEN_ADDRESS);
        const allowance = await ERC20Contract.methods
          .allowance(connectedAccountAddress, LEND_CONTRACT_ADDRESS)
          .call();
        const allowanceAmount = parseTokenAmount(allowance);
        const requiredAllowance = extra.initialWorth + extra.earningGoal;
        if (allowanceAmount >= requiredAllowance) collectibleType = APPROVED_FOR_BORROWING;
      } catch (e) {
        //
      }
    }
    lentCollectibles = [
      ...lentCollectibles,
      {
        ...item,
        type: collectibleType,
        extra,
      },
    ];
  }));

  dispatch({
    type: ADD_COLLECTIBLES,
    payload: contractCollectibles,
  });

  dispatch({
    type: ADD_COLLECTIBLES,
    payload: lentCollectibles,
  });
};

export const updateCollectibleDataAction = (
  tokenAddress,
  tokenId,
  updatedCollectibleData,
) => (dispatch, getState) => {
  const { collectibles: { data: collectibles } } = getState();

  // check if exist
  if (!collectibles.some(
    (collectible) => isMatchingCollectible(collectible, tokenAddress, tokenId),
  )) return;

  const updatedCollectibles = collectibles.reduce((updated, collectible, index) => {
    if (isMatchingCollectible(collectible, tokenAddress, tokenId)) {
      updated[index] = { ...collectible, ...updatedCollectibleData };
    }
    return updated;
  }, collectibles);

  dispatch({
    type: SET_COLLECTIBLES,
    payload: updatedCollectibles,
  });
};

export const setCollectiblePreviewTransactionAction = (
  tokenAddress,
  tokenId,
) => (dispatch, getState) => {
  const { collectibles: { data: collectibles } } = getState();
  const targetCollectible = collectibles.find(
    (collectible) => isMatchingCollectible(collectible, tokenAddress, tokenId),
  );

  if (!targetCollectible) return;

  dispatch({
    type: SET_COLLECTIBLE_PREVIEW_TRANSACTION,
    payload: targetCollectible,
  });
};

export const resetCollectiblePreviewTransactionAction = () => ({
  type: RESET_COLLECTIBLE_PREVIEW_TRANSACTION,
});

export const setCollectiblePendingTransactionAction = (transaction) => ({
  type: SET_COLLECTIBLE_PENDING_TRANSACTION,
  payload: transaction,
});

export const resetCollectiblePendingTransactionAction = () => ({
  type: RESET_COLLECTIBLE_PENDING_TRANSACTION,
});
