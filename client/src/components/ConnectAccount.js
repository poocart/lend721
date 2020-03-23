import React from 'react';
import PropTypes from 'prop-types';
import { MetaMaskButton } from 'rimble-ui';

import { isProduction } from '../utils';


const ConnectAccount = ({ onClick }) => (
  <>
    <MetaMaskButton.Outline
      onClick={onClick}
      style={{ marginTop: 55 }}
    >
      Connect with MetaMask
    </MetaMaskButton.Outline>
    {!isProduction && (
      <small style={{ marginTop: 25 }}>
        Note: Seems you&apos;re in test environment,
        make sure you&apos;re connected to Rinkeby testnet
      </small>
    )}
  </>
);

ConnectAccount.propTypes = {
  onClick: PropTypes.func,
};

export default ConnectAccount;
