# ERC-721 lending Smart Contract

Current stage: **beta**

### ✅ To do
- [x] Client dApp: show lent data
- [x] Client dApp: show borrowed data
- [x] Client dApp borrower: call DAI approve method
- [x] Client dApp borrower: call borrow method
- [x] Client dApp lender: call ERC-721 approve method
- [x] Client dApp lender: call ERC-721 lend set method
- [x] Set duration for lendings
- [ ] Put lenders addresses with lent tokens somwehere outside of smart contract (UX improvement)
- [ ] Show message when collateral was already taken on expired lend
- [ ] Show success or error messages on each transaction
- [ ] Email reminders for borrower or lender
- [ ] Deploy Smart Contract to mainnet
- [ ] Verify Smart Contract in mainnet Etherscan
- [ ] Allow edit lend

### 💡 Description
LEND721 is Ethereum Smart Contract that allows lending ERC-721 Smart Contracts (NFT)
and gain interest from it. On the other hand it allows to borrow same NFT's that are
set for lending by paying collateral to LEND721 which handles the lend process.

### 🏠 Smart Contract addresses across Ethereum networks
- Mainnet: [0xA133541435cAeB964f572132acd8FEAC3Ed1D80B](https://etherscan.io/address/0xA133541435cAeB964f572132acd8FEAC3Ed1D80B)
- Rinkeby: [0x1762fd547d6C286a174dD62b6A6fACFAc064A0A0](https://rinkeby.etherscan.io/address/0x1762fd547d6C286a174dD62b6A6fACFAc064A0A0)

`Note: Smart Contract calls are proxied to main Smart Contract so calls destination is the Proxy Smart Contract itself.`

### 🏹 Deployed client dApp on Netlify
- Mainnet: [https://lend721.app](https://lend721.app)
- Rinkeby: [https://rinkeby.lend721.app](https://rinkeby.lend721.app)

### 📐 Deploy dApp on Arweave
1. Setup Arweave:
1.1. `npm i -g arweave-deploy`
1.2. `arweave key-create ~/arweave-key.json`
1.3 `arweave key-save ~/arweave-key.json`
2. Get AR tokens from [Arweave team](https://www.arweave.org/get-involved/community).
3. Deploy  from `client` by running `yarn deploy`.
