import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import isEmpty from 'lodash/isEmpty';
import get from 'lodash/get';
import styled from 'styled-components';
import { Select } from 'rimble-ui';

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
  APPROVED_FOR_BORROWING,
  APPROVED_FOR_LENDING,
  APPROVED_FOR_STOP_BORROWING,
  AVAILABLE_FOR_BORROW,
  AVAILABLE_FOR_LENDING,
  LENT_AND_NOT_OWNED,
  SET_FOR_BORROWING,
  SET_FOR_LENDING,
} from '../constants/collectibleTypeConstants';

// services
import {
  LEND_CONTRACT_ADDRESS,
  getPayableTokenAddress,
  loadLendContract,
} from '../services/contracts';

// assets
import erc721Abi from '../../../abi/erc721.json';
import erc20Abi from '../../../abi/erc20.json';

// components
import Modal from './Modal';
import TransactionDetails from './TransactionDetails';
import NumericInput from './NumericInput';

// utils
import {
  findMatchingCollectible,
  formatLendDuration,
  formatTokenAmount,
  getLendDurationTitle,
  isPendingCollectibleTransaction,
} from '../utils';


const SelectInputWrapper = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
`;

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
  let confirmDisabled;
  let modalData;
  let collateralAmount;
  let infoMessage;
  let warningMessage;

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
    } else {
      setLendSettings({});
    }
    // update in reducer
    updateCollectibleData(tokenAddress, tokenId, updatedCollectibleData);
    if (closeTransactionModal) closeModal();
    if (transactionCompleted) resetCollectiblePendingTransaction();
  };

  const connectedAccountAddress = connectedAccount.address;

  const pendingTransactionHash = item
    && isPendingCollectibleTransaction(pendingTransaction, item.tokenAddress, item.tokenId)
    && pendingTransaction.transactionHash;

  switch (item.type) {
    case AVAILABLE_FOR_BORROW:
      title = `Borrow ${item.title}`;
      subtitle = 'Allow lending Smart Contract to use DAI amount needed to borrow selected ERC-721 token';
      collateralAmount = item.extra.initialWorth + item.extra.earningGoal;
      confirmTitle = `Allow usage of ${collateralAmount} DAI`;
      if (!connectedAccount.balance || connectedAccount.balance < collateralAmount) {
        warningMessage = 'Not enough DAI balance.';
        confirmDisabled = true;
      }
      modalData = [
        {
          title: 'Collateral of token\'s initial worth',
          key: 'initialWorth',
          render: (
            <NumericInput
              defaultValue={item.extra.initialWorth}
              inputWidth={70}
              ticker="DAI"
              disabled
              textRight
            />
          ),
        },
        {
          title: 'Price for lend',
          key: 'earningGoal',
          render: (
            <NumericInput
              defaultValue={item.extra.earningGoal}
              inputWidth={70}
              ticker="DAI"
              disabled
              textRight
            />
          ),
        },
        {
          title: 'Max. lending duration',
          key: 'duration',
          render: (
            <NumericInput
              defaultValue={formatLendDuration(item.extra.durationHours)}
              inputWidth={35}
              ticker={getLendDurationTitle(item.extra.durationHours)}
              disabled
              textRight
            />
          ),
        },
      ];
      onConfirm = async () => {
        const ERC20Contract = new window.web3.eth.Contract(erc20Abi, getPayableTokenAddress());
        // set for approval
        const result = await ERC20Contract.methods
          .approve(LEND_CONTRACT_ADDRESS, formatTokenAmount(collateralAmount))
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
          { type: APPROVED_FOR_BORROWING },
          true,
        );
      };
      break;
    case AVAILABLE_FOR_LENDING:
      title = `Approve usage of\n ${item.title}`;
      subtitle = 'Allow lending smart contract to use selected ERC-721 token';
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
      subtitle = 'Set lend conditions and start lending selected ERC-721 token';
      confirmTitle = 'Confirm Lend';
      modalData = [
        {
          title: 'Initial token worth',
          key: 'initialWorth',
          render: (
            <NumericInput
              onChange={(initialWorth) => setLendSettings({ ...lendSettings, initialWorth })}
              placeholder="1"
              inputWidth={70}
              ticker="DAI"
              disabled={!!pendingTransactionHash}
              textRight
            />
          ),
        },
        {
          title: 'Max. lend duration',
          key: 'duration',
          render: (
            <SelectInputWrapper>
              <NumericInput
                onChange={(duration) => setLendSettings({ ...lendSettings, duration })}
                placeholder="1"
                inputWidth={35}
                disabled={!!pendingTransactionHash}
                textRight
                noDecimals
              />
              <Select
                ml={2}
                options={[
                  { value: 'h', label: 'hour(s)' },
                  { value: 'd', label: 'day(s)' },
                ]}
                disabled={!!pendingTransactionHash}
                onChange={
                  ({
                    target: { value: durationType },
                  }) => setLendSettings({ ...lendSettings, durationType })
                }
              />
            </SelectInputWrapper>
          ),
        },
        {
          title: 'Earning goal for each lend',
          key: 'earningGoal',
          render: (
            <NumericInput
              onChange={(earningGoal) => setLendSettings({ ...lendSettings, earningGoal })}
              placeholder="1"
              inputWidth={70}
              ticker="DAI"
              disabled={!!pendingTransactionHash}
              textRight
            />
          ),
        },
      ];
      onConfirm = async () => {
        const Lend721Contract = await loadLendContract();
        const {
          initialWorth,
          earningGoal,
          duration,
          durationType,
        } = lendSettings;
        const durationHours = durationType === 'd' ? duration * 24 : duration;
        const extra = {
          initialWorth,
          earningGoal,
          durationHours,
        };
        // set for lending
        const result = await Lend721Contract.methods
          .setLendSettings(
            item.tokenAddress,
            item.tokenId,
            durationHours,
            formatTokenAmount(initialWorth),
            formatTokenAmount(earningGoal),
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
      confirmDisabled = isEmpty(lendSettings.earningGoal)
        || isEmpty(lendSettings.duration)
        || isEmpty(lendSettings.initialWorth)
        || lendSettings.initialWorth <= 0
        || lendSettings.duration <= 0
        || lendSettings.earningGoal <= 0;
      break;
    case APPROVED_FOR_BORROWING:
      title = `Begin borrowing ${item.title}`;
      subtitle = 'Transfer selected ERC-721 token from lend Smart Contract to your wallet while locking previously approved collateral in DAI';
      confirmTitle = 'Borrow';
      infoMessage = 'Friendly reminder: Make sure you stop borrowing before deadline ends or you might lose your collateral!';
      modalData = [
        {
          title: 'Max. lending duration',
          key: 'duration',
          render: (
            <NumericInput
              defaultValue={formatLendDuration(item.extra.durationHours)}
              inputWidth={35}
              ticker={getLendDurationTitle(item.extra.durationHours)}
              disabled
              textRight
            />
          ),
        },
      ];
      onConfirm = async () => {
        const Lend721Contract = await loadLendContract();
        const result = await Lend721Contract.methods
          .startBorrowing(item.tokenAddress, item.tokenId)
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
          { type: SET_FOR_BORROWING },
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
        const Lend721Contract = await loadLendContract();

        const result = await Lend721Contract.methods
          .removeFromLending(item.tokenAddress, item.tokenId)
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
    case SET_FOR_BORROWING:
      title = `Allow transfer ${item.title}`;
      subtitle = 'Allow lend Smart Contract to transfer ERC-721 back to it';
      confirmTitle = 'Allow Transfer';
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
          { type: APPROVED_FOR_STOP_BORROWING },
          true,
        );
      };
      break;
    case APPROVED_FOR_STOP_BORROWING:
      title = `Stop borrowing ${item.title}`;
      subtitle = 'Stop borrowing selected ERC-721 and get your collateral of token\'s initial worth back';
      confirmTitle = 'Stop Borrowing';
      modalData = [
        {
          title: 'You will get back',
          key: 'initialWorth',
          render: (
            <NumericInput
              defaultValue={item.extra.initialWorth}
              inputWidth={70}
              ticker="DAI"
              disabled
              textRight
            />
          ),
        },
      ];
      onConfirm = async () => {
        const Lend721Contract = await loadLendContract();

        // set for approval
        const result = await Lend721Contract.methods
          .stopBorrowing(item.tokenAddress, item.tokenId)
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
          { type: AVAILABLE_FOR_BORROW },
          true,
          true,
        );
      };
      break;
    case LENT_AND_NOT_OWNED:
      title = `Dismiss ownership of ${item.title}`;
      subtitle = 'Stop lending selected ERC-721 and refuse your ownership to it by taking borrowers collateral before he gave you your ERC-721 back';
      confirmTitle = 'Claim Borrower\'s Collateral';
      warningMessage = 'After this you will not be able to get back your ERC-721 token as you\'re taking borrowers collateral.';
      modalData = [
        {
          title: 'You will lose',
          key: 'erc721',
          render: <span>{item.title} {item.tokenId}</span>,
        },
        {
          title: 'You will get',
          key: 'collateral',
          render: (
            <NumericInput
              defaultValue={item.extra.initialWorth + item.extra.earningGoal}
              inputWidth={70}
              ticker="DAI"
              disabled
              textRight
            />
          ),
        },
      ];
      onConfirm = async () => {
        const Lend721Contract = await loadLendContract();
        // set for approval
        const result = await Lend721Contract.methods
          .claimBorrowerCollateral(item.tokenAddress, item.tokenId)
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
          { type: null },
          true,
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
      transactionHash={pendingTransactionHash || ''}
      tokenId={item.tokenId}
      tokenName={item.title}
      data={modalData}
      title={title}
      subtitle={subtitle}
      actionConfirmTitle={confirmTitle}
      actionCloseTitle="Close"
      onConfirm={onConfirm}
      confirmDisabled={confirmDisabled}
      onClose={closeModal}
      warningMessage={warningMessage}
      infoMessage={infoMessage}
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
    balance: PropTypes.number,
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
