import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Loader, Flash } from 'rimble-ui';
import isEmpty from 'lodash/isEmpty';
import { isMobile } from 'react-device-detect';

// components
import Tabs from '../components/Tabs';
import CardsGrid from '../components/CardsGrid';
import ConnectAccount from '../components/ConnectAccount';
import Emoji from '../components/Emoji';

// services
import { getCollectiblesByAddress } from '../services/collectibles';
import { connectAccount } from '../services/accounts';
import { LEND_CONTRACT_ADDRESS, loadLendContract } from '../services/contracts';


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

const renderCards = (data, actionTitlePrefix, inverted) => (
  <CardsGrid
    data={data}
    renderCardButtonTitle={({ title }) => `${actionTitlePrefix} ${title}`}
    onCardButtonClick={() => {}}
    invertedCardButton={!!inverted}
  />
);

// <Modal isOpen={!!lendTarget || !!borrowTarget}>
//   <Card width={"420px"} p={0}>
//     <Button.Text
//       icononly
//       icon={"Close"}
//       color={"moon-gray"}
//       position={"absolute"}
//       top={0}
//       right={0}
//       mt={3}
//       mr={3}
//       onClick={() => { setLendTarget(null); setBorrowTarget(null); }}
//     />
//     {!isEmpty(lendTarget) && (
//       <Box p={4} mb={3}>
//         <Heading.h3>Lend my {lendTarget.name}</Heading.h3>
//         <Text style={{ marginTop: 10 }}>TODO: lend submit form with allowance transaction and contract set lend data transaction</Text>
//         <Button style={{ marginTop: 25 }}  size="small">1. Approve ERC721 for lend smart contract</Button>
//         <Button style={{ marginTop: 5 }} size="small">2. Set lend data in contract</Button>
//       </Box>
//     )}
//     {!isEmpty(borrowTarget) && (
//       <Box p={4} mb={3}>
//         <Heading.h3>Borrow {borrowTarget.name}</Heading.h3>
//         <Text style={{ marginTop: 10 }}>TODO: borrow details</Text>
//         <Button style={{ marginTop: 25 }}  size="small">1. Send lend smart contract calculated DAI collateral to it</Button>
//         <Button style={{ marginTop: 5 }} size="small">2. Set borrow start</Button>
//       </Box>
//     )}
//   </Card>
// </Modal>

const renderInstructions = () => (
  <>
    <h2>Common sense -> Smart Contract -> When profit</h2>
    <p>To be added.</p>
  </>
);

const App = () => {
  const [loadingApp, setLoadingApp] = useState(true);
  const [appError, setAppError] = useState(null);

  const [connectedNetworkId, setConnectedNetworkId] = useState(0);
  const [connectedAddress, setConnectedAddress] = useState(null);
  // const [lendTarget, setLendTarget] = useState(null);
  // const [borrowTarget, setBorrowTarget] = useState(null);

  const [ownedCollectibles, setOwnedCollectibles] = useState(null);
  const [collectiblesForBorrow, setCollectiblesForBorrow] = useState(null);
  const [lendContract, setLendContract] = useState(null);

  const tryConnectAccount = async (forceEnable) => {
    const { address, networkId } = await connectAccount(forceEnable).catch(() => ({}));

    if (address) setConnectedAddress(address);
    if (networkId) setConnectedNetworkId(networkId);

    // get collectibles of current account
    let accountCollectibles = [];
    if (address) {
      accountCollectibles = await getCollectiblesByAddress(address)
        .catch(() => []);
    }
    setOwnedCollectibles(accountCollectibles);

    // get collectibles of smart contract (in borrow pool)
    const contractCollectibles = await getCollectiblesByAddress(LEND_CONTRACT_ADDRESS)
      .catch(() => []);
    setCollectiblesForBorrow(contractCollectibles);

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
    { title: isMobile ? 'Owned' : 'Your nifties', content: renderCards(ownedCollectibles, 'Lend your') },
    { title: isMobile ? 'Borrow' : 'Borrow ERC-721 from pool', content: renderCards(collectiblesForBorrow, 'Borrow this', true) },
    { title: isMobile ? 'FAQ' : 'How this works?', content: renderInstructions() },
  ];

  const isConnected = !!connectedNetworkId && connectedAddress;

  return (
    <Page>
      <Content>
        <Title>Lend and borrow ERC-721 NFT <Emoji content="🎉" /></Title>
        {appError && (
          <Flash variant="warning" style={{ marginTop: 40 }}>
            <strong>Great Scott!</strong> Something went wrong:<br />
            <code>{appError.toString()}</code>
          </Flash>
        )}
        {isConnected && (
          <>
            <Subtitle>Account address: <strong>{connectedAddress || 'Not connected'}</strong></Subtitle>
            <small style={{ marginTop: 15 }}><u>Note: Data shown from Rinkeby testnet</u></small>
          </>
        )}
        {!isConnected && <ConnectAccount onClick={() => tryConnectAccount(true)} />}
        <Tabs marginTop={70} data={tabs} />
      </Content>
    </Page>
  );
};

export default App;
