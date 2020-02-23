import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Loader, Flash } from 'rimble-ui';
import isEmpty from 'lodash/isEmpty';
import isUndefined from 'lodash/isUndefined';
import get from 'lodash/get';
import { isMobile } from 'react-device-detect';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// actions
import { setConnectedAccountAction } from '../actions/connectedAccountActions';
import {
  loadCollectiblesAction,
  updateCollectibleStateAction,
} from '../actions/collectiblesActions';

// components
import Tabs from '../components/Tabs';
import CardsGrid from '../components/CardsGrid';
import ConnectAccount from '../components/ConnectAccount';
import Emoji from '../components/Emoji';
import Modal from '../components/Modal';
import TransactionDetails from '../components/TransactionDetails';

// services
import { connectAccount } from '../services/accounts';
import {
  LEND_CONTRACT_ADDRESS,
  loadLendContract,
} from '../services/contracts';

// constants
import {
  APPROVED_FOR_LENDING,
  AVAILABLE_FOR_BORROW,
  AVAILABLE_FOR_LENDING,
} from '../constants/collectiblesStateConstants';

// utils
import { truncateHexString } from '../utils';

// assets
import erc721Abi from '../assets/abi/erc721.json';


const Title = styled.h1`
  margin: 55px 0px 0px 0px;
  @media (max-width: 700px) {
    margin-top: 20px;
  }
`;

const Subtitle = styled.span`
  margin: 10px 0px 0px 0px;
  font-size: 17px;
  word-break: break-all;
`;

const Page = styled.div`
  padding: 15px;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  text-align: center;
`;

const renderCards = (data, actionTitlePrefix, setModalData, inverted) => (
  <CardsGrid
    data={data}
    renderCardButtonTitle={({ title }) => `${actionTitlePrefix} ${title}`}
    onCardButtonClick={(item) => setModalData(item)}
    invertedCardButton={inverted}
  />
);

const renderInstructions = () => (
  <>
    <h2>Common sense, Smart Contract, When profit</h2>
    <p>To be added.</p>
  </>
);

const renderModalContent = (
  item,
  closeModal,
  connectedAccount,
  setModalData,
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
      onConfirm = () => {
        const ERC721Contract = new window.web3.eth.Contract(erc721Abi, item.tokenAddress);
        ERC721Contract.methods
          .approve(LEND_CONTRACT_ADDRESS, item.tokenId)
          .send({ from: connectedAccountAddress }, (err, hash) => {
            if (err) return;
            const updatedState = { ...item.state, transactionHash: hash };
            updateCollectibleState(item.tokenAddress, item.tokenId, updatedState);
            setModalData({ ...item, state: updatedState });
          })
          .then(() => {
            const updatedState = { type: APPROVED_FOR_LENDING };
            updateCollectibleState(item.tokenAddress, item.tokenId, updatedState);
            setModalData({ ...item, state: updatedState });
          })
          .catch((e) => { console.log(e); });
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

const App = ({
  setConnectedAccount,
  loadCollectibles,
  collectibles,
  connectedAccount,
  updateCollectibleState,
}) => {
  const [loadingApp, setLoadingApp] = useState(true);
  const [appError, setAppError] = useState(null);
  const [modalData, setModalData] = useState(null);
  const closeModal = () => setModalData(null);

  const [lendContract, setLendContract] = useState(null);

  const tryConnectAccount = async (forceEnable) => {
    const { address, networkId } = await connectAccount(forceEnable).catch(() => ({}));

    setConnectedAccount(address, networkId);
    loadCollectibles();

    // load contract ABI
    if (networkId) {
      const loadedContract = await loadLendContract(networkId).catch(() => {});
      if (isEmpty(loadedContract)) setLendContract(loadedContract);
    }

    setLoadingApp(false);
  };

  useEffect(() => {
    tryConnectAccount(false).catch((e) => {
      setLoadingApp(false);
      setAppError(e);
    });
  }, []);

  if (loadingApp) return <Loader style={{ marginTop: 65 }} size="40px" />;

  const tabs = [
    { title: isMobile ? 'Owned' : 'Your nifties', content: renderCards(collectibles.owned, 'Lend your', setModalData) },
    { title: isMobile ? 'Borrow' : 'Borrow ERC-721 from pool', content: renderCards(collectibles.contract, 'Borrow this', setModalData, true) },
    { title: isMobile ? 'FAQ' : 'How this works?', content: renderInstructions() },
  ];

  const isConnected = !isEmpty(connectedAccount);

  const unsupportedBrowser = !global.window || isUndefined(window.web3);

  const connectedAccountAddress = connectedAccount.address
    && truncateHexString(connectedAccount.address);

  const modalContent = modalData && renderModalContent(
    modalData,
    closeModal,
    connectedAccount,
    setModalData,
    updateCollectibleState,
  );

  return (
    <Page>
      <Content>
        <Title>Lend and borrow ERC-721 NFT <Emoji content="🎉" /></Title>
        {appError && (
          <Flash variant="warning" style={{ marginTop: 40 }}>
            <strong>Great Scott!</strong>
            &nbsp;Something went wrong:<br /><br /><code>{appError.toString()}</code>
          </Flash>
        )}
        {unsupportedBrowser && (
          <Flash variant="warning" style={{ marginTop: 40 }}>
            <strong>Future is near!</strong>
            &nbsp;Seems like you are on browser that does not support web3.<br />
          </Flash>
        )}
        {isConnected && (
          <>
            <Subtitle>Account address: <strong>{connectedAccountAddress || 'Not connected'}</strong></Subtitle>
            <small style={{ marginTop: 15 }}><u>Note: Data shown from Rinkeby testnet</u></small>
          </>
        )}
        {!isConnected && <ConnectAccount onClick={() => tryConnectAccount(true)} />}
        <Tabs marginTop={70} data={tabs} />
      </Content>
      <Modal
        show={!isEmpty(modalData)}
        content={modalContent}
      />
    </Page>
  );
};

App.propTypes = {
  setConnectedAccount: PropTypes.func,
  loadCollectibles: PropTypes.func,
  updateCollectibleState: PropTypes.func,
  collectibles: PropTypes.shape({
    owned: PropTypes.array,
    contract: PropTypes.array,
  }),
  connectedAccount: PropTypes.shape({
    address: PropTypes.string,
    networkId: PropTypes.number,
  }),
};

const mapStateToProps = ({
  collectibles,
  connectedAccount,
}) => ({
  collectibles,
  connectedAccount,
});

const mapDispatchToProps = {
  loadCollectibles: loadCollectiblesAction,
  setConnectedAccount: setConnectedAccountAction,
  updateCollectibleState: updateCollectibleStateAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
