import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';
import { Loader, MetaMaskButton, Modal, Button, Text, Heading, Box, Card } from 'rimble-ui'
import axios from 'axios';
import Web3 from 'web3';
import isEmpty from 'lodash/isEmpty';
import ERC721Lending from '../../../contracts/ERC721Lending.sol';

const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css?family=Ubuntu&display=swap');
  body {
    font-family: 'Ubuntu', sans-serif;
    background: #fff;
    color: #3D0158;
    display: flex;
    justify-content: center;
  }
`;

const Title = styled.h1`
  margin: 55px 0px 0px 0px;
`;

const Subtitle = styled.span`
  margin: 10px 0px 0px 0px;
  font-size: 17px;
`;

const SingleTab = styled.a`
  background: #3D0158;
  padding: 15px 40px;
  cursor:pointer;
  &, &:visited, &:hover { color: #fff; }
  ${({ disabled }) => disabled
    ? `opacity: 0.5;`
    : `&:hover { opacity: 0.8; }`
  }
  font-size: 20px;
  ${({ active, disabled }) => active && !disabled && `
    opacity: 0.8;
    font-weight: 800;
  `}
`;

const TabsRow = styled.div`
  display: flex;
  flex-direction: row;
  border-radius: 25px;
  overflow: hidden;
  margin-top: 70px;
  justify-content: flex-start;
  align-items: center;
`;

const Page = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
`;

const Collectibles = styled.div`
  display: flex;
  justify-content: flex-start;
  margin-top: 30px;
  flex-wrap: wrap;
  align-items: flex-start;
  max-width: 700px;
`;

const CollectibleCard = styled.div`
  ${({ backgroundColor }) => backgroundColor && `background: #${backgroundColor};`}
  border: 1px solid #000;
  border-radius: 5px;
  width: 170px;
  text-align: center;
  flex-wrap: wrap;
  padding: 15px;
  margin: 15px;
`;

const CollectibleButtonOrange = styled.span`
  display: block;
  background: #F9564F;
  padding: 8px 10px;
  cursor: pointer;
  color: #fff;
  &:hover { background: #bb342e; }
  margin-top: 15px;
  border-radius: 5px;
  overflow: hidden;
`;

const CollectibleButtonGreen = styled.span`
  display: block;
  background: #2d9f13;
  padding: 8px 10px;
  cursor: pointer;
  color: #fff;
  &:hover { background: #02763a; }
  margin-top: 15px;
  border-radius: 5px;
  overflow: hidden;
`;

const CollectibleImage = styled.img`
  max-width: 100%;
  display: inline-block;
`;

const tabsConstants = {
  YOUR: 'YOUR',
  BORROW: 'BORROW',
};

const lendContractAddress = '0x1762fd547d6C286a174dD62b6A6fACFAc064A0A0';

const renderOwnedCollectible = (collectible, setLendTarget) => {
  const {
    name,
    background_color,
    token_id,
    image_url,
    image_preview_url,
    asset_contract: { address },
  } = collectible;
  if (!(image_url || image_preview_url) || !name) return null;
  const uuid = `${token_id}-${address}`;
  return (
      <CollectibleCard key={uuid} backgroundColor={background_color}>
        <CollectibleImage src={image_url || image_preview_url} />
        <CollectibleButtonOrange onClick={() => setLendTarget(collectible)}><span>Lend my {name}</span></CollectibleButtonOrange>
      </CollectibleCard>
  )
};

const renderBorrowCollectible = (collectible, setLendTarget) => {
  const {
    name,
    background_color,
    token_id,
    image_url,
    image_preview_url,
    asset_contract: { address },
  } = collectible;
  if (!(image_url || image_preview_url) || !name) return null;
  const uuid = `${token_id}-${address}`;
  return (
      <CollectibleCard key={uuid} backgroundColor={background_color}>
        <CollectibleImage src={image_url || image_preview_url} />
        <CollectibleButtonGreen onClick={() => setLendTarget(collectible)}><span>Borrow {name}</span></CollectibleButtonGreen>
      </CollectibleCard>
  )
};

const renderTab = (title, tabKey, activeTab, isAccountConnected, setTab) => (
  <SingleTab
    disabled={!isAccountConnected}
    active={activeTab === tabKey}
    onClick={() => isAccountConnected ? setTab(tabKey) : {}}>
    {title}
  </SingleTab>
);

const loadCollectibles = (address) => {
  const url = `https://rinkeby-api.opensea.io/api/v1/assets/?owner=${address}&exclude_currencies=true&order_by=listing_date&order_direction=asc`;
  return axios.get(url, {
    timeout: 5000,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-API-KEY': 'af952dd5eb0940a9bfc68a1a9ecec4a6',
    },
  })
    .then(({ data: { assets: collectibles = [] } }) => collectibles)
    .catch(() => []);
};

const tryConnectAccount = async (forceEnable) => {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    if (forceEnable) {
      try {
        await window.ethereum.enable();
      } catch (error) {
        //
      }
    }
  } else if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider);
  }
  const accountAddress = await window.web3.eth.getAccounts().then((accounts) => accounts[0]);
  const networkId = parseInt(window.web3.givenProvider.networkVersion);
  return Promise.resolve({ address: accountAddress, networkId })
};

