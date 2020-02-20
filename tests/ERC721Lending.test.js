const { accounts, contract:  contractLoader } = require('@openzeppelin/test-environment');
const { expect } = require('chai');

const MyERC721Full = contractLoader.fromArtifact('MyERC721Full');
const ERC721Lending = contractLoader.fromArtifact('ERC721Lending');

describe('ERC721Lending', function () {
  const [ owner, lender ] = accounts;

  beforeEach(async function () {
    // this.lendingContract = await P2P_ERC721_Lending.new();
    this.targetERC721 = await MyERC721Full.new({ from: owner });
    this.targetERC721Lending = await ERC721Lending.new({ from: owner });
    // console.log('name: ', await this.targetERC721.name());
    // await this.targetERC721._mint(lender, 12345)
  });

  it('lendForTime()', async function () {
    // await this.contract.lendForTime(42, { from: owner });
    // expect((await this.contract.retrieve()).toString()).to.equal('42');
  });
});
