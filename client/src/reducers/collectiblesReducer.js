import {
  SET_OWNED_COLLECTIBLES,
  SET_CONTRACT_COLLECTIBLES,
  SET_COLLECTIBLE_TRANSACTION,
  RESET_COLLECTIBLE_TRANSACTION,
} from '../constants/collectiblesConstants';

const initialState = {
  owned: null,
  contract: null,
  collectibleTransaction: null,
};

const collectiblesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_OWNED_COLLECTIBLES:
      return { ...state, owned: action.payload };
    case SET_CONTRACT_COLLECTIBLES:
      return { ...state, contract: action.payload };
    case SET_COLLECTIBLE_TRANSACTION:
      return { ...state, collectibleTransaction: action.payload };
    case RESET_COLLECTIBLE_TRANSACTION:
      return { ...state, collectibleTransaction: null };
    default:
      return { ...state };
  }
};

export default collectiblesReducer;