const loadLendContract = async (networkId) => {
  const deployedNetwork = ERC721Lending.networks[networkId.toString()];
  const contract = await new window.web3.eth.Contract(ERC721Lending.abi, deployedNetwork && deployedNetwork.address);
  return Promise.resolve(contract);
};

const App = () => {
  const [loadingApp, setLoadingApp] = useState(true);

  const [networkId, setNetworkId] = useState(0);
  const [address, setAddress] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [lendTarget, setLendTarget] = useState(null);
  const [borrowTarget, setBorrowTarget] = useState(null);

  const [ownedCollectibles, setOwnedCollectibles] = useState(null);
  const [collectiblesForBorrow, setCollectiblesForBorrow] = useState(null);
  const [lendContract, setLendContract] = useState(null);

  const [activeTab, setActiveTab] = useState(null);

  const connectAccount = (forceEnable) => {
    tryConnectAccount(forceEnable)
      .then(async ({ address: connectedAddress, networkId: connectedNetworkId }) => {
        setLoadingApp(false);
        if (!forceEnable && (!connectedAddress || connecting)) return;
        setAddress(connectedAddress);
        setNetworkId(connectedNetworkId);
        loadCollectibles(address).then(setOwnedCollectibles);
        loadCollectibles(lendContractAddress).then(setCollectiblesForBorrow);
        loadLendContract(connectedNetworkId).then(setLendContract);
        setActiveTab(tabsConstants.YOUR);
        setConnecting(false);
      });
  };

  const isConnected = networkId === 4 && address;

  if (loadingApp && !connecting) {
    setConnecting(true);
    connectAccount(false);
  }

  const showLoading = isConnected && (!ownedCollectibles || !lendContract);

  return (
    <>
      <GlobalStyle />
      {loadingApp && <Loader style={{ marginTop: 65 }} size="40px" />}
      {!loadingApp && (
        <Page>
          <Title>lend721 🎉</Title>
          {isConnected && (
            <>
              <Subtitle>Connected account: <strong>{address || 'Not connected'}</strong></Subtitle>
              <small style={{ marginTop: 15 }}><u>Note: Connected to Rinkeby testnet</u></small>
              <TabsRow>
                {renderTab('Your nifties', tabsConstants.YOUR, activeTab, isConnected, setActiveTab)}
                {renderTab('Borrow ERC721 from others', tabsConstants.BORROW, activeTab, isConnected, setActiveTab)}
              </TabsRow>
              {!showLoading && activeTab === tabsConstants.YOUR && !!ownedCollectibles && (
                <>
                  {!isEmpty(ownedCollectibles) && <Collectibles>{ownedCollectibles.map((collectible) => renderOwnedCollectible(collectible, setLendTarget))}</Collectibles>}
                  {isEmpty(ownedCollectibles) && <span style={{ marginTop: 55, fontSize: 16 }}>Oops! No owned ERC721 tokens found <span style={{ fontSize: 32 }}>🤷‍</span></span>}
                </>
              )}
              {!showLoading && activeTab === tabsConstants.BORROW && (
                <>
                  {!isEmpty(collectiblesForBorrow) && <Collectibles>{collectiblesForBorrow.map((collectible) => renderBorrowCollectible(collectible, setBorrowTarget))}</Collectibles>}
                  {isEmpty(collectiblesForBorrow) && <span style={{ marginTop: 55, fontSize: 16 }}>Oops! No ERC721 tokens found to borrow <span style={{ fontSize: 32 }}>🤷‍</span></span>}
                </>
              )}
            </>
          )}
          {!isConnected && (
            <>
              <MetaMaskButton.Outline onClick={() => connectAccount(true)} style={{ marginTop: 55 }}>Connect with MetaMask</MetaMaskButton.Outline>
              <small style={{ marginTop: 25 }}>Note: Must be connected to Rinkeby testnet</small>
            </>
          )}
          {showLoading && <Loader style={{ marginTop: 65 }} size="40px" />}
          <Modal isOpen={!!lendTarget || !!borrowTarget}>
            <Card width={"420px"} p={0}>
              <Button.Text
                icononly
                icon={"Close"}
                color={"moon-gray"}
                position={"absolute"}
                top={0}
                right={0}
                mt={3}
                mr={3}
                onClick={() => { setLendTarget(null); setBorrowTarget(null); }}
              />
              {!isEmpty(lendTarget) && (
                <Box p={4} mb={3}>
                  <Heading.h3>Lend my {lendTarget.name}</Heading.h3>
                  <Text style={{ marginTop: 10 }}>TODO: lend submit form with allowance transaction and contract set lend data transaction</Text>
                  <Button style={{ marginTop: 25 }}  size="small">1. Approve ERC721 for lend smart contract</Button>
                  <Button style={{ marginTop: 5 }} size="small">2. Set lend data in contract</Button>
                </Box>
              )}
              {!isEmpty(borrowTarget) && (
                <Box p={4} mb={3}>
                  <Heading.h3>Borrow {borrowTarget.name}</Heading.h3>
                  <Text style={{ marginTop: 10 }}>TODO: borrow details</Text>
                  <Button style={{ marginTop: 25 }}  size="small">1. Send lend smart contract calculated DAI collateral to it</Button>
                  <Button style={{ marginTop: 5 }} size="small">2. Set borrow start</Button>
                </Box>
              )}
            </Card>
          </Modal>
        </Page>
      )}
    </>
  );
};

export default App;
