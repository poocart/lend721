import isEmpty from 'lodash/isEmpty';

// constants
import {
  SET_CONNECTED_ACCOUNT,
  SET_CONNECTED_ACCOUNT_BALANCE,
} from '../constants/connectedAccountConstants';

// services
import { PAYABLE_TOKEN_ADDRESS } from '../services/contracts';

// assets
import erc20Abi from '../assets/abi/erc20.json';

// utils
import { parseTokenAmount } from '../utils';


export const setConnectedAccountBalanceAction = (balance) => ({
  type: SET_CONNECTED_ACCOUNT_BALANCE,
  payload: balance,
});

export const setConnectedAccountAction = (address, networkId) => async (dispatch) => {
  dispatch({
    type: SET_CONNECTED_ACCOUNT,
    payload: { address, networkId },
  });
  if (isEmpty(address)) return;
  try {
    const ERC20Contract = new window.web3.eth.Contract(erc20Abi, PAYABLE_TOKEN_ADDRESS);
    const accountBalance = await ERC20Contract.methods.balanceOf(address).call();
    const accountBalanceFormatted = parseTokenAmount(accountBalance);
    dispatch(setConnectedAccountBalanceAction(accountBalanceFormatted));
  } catch (e) {
    //
  }
};
