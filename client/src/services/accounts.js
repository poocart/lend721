import Web3 from 'web3';


export const connectAccount = async (forceEnable) => {
  if (window.ethereum) {
    window.web3 = new Web3(window.ethereum);
    if (forceEnable) {
      try {
        await window.ethereum.enable();
      } catch (error) {
        //
      }
    }
  } else if (window.web3) {
    window.web3 = new Web3(window.web3.currentProvider);
  } else {
    return Promise.resolve({ address: null, networkId: null });
  }

  const accountAddress = await window.web3.eth.getAccounts().then((accounts) => accounts[0]);
  const networkId = Number(window.web3.givenProvider.networkVersion);
  return Promise.resolve({ address: accountAddress, networkId });
};
