require('dotenv').config({ path: '../.env' });
const withImages = require('next-images');

module.exports = withImages({
  env: {
    PRODUCTION: process.env.ETHEREUM_NETWORK === 'mainnet',
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    OPENSEA_API_KEY: process.env.OPENSEA_API_KEY,
    SUBGRAPH_NAME: process.env.SUBGRAPH_NAME,
  },
});
