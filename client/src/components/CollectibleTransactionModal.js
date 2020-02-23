import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';

// constants
import {
  APPROVED_FOR_LENDING,
  AVAILABLE_FOR_BORROW,
  AVAILABLE_FOR_LENDING,
} from '../constants/collectiblesStateConstants';

// services
import { LEND_CONTRACT_ADDRESS } from '../services/contracts';

// assets
import erc721Abi from '../assets/abi/erc721.json';

// components
import Modal from './Modal';
import TransactionDetails from './TransactionDetails';
import {
  resetCollectibleForTransactionAction,
  setCollectibleForTransactionAction,
  updateCollectibleStateAction,
} from '../actions/collectiblesActions';


const renderModalContent = (
  item,
  closeModal,
  connectedAccount,
  setCollectibleForTransaction,
  updateCollectibleState,
) => {
  let title;
  let subtitle;
  let confirmTitle;
  let onConfirm;

  const connectedAccountAddress = connectedAccount.address;
  const transactionHash = get(item, 'state.transactionHash');

  switch (item.state.type) {
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
          .send({ from: connectedAccountAddress }, (err, hash) => {
            if (err) return;
            const updatedState = { ...item.state, transactionHash: hash };
            updateCollectibleState(item.tokenAddress, item.tokenId, updatedState);
            setCollectibleForTransaction(item.tokenAddress, item.tokenId);
          })
          .catch(() => {});

        if (!result.transactionHash) return;

        // update in reducer
        const updatedState = { type: APPROVED_FOR_LENDING };
        updateCollectibleState(item.tokenAddress, item.tokenId, updatedState);
        setCollectibleForTransaction(item.tokenAddress, item.tokenId);
      };
      break;
    case APPROVED_FOR_LENDING:
      title = `Lend ${item.title}`;
      subtitle = 'Set lend conditions and start lending your NFT';
      confirmTitle = 'Confirm Lend';
      break;
    default:
      break;
  }

  return (
    <TransactionDetails
      senderAddress={connectedAccountAddress}
      transactionHash={transactionHash}
      tokenId={item.tokenId}
      tokenName={item.title}
      title={title}
      subtitle={subtitle}
      actionConfirmTitle={confirmTitle}
      actionCloseTitle="Close"
      onConfirm={onConfirm}
      onClose={closeModal}
    />
  );
};

const collectibleTransactionModal = ({
  collectibles,
  connectedAccount,
  updateCollectibleState,
  setCollectibleForTransaction,
  resetCollectibleForTransaction,
}) => {
  const closeModal = () => resetCollectibleForTransaction();

  const modalContent = collectibles.collectibleTransaction && renderModalContent(
    collectibles.collectibleTransaction,
    closeModal,
    connectedAccount,
    setCollectibleForTransaction,
    updateCollectibleState,
  );

  return (
    <Modal
      show={!isEmpty(collectibles.collectibleTransaction)}
      content={modalContent}
    />
  );
};

collectibleTransactionModal.propTypes = {
  collectibles: PropTypes.shape({
    owned: PropTypes.array,
    contract: PropTypes.array,
    collectibleTransaction: PropTypes.object,
  }),
  connectedAccount: PropTypes.shape({
    address: PropTypes.string,
    networkId: PropTypes.number,
  }),
  updateCollectibleState: PropTypes.func,
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
  updateCollectibleState: updateCollectibleStateAction,
  setCollectibleForTransaction: setCollectibleForTransactionAction,
  resetCollectibleForTransaction: resetCollectibleForTransactionAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(collectibleTransactionModal);
