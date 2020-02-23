import { combineReducers } from 'redux';
import collectiblesReducer from './collectiblesReducer';
import connectedAccountReducer from './connectedAccountReducer';

const rootReducer = combineReducers({
  collectibles: collectiblesReducer,
  connectedAccount: connectedAccountReducer,
});

export default rootReducer;
