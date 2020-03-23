require('dotenv').config({ path: '../.env' });
const withImages = require('next-images');

module.exports = withImages({
  env: {
    PRODUCTION: process.env.ETHEREUM_NETWORK === 'mainnet',
    PAYABLE_TOKEN_ADDRESS: process.env.PAYABLE_TOKEN_ADDRESS,
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    OPENSEA_API_KEY: process.env.OPENSEA_API_KEY,
  },
});
