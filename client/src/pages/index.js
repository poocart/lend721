import React, { useState } from 'react';
import styled from 'styled-components';
import { Loader } from 'rimble-ui';
import isUndefined from 'lodash/isUndefined';

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
`;

const Subtitle = styled.span`
  margin: 10px 0px 0px 0px;
  font-size: 17px;
`;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
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

const App = () => {
  const [loadingApp, setLoadingApp] = useState(true);

  const [networkId, setNetworkId] = useState(0);
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  // const [lendTarget, setLendTarget] = useState(null);
  // const [borrowTarget, setBorrowTarget] = useState(null);

  const [ownedCollectibles, setOwnedCollectibles] = useState(null);
  const [collectiblesForBorrow, setCollectiblesForBorrow] = useState(null);
  const [lendContract, setLendContract] = useState(null);

  const tabs = [
    { title: 'Your nifties', content: renderCards(ownedCollectibles, 'Lend your') },
    { title: 'Borrow ERC721 from others', content: renderCards(collectiblesForBorrow, 'Borrow this', true) },
  ];

  const tryConnectAccount = async (forceEnable) => {
    const {
      address: connectedAddress,
      networkId: connectedNetworkId,
    } = await connectAccount(forceEnable).catch(() => ({}));

    setLoadingApp(false);

    if (!forceEnable && (!connectedAddress || connecting)) return;

    setAddress(connectedAddress);
    setNetworkId(connectedNetworkId);
    getCollectiblesByAddress(connectedAddress).then(setOwnedCollectibles);
    getCollectiblesByAddress(LEND_CONTRACT_ADDRESS).then(setCollectiblesForBorrow);
    loadLendContract(connectedNetworkId).then(setLendContract);

    setConnecting(false);
  };

  const isConnected = !!networkId && address;

  // check for global.window as it might be not yet ready
  if (loadingApp && !connecting && !isUndefined(global.window)) {
    setConnecting(true);
    tryConnectAccount(false);
  }

  if (loadingApp) return <Loader style={{ marginTop: 65 }} size="40px" />;

  return (
    <Page>
      <Title>Lend and borrow ERC-721 NFT <Emoji content="🎉" /></Title>
      {isConnected && (
        <>
          <Subtitle>Connected account: <strong>{address || 'Not connected'}</strong></Subtitle>
          <small style={{ marginTop: 15 }}><u>Note: Connected to Rinkeby testnet</u></small>
          <Tabs marginTop={70} data={tabs} />
        </>
      )}
      {!isConnected && <ConnectAccount onClick={() => tryConnectAccount(true)} />}
    </Page>
  );
};

export default App;
