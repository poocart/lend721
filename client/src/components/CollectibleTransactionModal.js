import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

// actions
import {
  resetCollectiblePendingTransactionAction,
  resetCollectiblePreviewTransactionAction,
  setCollectiblePendingTransactionAction,
  setCollectiblePreviewTransactionAction,
  updateCollectibleDataAction,
} from '../actions/collectiblesActions';

// constants
import {
  APPROVED_FOR_LENDING,
  AVAILABLE_FOR_BORROW,
  AVAILABLE_FOR_LENDING,
  SET_FOR_LENDING,
} from '../constants/collectibleTypeConstants';

// services
import { LEND_CONTRACT_ADDRESS } from '../services/contracts';

// assets
import erc721Abi from '../assets/abi/erc721.json';
import lend721Abi from '../assets/abi/lend721.json';

// components
import Modal from './Modal';
import TransactionDetails from './TransactionDetails';
import NumericInput from './NumericInput';

// utils
import {
  findMatchingCollectible,
  isCaseInsensitiveMatch,
} from '../utils';


const renderModalContent = (
  collectibles,
  previewTransaction,
  pendingTransaction,
  closeModal,
  connectedAccount,
  setCollectiblePreviewTransaction,
  updateCollectibleData,
  lendSettings,
  setLendSettings,
  setCollectiblePendingTransaction,
  resetCollectiblePendingTransaction,
) => {
  let title;
  let subtitle;
  let confirmTitle;
  let onConfirm;
  let inputs;

  const item = findMatchingCollectible(
    collectibles,
    previewTransaction.tokenAddress,
    previewTransaction.tokenId,
  );

  const onTransactionResult = (
    transactionHash,
    tokenAddress,
    tokenId,
    updatedCollectibleData,
    transactionCompleted,
    closeTransactionModal,
  ) => {
    if (isEmpty(transactionHash)) return;
    if (!transactionCompleted) {
      setCollectiblePendingTransaction({
        tokenAddress,
        tokenId,
        transactionHash,
      });
    }
    // update in reducer
    updateCollectibleData(tokenAddress, tokenId, updatedCollectibleData);
    if (closeTransactionModal) closeModal();
    if (transactionCompleted) resetCollectiblePendingTransaction();
  };

  const connectedAccountAddress = connectedAccount.address;

  switch (item.type) {
    case AVAILABLE_FOR_BORROW:
      title = `Borrow ${item.title}`;
      subtitle = 'Allow smart contract to use specified DAI amount as collateral';
      confirmTitle = 'Confirm Borrow';
      break;
    case AVAILABLE_FOR_LENDING:
      title = `Approve usage of\n ${item.title}`;
      subtitle = 'Allow smart contract to use selected NFT';
      confirmTitle = 'Approve';
      onConfirm = async () => {
        const ERC721Contract = new window.web3.eth.Contract(erc721Abi, item.tokenAddress);

        // set for approval
        const result = await ERC721Contract.methods
          .approve(LEND_CONTRACT_ADDRESS, item.tokenId)
          .send({ from: connectedAccountAddress }, (err, hash) => onTransactionResult(
            hash,
            item.tokenAddress,
            item.tokenId,
          ))
          .catch(() => {});

        const resultTransactionHash = get(result, 'transactionHash');
        onTransactionResult(
          resultTransactionHash,
          item.tokenAddress,
          item.tokenId,
          { type: APPROVED_FOR_LENDING },
          true,
        );
      };
      break;
    case APPROVED_FOR_LENDING:
      title = `Lend ${item.title}`;
      subtitle = 'Set lend conditions and start lending your NFT';
      confirmTitle = 'Confirm Lend';
      inputs = [
        {
          title: 'Initial token worth',
          key: 'initialWorth',
          input: (
            <NumericInput
              onChange={(initialWorth) => setLendSettings({ ...lendSettings, initialWorth })}
              placeholder="1"
              inputWidth={70}
              ticker="DAI"
              textRight
            />
          ),
        },
        {
          title: 'Lend interest',
          key: 'lendInterest',
          input: (
            <NumericInput
              onChange={(lendInterest) => setLendSettings({ ...lendSettings, lendInterest })}
              placeholder="10"
              inputWidth={70}
              ticker="%"
              textRight
            />
          ),
        },
      ];
      onConfirm = async () => {
        const Lend721Contract = new window.web3.eth.Contract(lend721Abi, LEND_CONTRACT_ADDRESS);
        const { initialWorth, lendInterest } = lendSettings;
        const durationMilliseconds = 1;
        const extra = {
          initialWorth,
          lendInterest,
          durationMilliseconds,
        };
        // set for lending
        const result = await Lend721Contract.methods
          .lendForTime(
            item.tokenAddress,
            item.tokenId,
            durationMilliseconds,
            initialWorth,
            lendInterest,
          )
          .send({ from: connectedAccountAddress }, (err, hash) => onTransactionResult(
            hash,
            item.tokenAddress,
            item.tokenId,
          ))
          .catch(() => {});

        const resultTransactionHash = get(result, 'transactionHash');
        onTransactionResult(
          resultTransactionHash,
          item.tokenAddress,
          item.tokenId,
          { type: SET_FOR_LENDING, extra },
          true,
          true,
        );
      };
      break;
    case SET_FOR_LENDING:
      title = `Cancel lend of ${item.title}`;
      subtitle = 'Cancel lending and get back your NFT';
      confirmTitle = 'Cancel Lending';
      onConfirm = async () => {
        const Lend721Contract = new window.web3.eth.Contract(lend721Abi, LEND_CONTRACT_ADDRESS);

        const result = await Lend721Contract.methods
          .cancelLending(item.tokenAddress, item.tokenId)
          .send({ from: connectedAccountAddress }, (err, hash) => onTransactionResult(
            hash,
            item.tokenAddress,
            item.tokenId,
          ))
          .catch(() => {});

        const resultTransactionHash = get(result, 'transactionHash');
        onTransactionResult(
          resultTransactionHash,
          item.tokenAddress,
          item.tokenId,
          { type: AVAILABLE_FOR_LENDING },
          true,
          true,
        );
      };
      break;
    default:
      break;
  }

  let pendingTransactionHash;
  if (!isEmpty(pendingTransaction)
    && isCaseInsensitiveMatch(pendingTransaction.tokenAddress, item.tokenAddress)
    && isCaseInsensitiveMatch(pendingTransaction.tokenId, item.tokenId)) {
    pendingTransactionHash = pendingTransaction.transactionHash;
  }

  return (
    <TransactionDetails
      senderAddress={connectedAccountAddress}
      transactionHash={pendingTransactionHash}
      tokenId={item.tokenId}
      tokenName={item.title}
      inputs={inputs}
      title={title}
      subtitle={subtitle}
      actionConfirmTitle={confirmTitle}
      actionCloseTitle="Close"
      onConfirm={onConfirm}
      onClose={closeModal}
    />
  );
};

