# ERC-721 lending Smart Contract

[![Netlify Status](https://api.netlify.com/api/v1/badges/1aabbf05-4f48-4b12-85d0-cbfc073fe20f/deploy-status)](https://app.netlify.com/sites/wonderful-roentgen-888dcf/deploys)

Current stage: **alpha**

### To do before beta
- [x] Client dApp: show lent data
- [ ] Client dApp: show borrowed data
- [x] Client dApp borrower: call DAI approve method
- [x] Client dApp borrower: call borrow method
- [x] Client dApp lender: call ERC-721 approve method
- [x] Client dApp lender: call ERC-721 lend set method
- [ ] Show success or error messages on each transaction
- [x] Set duration for lendings
- [ ] Email reminders for borrower or lender
- [ ] Deploy Smart Contract to mainnet
- [ ] Verify Smart Contract in mainnet Etherscan

### 💡 Description
LEND721 is Ethereum Smart Contract that allows lending ERC-721 Smart Contracts (NFT)
and gain interest from it. On the other hand it allows to borrow same NFT's that are
set for lending by paying collateral to LEND721 which handles the lend process.

### 🏠 Smart Contract addresses across Ethereum networks
- Mainnet: TBA
- Rinkeby: [0x1762fd547d6C286a174dD62b6A6fACFAc064A0A0](https://rinkeby.etherscan.io/address/0x1762fd547d6C286a174dD62b6A6fACFAc064A0A0)

`Note: Smart Contract calls are proxied to main Smart Contract so calls destination is the Proxy Smart Contract itself.`

### 🏹 Deployed client dApp
- Mainnet: TBA
- Rinkeby: [https://rinkeby.lend721.app](https://rinkeby.lend721.app)
