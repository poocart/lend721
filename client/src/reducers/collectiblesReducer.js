import {
  SET_COLLECTIBLES,
  ADD_COLLECTIBLES,
  SET_COLLECTIBLE_PREVIEW_TRANSACTION,
  RESET_COLLECTIBLE_PREVIEW_TRANSACTION,
  SET_COLLECTIBLE_PENDING_TRANSACTION,
  RESET_COLLECTIBLE_PENDING_TRANSACTION,
} from '../constants/collectibleConstants';


const initialState = {
  data: null,
  previewTransaction: null,
};

const collectiblesReducer = (state = initialState, action) => {
  switch (action.type) {
    case SET_COLLECTIBLES:
      return { ...state, data: action.payload };
    case ADD_COLLECTIBLES:
      return { ...state, data: [...(state.data || []), ...action.payload] };
    case SET_COLLECTIBLE_PREVIEW_TRANSACTION:
      return { ...state, previewTransaction: action.payload };
    case RESET_COLLECTIBLE_PREVIEW_TRANSACTION:
      return { ...state, previewTransaction: null };
    case SET_COLLECTIBLE_PENDING_TRANSACTION:
      return { ...state, pendingTransaction: action.payload };
    case RESET_COLLECTIBLE_PENDING_TRANSACTION:
      return { ...state, pendingTransaction: null };
    default:
      return state;
  }
};

export default collectiblesReducer;
