import ERC721Lending from '../../../contracts/ERC721Lending.sol';


export const LEND_CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;

export const loadLendContract = async (networkId) => {
  const deployedNetwork = ERC721Lending.networks[networkId.toString()];
  const contract = await new window.web3.eth.Contract(
    ERC721Lending.abi,
    deployedNetwork && deployedNetwork.address,
  );
  return Promise.resolve(contract);
};
