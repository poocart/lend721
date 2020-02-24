import {
  SET_COLLECTIBLES,
  ADD_COLLECTIBLES,
  SET_COLLECTIBLE_TRANSACTION,
  RESET_COLLECTIBLE_TRANSACTION,
} from '../constants/collectiblesConstants';

const initialState = {
  data: null,
  collectibleTransaction: null,
};

const collectiblesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_COLLECTIBLES:
      return { ...state, data: action.payload };
    case ADD_COLLECTIBLES:
      return { ...state, data: [...(state.data || []), ...action.payload] };
    case SET_COLLECTIBLE_TRANSACTION:
      return { ...state, collectibleTransaction: action.payload };
    case RESET_COLLECTIBLE_TRANSACTION:
      return { ...state, collectibleTransaction: null };
    default:
      return { ...state };
  }
};

export default collectiblesReducer;
