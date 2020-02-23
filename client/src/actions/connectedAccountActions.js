// constants
import { SET_CONNECTED_ACCOUNT } from '../constants/connectedAccountConstants';


export const setConnectedAccountAction = (address, networkId) => ({
  type: SET_CONNECTED_ACCOUNT,
  payload: { address, networkId },
});
