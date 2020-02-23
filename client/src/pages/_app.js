import React from 'react';
import NextApp from 'next/app';
import Head from 'next/head';


const globalStyle = `
  body {
    font-family: 'Ubuntu', sans-serif;
    background: #fff;
    color: #3D0158;
    display: flex;
    justify-content: center;
    align-items: center;
  }
`;

class App extends NextApp {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <>
        <Head>
          <meta name="viewport" content="width=device-width,maximum-scale=1,initial-scale=1" />
          <title>Lend and borrow ERC-721 NFT on Ethereum | lend721.app</title>
          <link
            href="https://fonts.googleapis.com/css?family=Ubuntu&display=swap"
            rel="stylesheet"
          />
          <style>{globalStyle}</style>
        </Head>
        <Component {...pageProps} />
      </>
    );
  }
}

export default App;
