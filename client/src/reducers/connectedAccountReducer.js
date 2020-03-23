import {
  SET_CONNECTED_ACCOUNT,
  SET_CONNECTED_ACCOUNT_BALANCE,
} from '../constants/connectedAccountConstants';


const initialState = {
  balance: 0,
};

const collectiblesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_CONNECTED_ACCOUNT:
      return { ...state, ...action.payload };
    case SET_CONNECTED_ACCOUNT_BALANCE:
      return { ...state, balance: action.payload };
    default:
      return state;
  }
};

export default collectiblesReducer;
