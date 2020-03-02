import lend721Abi from '../assets/abi/lend721.json';


export const LEND_CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
export const PAYABLE_TOKEN_ADDRESS = process.env.PAYABLE_TOKEN_ADDRESS;

export const loadLendContract = async () => {
  const contract = await new window.web3.eth.Contract(lend721Abi, LEND_CONTRACT_ADDRESS);
  return Promise.resolve(contract);
};
