# Ethereum ERC-721 tokens lending platform

![](https://github.com/poocart/lend721/blob/develop/preview.png)

## 💡 Description
LEND721 is Ethereum Smart Contract that allows lending ERC-721 Smart Contracts (NFT)
and gain interest from it. On the other hand it allows to borrow same NFT's that are
set for lending by paying collateral to LEND721 which handles the lend process.

Current stage: **beta**.

## 🏹 Deployed client dApps on Netlify
- Mainnet: [https://lend721.app](https://lend721.app)
- Rinkeby: [https://rinkeby.lend721.app](https://rinkeby.lend721.app)
- Binance smart chain: [https://dreamy-bell-874b39.netlify.app/](https://dreamy-bell-874b39.netlify.app/)

## 🏠 Smart Contract addresses across Ethereum networks
- Mainnet: [0xA133541435cAeB964f572132acd8FEAC3Ed1D80B](https://etherscan.io/address/0xA133541435cAeB964f572132acd8FEAC3Ed1D80B)
- Rinkeby: [0x1762fd547d6C286a174dD62b6A6fACFAc064A0A0](https://rinkeby.etherscan.io/address/0x1762fd547d6C286a174dD62b6A6fACFAc064A0A0)
- Binance smart chain testnet [0x0263BbFDff5F04C8323681205B3a608d5359Ff66](https://testnet.bscscan.com/address/0x0263BbFDff5F04C8323681205B3a608d5359Ff66)

```
Note: Smart Contract calls are proxied to main Smart Contract so calls destination is the Proxy Smart Contract itself.
```

## ✅ To do
- [ ] Client dApp: show lent data
- [ ] Client dApp: show borrowed data
- [ ] Client dApp borrower: call DAI approve method
- [ ] Client dApp borrower: call borrow method
- [ ] Client dApp lender: call ERC-721 approve method
- [ ] Client dApp lender: call ERC-721 lend set method
- [ ] Set duration for lendings
- [ ] Deploy Smart Contract to mainnet
- [ ] Verify Smart Contract in mainnet Etherscan
- [ ] Put lenders addresses with lent tokens somwehere outside of smart contract (UX improvement) – (note: solved with thegraph.com)
- [ ] Show message when collateral was already taken on expired lend
- [ ] Show success or error messages on each transaction
- [ ] Email reminders for borrower or lender
- [ ] Allow edit lend




