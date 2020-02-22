import React from 'react';
import PropTypes from 'prop-types';
import { MetaMaskButton } from 'rimble-ui';


const ConnectAccount = ({ onClick }) => (
  <>
    <MetaMaskButton.Outline
      onClick={onClick}
      style={{ marginTop: 55 }}
    >
      Connect with MetaMask
    </MetaMaskButton.Outline>
    <small style={{ marginTop: 25 }}>Note: Must be connected to Rinkeby testnet</small>
  </>
);

ConnectAccount.propTypes = {
  onClick: PropTypes.func,
};

export default ConnectAccount;
