import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { expect } from "chai";
  import hre, { ethers } from "hardhat";
  
describe("StakingERC20TokenContract", function () {
  
  // Function to deploy the ERC20 token that will be used for deposits and withdrawals
  async function deployERC20Token() {

    // Contracts are deployed using the first signer/account by default

    // This line grabs the contract that we wish to deploy with the getContractFactory() function
    const deployToken = await hre.ethers.getContractFactory("Rose");
    // This line actually deploys the token with the deploy() function
    const token = await deployToken.deploy();

    // Returns the deployed token
    return { token };

  }

  // This function deploys the saveERC20Token contract to the virtual network
  async function deployStakeERC20() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await hre.ethers.getSigners();

    // We are using loadFixture to grab a snapshot of the deployERC20Token() function returning the token 
    const { token } = await loadFixture(deployERC20Token);

    // We grab the contract that we wish to deploy with the getContractFactory() function
    const stakeToken = await hre.ethers.getContractFactory("StakeERC20");
    // We are deploying the contract with the deploy() function with the token as a parameter because our contract requires a token contract in the constructor
    const stakeERC20 = await stakeToken.deploy(token);

    // here we are returning the deployed token, the saveERC20 contract, owner and otherAccount variables
    return { token, stakeERC20, owner, otherAccount };
  }




  describe("Deployment", function () {

    // we want to make sure that it is the owner that depolyed the contract
    it("It should check if owner is correct", async function () {

      // destructuring the variables we are returning from our deployStakeERC20 function with the loadFixture
      const { stakeERC20, owner } = await loadFixture(deployStakeERC20);

      // running the actual check for the owner() available from our contract as a publuc variable to be equal to the owner of the deployStakeERC20 deployment 
      expect(await stakeERC20.owner()).to.equal(owner);
    });

    // We want to check that the deployed token address is equal to the parameter tokenaddress we are passing to our saveERC20 contract
    it("It should check if contract address is correct", async function () {

      // destructuring the variables we are returning from our deployStakeERC20 function with the loadFixture
      const { stakeERC20, token } = await loadFixture(deployStakeERC20);

      // running the check
      expect(await stakeERC20.tokenAddress()).to.equal(token);

    });

  });

});
