require('dotenv').config({ path: '../.env' });
const withImages = require('next-images');

module.exports = withImages({
  env: {
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  },
});
