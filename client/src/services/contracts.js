import lend721Abi from '../../../abi/lend721.json';


export const LEND_CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

let payabaleTokenAddress;
let lendContract;

export const loadLendContract = async () => {
  if (!lendContract) {
    lendContract = await new window.web3.eth.Contract(lend721Abi, LEND_CONTRACT_ADDRESS);
  }
  if (!payabaleTokenAddress) {
    try {
      payabaleTokenAddress = await lendContract.methods.acceptedPayTokenAddress().call();
    } catch (e) {
      //
    }
  }
  return Promise.resolve(lendContract);
};

export const getPayableTokenAddress = () => payabaleTokenAddress;