const CollectibleTransactionModal = ({
  collectibles,
  connectedAccount,
  updateCollectibleData,
  setCollectiblePreviewTransaction,
  resetCollectiblePreviewTransaction,
  setCollectiblePendingTransaction,
  resetCollectiblePendingTransaction,
}) => {
  const [lendSettings, setLendSettings] = useState({});

  const modalContent = collectibles.previewTransaction && renderModalContent(
    collectibles.data,
    collectibles.previewTransaction,
    collectibles.pendingTransaction,
    () => resetCollectiblePreviewTransaction(),
    connectedAccount,
    setCollectiblePreviewTransaction,
    updateCollectibleData,
    lendSettings,
    setLendSettings,
    setCollectiblePendingTransaction,
    resetCollectiblePendingTransaction,
  );

  return (
    <Modal
      show={!isEmpty(collectibles.previewTransaction)}
      content={modalContent}
    />
  );
};

CollectibleTransactionModal.propTypes = {
  collectibles: PropTypes.shape({
    data: PropTypes.array,
    previewTransaction: PropTypes.object,
    pendingTransaction: PropTypes.object,
  }),
  connectedAccount: PropTypes.shape({
    address: PropTypes.string,
    networkId: PropTypes.number,
  }),
  updateCollectibleData: PropTypes.func,
  setCollectiblePreviewTransaction: PropTypes.func,
  resetCollectiblePreviewTransaction: PropTypes.func,
  setCollectiblePendingTransaction: PropTypes.func,
  resetCollectiblePendingTransaction: PropTypes.func,
};

const mapStateToProps = ({
  collectibles,
  connectedAccount,
}) => ({
  collectibles,
  connectedAccount,
});

const mapDispatchToProps = {
  updateCollectibleData: updateCollectibleDataAction,
  setCollectiblePreviewTransaction: setCollectiblePreviewTransactionAction,
  resetCollectiblePreviewTransaction: resetCollectiblePreviewTransactionAction,
  setCollectiblePendingTransaction: setCollectiblePendingTransactionAction,
  resetCollectiblePendingTransaction: resetCollectiblePendingTransactionAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(CollectibleTransactionModal);
