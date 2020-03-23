import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import reduxPersistLocalStorage from 'redux-persist/lib/storage';
import collectiblesReducer from './collectiblesReducer';
import connectedAccountReducer from './connectedAccountReducer';


const collectiblesPersistConfig = {
  key: 'lend721:collectibles',
  storage: reduxPersistLocalStorage,
  whitelist: ['pendingTransaction'],
};

const rootReducer = combineReducers({
  collectibles: persistReducer(collectiblesPersistConfig, collectiblesReducer),
  connectedAccount: connectedAccountReducer,
});

export default rootReducer;
