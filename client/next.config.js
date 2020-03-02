require('dotenv').config({ path: '../.env' });
const withImages = require('next-images');

module.exports = withImages({
  env: {
    PAYABLE_TOKEN_ADDRESS: process.env.PAYABLE_TOKEN_ADDRESS,
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  },
});
