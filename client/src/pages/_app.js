import React from 'react';
import NextApp from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from 'styled-components';
import { Loader, theme } from 'rimble-ui';
import { applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import thunk from 'redux-thunk';
import { persistStore, persistReducer } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import reduxPersistStorage from 'redux-persist/lib/storage';

// root reducer
import rootReducer from '../reducers/rootReducer';


const globalStyle = `
  body {
    font-family: 'Ubuntu', sans-serif;
    background: #fff;
    color: #3D0158;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  input, textarea {
    font-family: 'Ubuntu', sans-serif;
  }
`;

const customTheme = Object.assign({}, theme, {
  colors: {
    ...theme.colors,
    primary: '#3D0158',
  },
  fonts: {
    ...theme.fonts,
    sansSerif: '"Ubuntu", sans-serif',
  },
});

const persistConfig = {
  key: 'root',
  storage: reduxPersistStorage,
};
const persistedReducer = persistReducer(persistConfig, rootReducer);
const reduxStore = createStore(persistedReducer, {}, applyMiddleware(thunk));
const reduxPersistor = persistStore(reduxStore);

class App extends NextApp {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <Provider store={reduxStore}>
        <ThemeProvider theme={customTheme}>
          <Head>
            <meta name="viewport" content="width=device-width,maximum-scale=1,initial-scale=1" />
            <title>Lend and borrow ERC-721 NFT on Ethereum | lend721.app</title>
            <link
              href="https://fonts.googleapis.com/css?family=Ubuntu&display=swap"
              rel="stylesheet"
            />
            <style>{globalStyle}</style>
          </Head>
          <PersistGate
            loading={<Loader style={{ marginTop: 65 }} size="40px" />}
            persistor={reduxPersistor}
          >
            <Component {...pageProps} />
          </PersistGate>
        </ThemeProvider>
      </Provider>
    );
  }
}

export default withRedux(() => reduxStore)(App);
