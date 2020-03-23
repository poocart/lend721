require('dotenv').config();

const HDWalletProvider = require('@truffle/hdwallet-provider');

module.exports = {
  networks: {
    development: {
      protocol: 'http',
      host: 'localhost',
      port: 8545,
      gas: 5000000,
      gasPrice: 5e9,
      networkId: '*',
    },
    rinkeby: {
      provider: () => new HDWalletProvider(process.env.CONTRACT_OWNER_MNEMOMNIC, `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`),
      networkId: 4,
      gasPrice: 10e9
    }
  },
};
