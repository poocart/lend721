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
import moment from 'moment';

// actions
import { setConnectedAccountAction } from '../actions/connectedAccountActions';
import {
  loadCollectiblesAction,
  loadLenderBorrowedCollectiblesAction,
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
  filterCollectiblesToBorrow,
  filterLentCollectibles,
  filterOwnedCollectibles,
  truncateHexString,
  isPendingCollectibleTransaction,
  formatLendDuration,
  getLendDurationTitle,
  filterBorrowedCollectibles,
  isProduction,
  isEmptyAddress,
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

const LogoWrapper = styled.div`
  position: relative;
`;

const LogoLabel = styled.div`
  border: 3px solid #000;
  background: #ffcc00;
  position: absolute;
  border-radius: 12px;
  bottom: -5px;
  padding: 5px 12px;
  font-size: 10px;
  color: #000;
  right: 75px;
  font-weight: 800;
`;

const ContentLink = styled.a`
  font-weight: 800;
  &, &:visited, &:hover { color: inherit; }
  margin: 0 5px;
`;

const renderSettingsTable = (data, setCollectiblePreviewTransaction, isBorrowersTable) => {
  if (isEmpty(data)) return null;

  const collectibleRows = data.map(({
    title,
    tokenAddress,
    tokenId,
    extra,
  }) => {
    const {
      initialWorth,
      earningGoal,
      durationHours,
      borrowedAtTimestamp,
      borrowerAddress,
      lenderAddress,
      lenderClaimedCollateral,
    } = extra;

    const isBorrowed = !isEmpty(borrowerAddress)
      && !isEmptyAddress(borrowerAddress);

    const onCancelLendClick = () => setCollectiblePreviewTransaction(tokenAddress, tokenId);
    const onClaimCollateralClick = () => setCollectiblePreviewTransaction(tokenAddress, tokenId);
    const onStopBorrowingClick = () => setCollectiblePreviewTransaction(tokenAddress, tokenId);

    const duration = formatLendDuration(durationHours);
    const durationType = getLendDurationTitle(durationHours);

    const borrowingDeadlineDate = !!borrowedAtTimestamp
      && durationHours
      && moment(+borrowedAtTimestamp * 1000).add(durationHours, 'h');

    const deadlinePassed = borrowingDeadlineDate
      && borrowingDeadlineDate.isBefore(moment());

    return (
      <tr key={`${tokenAddress}${tokenId}`}>
        <td>{title}</td>
        {!isBorrowersTable && <td>{duration} {durationType}</td>}
        {isBorrowersTable && <td>{borrowingDeadlineDate.format('YYYY-MM-DD [at] HH:mm')}</td>}
        {!isBorrowersTable && <td>{earningGoal} DAI</td>}
        {!isBorrowersTable && <td>{initialWorth} DAI</td>}
        <td>
          {!isBorrowersTable && (isBorrowed ? `Borrowed by ${truncateHexString(borrowerAddress)}` : 'No')}
          {isBorrowersTable && `Borrowed from ${truncateHexString(lenderAddress)}`}
        </td>
        <td>
          {!isBorrowersTable && !isBorrowed && (
            <Button.Outline size="small" onClick={onCancelLendClick}>
              <Icon color="primary" name="Close" size="1em" mr={1} /> Cancel Lending
            </Button.Outline>
          )}
          {!isBorrowersTable && isBorrowed && (
            <>
              {!deadlinePassed && (
                <Flash mt={2} mb={2} variant="info">
                  <small>
                    You will be able to claim borrower&apos;s collateral
                    after {borrowingDeadlineDate.format('YYYY-MM-DD [at] HH:mm')}&nbsp;
                    if borrower won&apos;t return your ERC-721.
                  </small>
                </Flash>
              )}
              {deadlinePassed && (
                <Button.Outline size="small" onClick={onClaimCollateralClick}>
                  <Icon color="primary" name="Close" size="1em" mr={1} /> Claim Borrower&apos;s Collateral
                </Button.Outline>
              )}
            </>
          )}
          {isBorrowersTable && !lenderClaimedCollateral && (
            <Button.Outline size="small" onClick={onStopBorrowingClick}>
              <Icon color="primary" name="Close" size="1em" mr={1} /> Stop Borrowing
            </Button.Outline>
          )}
          {isBorrowersTable && !!lenderClaimedCollateral && (
            <>
              <p>
                We&apos;re sorry, but NFT had to be<br />
                returned by {borrowingDeadlineDate.format('YYYY-MM-DD [at] HH:mm')}&nbsp;<br />
                and lender already claimed your collateral.
              </p>
              <Button.Outline mb={3} size="small" onClick={onStopBorrowingClick}>
                <Icon color="primary" name="Close" size="1em" mr={1} /> Stop Borrowing
              </Button.Outline>
            </>
          )}
        </td>
      </tr>
    );
  });

  return (
    <Table style={{ marginTop: 40 }}>
      <thead>
        <tr>
          <th>ERC-721 nifty</th>
          {!isBorrowersTable && <th>Max. lending duration</th>}
          {isBorrowersTable && <th>Max. lending until</th>}
          {!isBorrowersTable && <th>Earning goal for duration</th>}
          {!isBorrowersTable && <th>Initial worth</th>}
          <th>Borrowed</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>{collectibleRows}</tbody>
    </Table>
  );
};

const renderCards = (
  data,
  actionTitlePrefix,
  setCollectiblePreviewTransaction,
  inverted,
  pendingTransaction,
  web3Unavailable,
) => (
  <CardsGrid
    data={data}
    checkIfDisabled={
      ({
        tokenAddress,
        tokenId,
      }) => web3Unavailable
        || isPendingCollectibleTransaction(pendingTransaction, tokenAddress, tokenId)
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

const nftFinanceSaleAlertStorageKey = '@lend721:nftFinaneSaleAlertHidden';

const App = ({
  setConnectedAccount,
  loadCollectibles,
  collectibles,
  connectedAccount,
  setCollectiblePreviewTransaction,
  loadLenderBorrowedCollectibles,
}) => {
  const nftFinanceSaleAlertDismissed = window.localStorage.getItem(nftFinanceSaleAlertStorageKey);

  const [loadingApp, setLoadingApp] = useState(true);
  const [appError, setAppError] = useState(null);
  const [showNftFinanceSaleAlert, setShowNftFinanceSaleAlert] = useState(!nftFinanceSaleAlertDismissed);

  const hideNftFinanceSaleAlert = () => {
    window.localStorage.setItem(nftFinanceSaleAlertStorageKey, '1');
    setShowNftFinanceSaleAlert(false);
  };

  const unsupportedBrowser = !window || isUndefined(window.web3);

  const tryConnectAccount = async (forceEnable) => {
    const { address, networkId } = await connectAccount(forceEnable).catch(() => ({}));

    setConnectedAccount(address, networkId);
    loadCollectibles();
    loadLenderBorrowedCollectibles();

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
  const borrowedCollectibles = collectibles.data && filterBorrowedCollectibles(collectibles.data);
  const borrowCollectibles = collectibles.data && filterCollectiblesToBorrow(collectibles.data);

  const tabs = [
    { title: isMobile ? 'Owned' : 'Your nifties', content: renderCards(ownedCollectibles, 'Lend your', setCollectiblePreviewTransaction, false, collectibles.pendingTransaction, unsupportedBrowser) },
    { title: isMobile ? 'Lent' : 'Your lends', content: renderSettingsTable(lentCollectibles, setCollectiblePreviewTransaction), hidden: isEmpty(lentCollectibles) },
    { title: isMobile ? 'Borrowed' : 'Your borrows', content: renderSettingsTable(borrowedCollectibles, setCollectiblePreviewTransaction, true), hidden: isEmpty(borrowedCollectibles) },
    { title: isMobile ? 'Borrow' : 'Borrow ERC-721 from pool', content: renderCards(borrowCollectibles, 'Borrow this', setCollectiblePreviewTransaction, true, collectibles.pendingTransaction, unsupportedBrowser) },
    { title: isMobile ? 'FAQ' : 'How this works?', link: 'https://medium.com/@deimantasspucys/lend-and-borrow-ethereum-erc-721-tokens-with-lend721-platform-32f1a22905fd' },
  ];

  const isConnected = !isEmpty(connectedAccount.address);
  const isConnectedToRinkeby = connectedAccount.networkId === 4;

  let networkName;
  switch (connectedAccount.networkId) {
    case 1:
      networkName = 'Ethereum mainnet';
      break;
    case 4:
      networkName = 'Rinkeby testnet';
      break;
    default:
      networkName = 'unknown network';
      break;
  }

  const defaultActiveTabIndex = isConnected ? 0 : 3;

  const connectedAccountAddress = connectedAccount.address
    && truncateHexString(connectedAccount.address);

  return (
    <Page>
      <Content>
        {!!showNftFinanceSaleAlert && (
          <Flash variant="success" style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              Check <ContentLink href="https://nft.finance/sale" title="NFT.finance sale" target="_blank">NFT.finance</ContentLink> top level domain name sale!
              <Icon color="primary" name="Close" size="1em" ml={2} style={{ cursor: 'pointer' }} onClick={hideNftFinanceSaleAlert} />
            </div>
          </Flash>
        )}
        <LogoWrapper>
          <Logo src={lend721Logo} />
          <LogoLabel>BETA VERSION</LogoLabel>
        </LogoWrapper>
        {appError && (
          <Flash variant="warning" style={{ marginTop: 40 }}>
            <strong>Great Scott!</strong>
            &nbsp;Something went wrong:<br /><br /><code>{appError.toString()}</code>
          </Flash>
        )}
        {unsupportedBrowser && (
          <Flash variant="warning" style={{ marginTop: 40 }}>
            <strong>Oopsy!</strong>
            &nbsp;Seems like you are on browser that does not support <u>web3</u>.<br />
          </Flash>
        )}
        {isConnected && (
          <>
            <Subtitle>
              Account address: <strong>{connectedAccountAddress || 'Not connected'}</strong>
            </Subtitle>
            <small style={{ marginTop: 15 }}><u>Connected to: {networkName}</u></small>
          </>
        )}
        {!isProduction && !isConnectedToRinkeby && !unsupportedBrowser && (
          <Flash variant="danger" style={{ marginTop: 40, marginBottom: 20 }}>
            <strong>This is test environment!</strong>
            &nbsp;Seems like you are connected, but not on Rinkeby.<br />
          </Flash>
        )}
        {!isConnected && !unsupportedBrowser && <ConnectAccount onClick={() => tryConnectAccount(true)} />}
        <Tabs marginTop={40} defaultActiveTabIndex={defaultActiveTabIndex} data={tabs} />
      </Content>
      <CollectibleTransactionModal />
    </Page>
  );
};

App.propTypes = {
  setConnectedAccount: PropTypes.func,
  loadCollectibles: PropTypes.func,
  setCollectiblePreviewTransaction: PropTypes.func,
  loadLenderBorrowedCollectibles: PropTypes.func,
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
  loadLenderBorrowedCollectibles: loadLenderBorrowedCollectiblesAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(App);
