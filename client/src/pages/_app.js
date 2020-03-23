import React from 'react';
import NextApp from 'next/app';
import Head from 'next/head';
import { ThemeProvider } from 'styled-components';
import { Loader, theme } from 'rimble-ui';
import { applyMiddleware, createStore } from 'redux';
import { Provider } from 'react-redux';
import withRedux from 'next-redux-wrapper';
import thunk from 'redux-thunk';
import { persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';

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

let reduxPersistor;

const createModifiedStore = (initialState, { isServer }) => {
  const store = createStore(rootReducer, initialState || {}, applyMiddleware(thunk));
  if (isServer) return store;
  reduxPersistor = persistStore(store);
  return store;
};

class App extends NextApp {
  render() {
    const { Component, pageProps, store } = this.props;
    return (
      <Provider store={store}>
        <ThemeProvider theme={customTheme}>
          <Head>
            <meta charSet="utf-8" />
            <title>Lend and borrow ERC-721 NFT on Ethereum | lend721.app</title>
            <meta name="viewport" content="width=device-width,maximum-scale=1,initial-scale=1" />
            <meta name="theme-color" content="#000000" />
            <link rel="icon" href="favicon.ico" />
            <link rel="apple-touch-icon" href="logo192.png" />
            <link rel="manifest" href="manifest.json" />
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

export default withRedux(createModifiedStore)(App);
