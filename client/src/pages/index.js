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
  setCollectiblePreviewTransactionAction,
} from '../actions/collectiblesActions';

// components
import Tabs from '../components/Tabs';
import CardsGrid from '../components/CardsGrid';
import ConnectAccount from '../components/ConnectAccount';
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
  isPendingCollectibleTransaction,
  formatLendDuration,
  getLendDurationTitle,
} from '../utils';

// assets
import lend721Logo from '../assets/images/lend721.png';

const Subtitle = styled.span`
  margin: 10px 0px 0px 0px;
  font-size: 17px;
  word-break: break-all;
`;

const Logo = styled.img`
  width: 250px;
  display: inline-block;
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

const CardLoadingWrapper = styled.div`
`;

const renderLent = (lent, setCollectiblePreviewTransaction) => {
  if (isEmpty(lent)) return null;

  const lentRows = lent.map(({
    title,
    tokenAddress,
    tokenId,
    extra,
  }) => {
    const {
      initialWorth,
      earningGoal,
      durationHours,
      borrowerAddress,
    } = extra;

    const isBorrowed = !isEmpty(borrowerAddress)
      && !isCaseInsensitiveMatch(ACCOUNT_EMPTY_ADDRESS, borrowerAddress);

    const durationEnded = false;
    const onCancelClick = () => setCollectiblePreviewTransaction(tokenAddress, tokenId);
    const duration = formatLendDuration(durationHours);
    const durationType = getLendDurationTitle(durationHours);
    return (
      <tr key={`${tokenAddress}${tokenId}`}>
        <td>{title}</td>
        <td>{duration} {durationType}</td>
        <td>{earningGoal} DAI</td>
        <td>{initialWorth} DAI</td>
        <td>{isBorrowed ? `Borrowed by ${borrowerAddress}` : 'No'}</td>
        <td>
          {!isBorrowed && (
            <Button.Outline size="small" onClick={onCancelClick}>
              <Icon color="primary" name="Close" size="1em" mr={1} /> Cancel Lending
            </Button.Outline>
          )}
          {isBorrowed && durationEnded && 'Withdraw borrowers collateral'}
        </td>
      </tr>
    );
  });

  return (
    <Table style={{ marginTop: 40 }}>
      <thead>
        <tr>
          <th>ERC-721 nifty</th>
          <th>Max. lending duration</th>
          <th>Earning goal for duration</th>
          <th>Initial worth</th>
          <th>Borrowed</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>{lentRows}</tbody>
    </Table>
  );
};

const renderCards = (
  data,
  actionTitlePrefix,
  setCollectiblePreviewTransaction,
  inverted,
  pendingTransaction,
) => (
  <CardsGrid
    data={data}
    checkIfDisabled={
      ({
        tokenAddress,
        tokenId,
      }) => isPendingCollectibleTransaction(pendingTransaction, tokenAddress, tokenId)
    }
    renderCardButtonTitle={({ title, tokenAddress, tokenId }) => {
      const isPendingTransaction = isPendingCollectibleTransaction(
        pendingTransaction,
        tokenAddress,
        tokenId,
      );
      if (isPendingTransaction) {
        return (
          <CardLoadingWrapper>
            <Loader style={{ display: 'inline-block', top: 2 }} mr={2} size={15} color="#000" />
            <span style={{ color: '#000' }}>Pending transaction...</span>
          </CardLoadingWrapper>
        );
      }
      return `${actionTitlePrefix} ${title}`;
    }}
    onCardButtonClick={(item) => setCollectiblePreviewTransaction(item.tokenAddress, item.tokenId)}
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
  setCollectiblePreviewTransaction,
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

  const ownedCollectibles = collectibles.data && filterOwnedCollectibles(collectibles.data);
  const lentCollectibles = collectibles.data && filterLentCollectibles(collectibles.data);
  const borrowCollectibles = collectibles.data && filterCollectiblesToBorrow(collectibles.data);

  const tabs = [
    { title: isMobile ? 'Owned' : 'Your nifties', content: renderCards(ownedCollectibles, 'Lend your', setCollectiblePreviewTransaction, false, collectibles.pendingTransaction) },
    { title: isMobile ? 'Lent' : 'Your lends', content: renderLent(lentCollectibles, setCollectiblePreviewTransaction), hidden: isEmpty(lentCollectibles) },
    { title: isMobile ? 'Borrow' : 'Borrow ERC-721 from pool', content: renderCards(borrowCollectibles, 'Borrow this', setCollectiblePreviewTransaction, true, collectibles.pendingTransaction) },
    { title: isMobile ? 'FAQ' : 'How this works?', content: renderInstructions() },
  ];

  const isConnected = !isEmpty(connectedAccount.address);
  const isConnectedRinkeby = connectedAccount.networkId === 4;

  const unsupportedBrowser = !global.window || isUndefined(window.web3);

  const connectedAccountAddress = connectedAccount.address
    && truncateHexString(connectedAccount.address);

  return (
    <Page>
      <Content>
        <Logo src={lend721Logo} />
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
        {!isConnectedRinkeby && (
          <Flash variant="danger" style={{ marginTop: 40, marginBottom: 20 }}>
            <strong>We&apos;re testing!</strong>
            &nbsp;Seems like you are connected, but not on Rinkeby.<br />
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
  setCollectiblePreviewTransaction: PropTypes.func,
  collectibles: PropTypes.shape({
    data: PropTypes.array,
    pendingTransaction: PropTypes.object,
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
  setCollectiblePreviewTransaction: setCollectiblePreviewTransactionAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
