import { SET_CONNECTED_ACCOUNT } from '../constants/connectedAccountConstants';


const initialState = {};

const collectiblesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_CONNECTED_ACCOUNT:
      return { ...state, ...action.payload };
    default:
      return { ...state };
  }
};

export default collectiblesReducer;
