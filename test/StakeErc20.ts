import {
    time,
    loadFixture,
  } from "@nomicfoundation/hardhat-toolbox/network-helpers";
  import { expect } from "chai";
  import hre, { ethers } from "hardhat";
  
describe("StakingERC20TokenContract", function () {
  
  // Function to deploy the ERC20 token that will be used for deposits and withdrawals
  async function deployERC20Token() {

    const deployToken = await hre.ethers.getContractFactory("Rose");
    // This line actually deploys the token with the deploy() function
    const token = await deployToken.deploy();

    // Returns the deployed token
    return { token };

  }

  // This function deploys the saveERC20Token contract to the virtual network
  async function deployStakeERC20() {

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, account3] = await hre.ethers.getSigners();

    // We are using loadFixture to grab a snapshot of the deployERC20Token() function returning the token 
    const { token } = await loadFixture(deployERC20Token);

    // We grab the contract that we wish to deploy with the getContractFactory() function
    const stakingContract = await hre.ethers.getContractFactory("StakeERC20");
    // We are deploying the contract with the deploy() function with the token as a parameter because our contract requires a token contract in the constructor
    const stakeERC20 = await stakingContract.deploy(token);

    await stakeERC20.connect(owner).addStakingPlan("diamond", 15, 1);

    // here we are returning the deployed token, the saveERC20 contract, owner and otherAccount variables
    return { token, stakeERC20, owner, otherAccount, account3 };
  }

  // async function ownerCreateUserPlan() {

  //   // We are using loadFixture to grab a snapshot of the deployERC20Token() function returning the token 
  //   const { owner, stakeERC20 } = await loadFixture(deployStakeERC20);
    
  //   const plan = await stakeERC20.connect(owner).addStakingPlan("diamond", 15, 1);

  //   return { plan };

  // }


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


  // describe("Plan", function () {
  //   it("Plan count should be 1", async function () {

  //     const { stakeERC20 } = await loadFixture(deployStakeERC20);

  //     expect(stakeERC20.stakePlans.length).to.equal(1);
      
  //   })
  // })

  describe("Stake", function () {

    it("It should stake successfuly", async function () {

      const { stakeERC20, otherAccount, token, owner } = await loadFixture(deployStakeERC20);

      // declare transfer amount
      const transferAmount = ethers.parseUnits("1000", 18);
      
      // transfer some funds to the staker
      await token.transfer(otherAccount, transferAmount);

      // running check to ensure that the balance of the otherAccount which was 0 b4 the transfer will be equal to the transferAmount 
      expect(await token.balanceOf(otherAccount)).to.equal(transferAmount);

      // NOW TO STAKE WE NEED TO APPROVE THE CONTRACT TO MOVE THE MONEY ON THEACCOUNT'S BEHALF 

      // running the approve function with the connect method and passing the receiving contract and the amount to be deposited
      await token.connect(otherAccount).approve(stakeERC20, transferAmount)

      // Here we are using current balance of the staker before the stake function is called
      const otherAccountBalanceBefore = await token.balanceOf(otherAccount);
      
      // Declaring depositAmount in ^18 units with the parseUnits method. passing the value and how many decimal points
      const depositAmount = ethers.parseUnits("100", 18);

      const planId = 0;

      // using connect to call the deposit function as the otherAccount because the owner of the contract is not allowed to call the deposit Function
      await stakeERC20.connect(otherAccount).stake(depositAmount, planId);

      expect(await token.balanceOf(otherAccount)).to.equal(otherAccountBalanceBefore - depositAmount);

      expect(await stakeERC20.getContractBalance()).to.equal(depositAmount);

      await expect(stakeERC20.connect(otherAccount).stake(depositAmount, planId))
        .to.emit(stakeERC20, "StakedSuccessfully")
        .withArgs(otherAccount.address, depositAmount);

    });


    it("Should revert on zero staking", async function () {
      const { stakeERC20, otherAccount } = await loadFixture(deployStakeERC20);

      const depositAmount = ethers.parseUnits("0", 18);

      const planId = 0;

      await expect(
        stakeERC20.connect(otherAccount).stake(depositAmount, planId)
      ).to.be.revertedWith("Can't stake zero amount");
    });

    it("Should revert on invalid plan index", async function () {
      const { stakeERC20, otherAccount } = await loadFixture(deployStakeERC20);

      const depositAmount = ethers.parseUnits("10", 18);

      const planId = 3;

      await expect(
        stakeERC20.connect(otherAccount).stake(depositAmount, planId)
      ).to.be.revertedWith("Invalid plan index");
    });

    it("Should revert on insufficient Balance", async function () {
      const { stakeERC20, account3 } = await loadFixture(deployStakeERC20);

      const depositAmount = ethers.parseUnits("100", 18);

      const planId = 0;

      await expect(
        stakeERC20.connect(account3).stake(depositAmount, planId)
      ).to.be.revertedWith("Insufficient balance");
      
    });

    // it("Total staked should equal deposit amount", async function () {

    //   const { stakeERC20 } = await loadFixture(deployStakeERC20);

    //   const depositAmount = ethers.parseUnits("100", 18);

    //   expect(
    //     await stakeERC20.totalStaked()
    //   ).to.equal(depositAmount);

    // });

    

  });



//   describe("Withdraw", function () {
//     it("Should withdraw successfully", async function () {
//       const { saveERC20, owner, otherAccount, token } = await loadFixture(deployStakeERC20);

//       // Transfer ERC20 token from owner to otherAccount
//       const trfAmount = ethers.parseUnits("100", 18);
//       await token.transfer(otherAccount, trfAmount);
//       expect(await token.balanceOf(otherAccount)).to.equal(trfAmount);

//       // otherAccount approves contract address to spend some tokens
//       await token.connect(otherAccount).approve(saveERC20, trfAmount);

//       const otherAccountBalBefore = await token.balanceOf(otherAccount);

//       // otherAccount deposits into SaveERC20 contract
//       const depositAmount = ethers.parseUnits("10", 18);

//       await saveERC20.connect(otherAccount).deposit(depositAmount);

//       expect(await token.balanceOf(otherAccount)).to.equal(otherAccountBalBefore - depositAmount);

//       expect(await saveERC20.connect(otherAccount).myBalance()).to.equal(depositAmount);
//       expect(await saveERC20.getContractBalance()).to.equal(depositAmount);

//       // otherAccount withdraw from contract
//       const initBalBeforeWithdrawal = await token.balanceOf(otherAccount);
//       const withdrawAmount = ethers.parseUnits("5", 18);

//       await saveERC20.connect(otherAccount).withdraw(withdrawAmount);

//       const balAfterWithdrawal = await token.balanceOf(otherAccount);

//       expect(await saveERC20.getContractBalance()).to.equal(depositAmount - withdrawAmount);

//       expect(await saveERC20.connect(otherAccount).myBalance()).to.equal(depositAmount - withdrawAmount);
      
//       expect(await token.balanceOf(otherAccount)).to.equal(initBalBeforeWithdrawal + withdrawAmount);
//     });
//   });

});
