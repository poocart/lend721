import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  Loader,
  Flash,
  Table,
  Button,
  Icon,
} from 'rimble-ui';
import isEmpty from 'lodash/isEmpty';
import isUndefined from 'lodash/isUndefined';
import { isMobile } from 'react-device-detect';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

// actions
import { setConnectedAccountAction } from '../actions/connectedAccountActions';
import {
  loadCollectiblesAction,
  setCollectibleForTransactionAction,
} from '../actions/collectiblesActions';

// components
import Tabs from '../components/Tabs';
import CardsGrid from '../components/CardsGrid';
import ConnectAccount from '../components/ConnectAccount';
import Emoji from '../components/Emoji';
import CollectibleTransactionModal from '../components/CollectibleTransactionModal';

// services
import { connectAccount } from '../services/accounts';

// utils
import {
  ACCOUNT_EMPTY_ADDRESS,
  isCaseInsensitiveMatch,
  filterCollectiblesToBorrow,
  filterLentCollectibles,
  filterOwnedCollectibles,
  truncateHexString,
} from '../utils';


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

const renderLent = (lent, setCollectibleForTransaction) => {
  if (isEmpty(lent)) return null;

  const lentRows = lent.map(({
    title,
    tokenAddress,
    tokenId,
    extra,
  }) => {
    const {
      initialWorth,
      lendInterest,
      durationMilliseconds,
      borrowerAddress,
    } = extra;
    const isBorrowed = !isCaseInsensitiveMatch(ACCOUNT_EMPTY_ADDRESS, borrowerAddress);
    const periodEnded = false;
    const onCancelClick = () => setCollectibleForTransaction(tokenAddress, tokenId);
    return (
      <tr key={`${tokenAddress}${tokenId}`}>
        <td>{title}</td>
        <td>{initialWorth} DAI</td>
        <td>{lendInterest}%</td>
        <td>{durationMilliseconds}</td>
        <td>{isBorrowed ? `Borrowed by ${borrowerAddress}` : 'No'}</td>
        <td>
          {!isBorrowed && (
            <Button.Outline size="small" onClick={onCancelClick}>
              <Icon color="primary" name="Close" size="1em" mr={1} /> Cancel Lending
            </Button.Outline>
          )}
          {isBorrowed && periodEnded && 'Withdraw borrowers collateral'}
        </td>
      </tr>
    );
  });

  return (
    <Table style={{ marginTop: 40 }}>
      <thead>
        <tr>
          <th>Nifty</th>
          <th>Initial worth</th>
          <th>Interest</th>
          <th>Lending period</th>
          <th>Borrowed</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>{lentRows}</tbody>
    </Table>
  );
};

const renderCards = (data, actionTitlePrefix, setCollectibleForTransaction, inverted) => (
  <CardsGrid
    data={data}
    renderCardButtonTitle={({ title }) => `${actionTitlePrefix} ${title}`}
    onCardButtonClick={(item) => setCollectibleForTransaction(item.tokenAddress, item.tokenId)}
    invertedCardButton={inverted}
  />
);

const renderInstructions = () => (
  <>
    <h2>Common sense, Smart Contract, When profit</h2>
    <p>To be added.</p>
  </>
);

const App = ({
  setConnectedAccount,
  loadCollectibles,
  collectibles,
  connectedAccount,
  setCollectibleForTransaction,
}) => {
  const [loadingApp, setLoadingApp] = useState(true);
  const [appError, setAppError] = useState(null);

  const tryConnectAccount = async (forceEnable) => {
    const { address, networkId } = await connectAccount(forceEnable).catch(() => ({}));

    setConnectedAccount(address, networkId);
    loadCollectibles();

    setLoadingApp(false);
  };

  useEffect(() => {
    tryConnectAccount(false).catch((e) => {
      setLoadingApp(false);
      setAppError(e);
    });
  }, []);

  if (loadingApp) return <Loader style={{ marginTop: 65 }} size="40px" />;

  const ownedCollectibles = filterOwnedCollectibles(collectibles.data);
  const lentCollectibles = filterLentCollectibles(collectibles.data);
  const borrowCollectibles = filterCollectiblesToBorrow(collectibles.data);

  const tabs = [
    { title: isMobile ? 'Owned' : 'Your nifties', content: renderCards(ownedCollectibles, 'Lend your', setCollectibleForTransaction) },
    { title: isMobile ? 'Lent' : 'Your lends', content: renderLent(lentCollectibles, setCollectibleForTransaction), hidden: isEmpty(lentCollectibles) },
    { title: isMobile ? 'Borrow' : 'Borrow ERC-721 from pool', content: renderCards(borrowCollectibles, 'Borrow this', setCollectibleForTransaction, true) },
    { title: isMobile ? 'FAQ' : 'How this works?', content: renderInstructions() },
  ];

  const isConnected = !isEmpty(connectedAccount);

  const unsupportedBrowser = !global.window || isUndefined(window.web3);

  const connectedAccountAddress = connectedAccount.address
    && truncateHexString(connectedAccount.address);

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
      <CollectibleTransactionModal />
    </Page>
  );
};

App.propTypes = {
  setConnectedAccount: PropTypes.func,
  loadCollectibles: PropTypes.func,
  setCollectibleForTransaction: PropTypes.func,
  collectibles: PropTypes.shape({
    data: PropTypes.array,
    collectibleTransaction: PropTypes.object,
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
  setCollectibleForTransaction: setCollectibleForTransactionAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
