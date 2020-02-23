import {
  SET_OWNED_COLLECTIBLES,
  SET_CONTRACT_COLLECTIBLES,
} from '../constants/collectiblesConstants';

const initialState = {
  owned: null,
  contract: null,
};

const collectiblesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_OWNED_COLLECTIBLES:
      return { ...state, owned: action.payload };
    case SET_CONTRACT_COLLECTIBLES:
      return { ...state, contract: action.payload };
    default:
      return { ...state };
  }
};

export default collectiblesReducer;
