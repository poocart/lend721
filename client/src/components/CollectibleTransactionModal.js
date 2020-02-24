import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

// actions
import {
  resetCollectibleForTransactionAction,
  setCollectibleForTransactionAction,
  updateCollectibleDataAction,
} from '../actions/collectiblesActions';

// constants
import {
  APPROVED_FOR_LENDING,
  AVAILABLE_FOR_BORROW,
  AVAILABLE_FOR_LENDING,
  SET_FOR_LENDING,
} from '../constants/collectiblesStateConstants';

// services
import { LEND_CONTRACT_ADDRESS } from '../services/contracts';

// assets
import erc721Abi from '../assets/abi/erc721.json';
import lend721Abi from '../assets/abi/lend721.json';

// components
import Modal from './Modal';
import TransactionDetails from './TransactionDetails';
import NumericInput from './NumericInput';


const renderModalContent = (
  item,
  closeModal,
  connectedAccount,
  setCollectibleForTransaction,
  updateCollectibleData,
  lendSettings,
  setLendSettings,
) => {
  let title;
  let subtitle;
  let confirmTitle;
  let onConfirm;
  let inputs;

  const onTransactionResult = (
    successfulTransactionHash,
    tokenAddress,
    tokenId,
    state,
    updateTransaction,
    closeTransactionModal,
  ) => {
    if (isEmpty(successfulTransactionHash)) return;
    // update in reducer
    updateCollectibleData(tokenAddress, tokenId, state);
    if (updateTransaction) setCollectibleForTransaction(tokenAddress, tokenId);
    if (closeTransactionModal) closeModal();
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
            { transactionHash: hash },
            true,
          ))
          .catch(() => {});

        const resultTransactionHash = get(result, 'transactionHash');
        onTransactionResult(
          resultTransactionHash,
          item.tokenAddress,
          item.tokenId,
          { type: APPROVED_FOR_LENDING, transactionHash: null },
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
        const lendDuration = 1;
        // set for lending
        const result = await Lend721Contract.methods
          .lendForTime(
            item.tokenAddress,
            item.tokenId,
            lendDuration,
            initialWorth,
            lendInterest,
          )
          .send({ from: connectedAccountAddress }, (err, hash) => onTransactionResult(
            hash,
            item.tokenAddress,
            item.tokenId,
            { transactionHash: hash },
            true,
          ))
          .catch(() => {});

        const resultTransactionHash = get(result, 'transactionHash');
        onTransactionResult(
          resultTransactionHash,
          item.tokenAddress,
          item.tokenId,
          { type: SET_FOR_LENDING, transactionHash: null },
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
            { transactionHash: hash },
            true,
          ))
          .catch(() => {});

        const resultTransactionHash = get(result, 'transactionHash');
        onTransactionResult(
          resultTransactionHash,
          item.tokenAddress,
          item.tokenId,
          { type: AVAILABLE_FOR_LENDING, transactionHash: null },
          false,
          true,
        );
      };
      break;
    default:
      break;
  }

  return (
    <TransactionDetails
      senderAddress={connectedAccountAddress}
      transactionHash={item.transactionHash}
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
  setCollectibleForTransaction,
  resetCollectibleForTransaction,
}) => {
  const [lendSettings, setLendSettings] = useState({});

  const modalContent = collectibles.collectibleTransaction && renderModalContent(
    collectibles.collectibleTransaction,
    () => resetCollectibleForTransaction(),
    connectedAccount,
    setCollectibleForTransaction,
    updateCollectibleData,
    lendSettings,
    setLendSettings,
  );

  return (
    <Modal
      show={!isEmpty(collectibles.collectibleTransaction)}
      content={modalContent}
    />
  );
};

CollectibleTransactionModal.propTypes = {
  collectibles: PropTypes.shape({
    collectibleTransaction: PropTypes.object,
  }),
  connectedAccount: PropTypes.shape({
    address: PropTypes.string,
    networkId: PropTypes.number,
  }),
  updateCollectibleData: PropTypes.func,
  setCollectibleForTransaction: PropTypes.func,
  resetCollectibleForTransaction: PropTypes.func,
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
  setCollectibleForTransaction: setCollectibleForTransactionAction,
  resetCollectibleForTransaction: resetCollectibleForTransactionAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(CollectibleTransactionModal);
