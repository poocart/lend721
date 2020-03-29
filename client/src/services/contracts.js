import axios from 'axios';
import get from 'lodash/get';

// utils
import { EMPTY_ADDRESS, pause } from '../utils';

// assets
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

export const getBorrowerOwnedEntriesOfLender = (lenderAddress, attempt) => {
  const url = `https://api.thegraph.com/subgraphs/id/${process.env.THEGRAPH_ID}`;
  return axios.post(url, {
    timeout: 5000,
    query: `
      {
        erc721ForLends(where: {
          lender: "${lenderAddress}"
          borrower_not: "${EMPTY_ADDRESS}"
        }) {
          id
          durationHours
          initialWorth
          earningGoal
          borrowedAtTimestamp
          lender
          borrower
          lenderClaimedCollateral
          tokenAddress
          tokenId
        }
      }
    `,
  })
    .then(({ data }) => get(data, 'data.erc721ForLends', []))
    .catch(async () => {
      if (attempt === 5) return [];
      await pause(attempt);
      return getBorrowerOwnedEntriesOfLender(lenderAddress, attempt || 2);
    });
};
