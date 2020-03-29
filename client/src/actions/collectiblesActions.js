import get from 'lodash/get';
import isEmpty from 'lodash/isEmpty';
import { utils } from 'ethers';

// services
import {
  getCollectiblesByAddress,
  getCollectibleByTokenData,
} from '../services/collectibles';
import {
  LEND_CONTRACT_ADDRESS,
  getPayableTokenAddress,
  loadLendContract,
  getBorrowerOwnedEntriesOfLender,
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
  LENT_AND_NOT_OWNED,
  SET_FOR_BORROWING,
  SET_FOR_LENDING,
} from '../constants/collectibleTypeConstants';

// utils
import {
  findMatchingCollectible,
  isCaseInsensitiveMatch,
  isEmptyAddress,
  parseTokenAmount,
} from '../utils';

// assets
import erc721Abi from '../../../abi/erc721.json';
import erc20Abi from '../../../abi/erc20.json';


const isMatchingCollectible = (
  collectible,
  tokenAddress,
  tokenId,
) => collectible.tokenAddress === tokenAddress && collectible.tokenId === tokenId;

const getCollectibleLendSettings = async (tokenAddress, tokenId) => {
  let settings = {};
  try {
    const Lend721Contract = await loadLendContract();
    const lendSettings = await Lend721Contract.methods
      .lentERC721List(tokenAddress, tokenId)
      .call();
    const {
      initialWorth,
      earningGoal,
      durationHours,
      lender: lenderAddress,
      borrower: borrowerAddress,
      borrowedAtTimestamp,
      lenderClaimedCollateral,
    } = lendSettings;
    settings = {
      earningGoal: parseTokenAmount(earningGoal),
      initialWorth: parseTokenAmount(initialWorth),
      borrowerAddress,
      lenderAddress,
      durationHours,
      borrowedAtTimestamp,
      lenderClaimedCollateral,
    };
  } catch (e) {
    //
  }
  return settings;
};

export const loadLenderBorrowedCollectiblesAction = () => async (dispatch, getState) => {
  const {
    connectedAccount: { address: connectedAccountAddress },
    collectibles: { data: collectibles },
  } = getState();
  if (!connectedAccountAddress) return;
  const lenderCollectibles = await getBorrowerOwnedEntriesOfLender(connectedAccountAddress);
  lenderCollectibles.map(async (lendEntry) => {
    const existingItem = findMatchingCollectible(
      collectibles,
      lendEntry.tokenAddress,
      lendEntry.tokenId,
    );
    if (!isEmpty(existingItem)) return;
    if (isCaseInsensitiveMatch(lendEntry.lender, connectedAccountAddress)) {
      const collectibleMetaData = await getCollectibleByTokenData(
        lendEntry.tokenAddress,
        lendEntry.tokenId,
      );
      const itemInLend = {
        ...collectibleMetaData,
        type: LENT_AND_NOT_OWNED,
        extra: {
          ...lendEntry,
          earningGoal: parseTokenAmount(utils.bigNumberify(lendEntry.earningGoal)),
          initialWorth: parseTokenAmount(utils.bigNumberify(lendEntry.initialWorth)),
        },
      };
      dispatch({
        type: ADD_COLLECTIBLES,
        payload: [itemInLend],
      });
    }
  });
};

export const loadCollectiblesAction = () => async (dispatch, getState) => {
  const { connectedAccount: { address: connectedAccountAddress } } = getState();

  // get collectibles of current account
  let accountCollectibles = [];
  if (connectedAccountAddress) {
    const fetchedAccountCollectibles = await getCollectiblesByAddress(connectedAccountAddress)
      .catch(() => []);

    accountCollectibles = await Promise.all(fetchedAccountCollectibles.map(async (item) => {
      let approvedAddress;
      let borrowerAddress;
      let lenderAddress;
      let collectibleType = AVAILABLE_FOR_LENDING;
      let extra = {};
      try {
        const lendSettings = await getCollectibleLendSettings(item.tokenAddress, item.tokenId);
        if (!isEmpty(lendSettings)) {
          extra = lendSettings;
          ({ borrowerAddress, lenderAddress } = lendSettings);
        }
        if (isEmptyAddress(lenderAddress)) {
          const ERC721Contract = new window.web3.eth.Contract(erc721Abi, item.tokenAddress);
          approvedAddress = await ERC721Contract.methods
            .getApproved(item.tokenId)
            .call();
        }
      } catch (e) {
        //
      }
      if (isCaseInsensitiveMatch(borrowerAddress, connectedAccountAddress)) {
        collectibleType = SET_FOR_BORROWING;
      } else if (isCaseInsensitiveMatch(approvedAddress, LEND_CONTRACT_ADDRESS)) {
        collectibleType = APPROVED_FOR_LENDING;
      }
      return { ...item, type: collectibleType, extra };
    }));
  }
  dispatch({
    type: SET_COLLECTIBLES,
    payload: accountCollectibles,
  });

  // get collectibles of smart contract (in borrow pool)
  const fetchedContractCollectibles = await getCollectiblesByAddress(LEND_CONTRACT_ADDRESS)
    .catch(() => []);

  const mappedContractCollectibles = fetchedContractCollectibles
    .map(async (item) => {
      let collectibleType = AVAILABLE_FOR_BORROW;
      let extra = {};
      let lenderAddress;
      try {
        extra = await getCollectibleLendSettings(item.tokenAddress, item.tokenId);
        ({ lenderAddress } = extra);
      } catch (e) {
        //
      }
      if (lenderAddress && isCaseInsensitiveMatch(lenderAddress, connectedAccountAddress)) {
        collectibleType = SET_FOR_LENDING;
      } else if (!isEmpty(extra)) {
        try {
          const ERC20Contract = new window.web3.eth.Contract(erc20Abi, getPayableTokenAddress());
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
      return { ...item, type: collectibleType, extra };
    });

  const borrowPoolCollectibles = await Promise.all(mappedContractCollectibles);

  dispatch({
    type: ADD_COLLECTIBLES,
    payload: borrowPoolCollectibles,
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

export const checkCollectibleTransactionAction = () => async (dispatch, getState) => {
  const { collectibles: { pendingTransaction } } = getState();
  const transactionHash = get(pendingTransaction, 'transactionHash');
  if (isEmpty(transactionHash)) return;
  const transaction = await window.web3.eth
    .getTransactionReceipt(transactionHash)
    .catch(() => ({}));
  if (transaction !== null) {
    dispatch(loadCollectiblesAction());
    dispatch(resetCollectiblePendingTransactionAction());
    return;
  }
  setTimeout(() => dispatch(checkCollectibleTransactionAction()), 1000);
};
