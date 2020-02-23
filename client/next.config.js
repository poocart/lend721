require('dotenv').config({ path: '../.env' });
const withImages = require('next-images');

module.exports = withImages({
  webpack: (config) => {
    // solidity loader
    config.module.rules.push({
      test: /.sol$/,
      use: [
        { loader: 'json-loader' },
        {
          loader: '@openzeppelin/solidity-loader',
          options: {
            network: process.env.WEB3_NETWORK,
            disabled: true,
          },
        },
      ],
    });
    return config;
  },
  env: {
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
  },
});
