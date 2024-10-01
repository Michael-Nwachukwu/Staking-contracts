import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StakeEtherModule = buildModule("StakeEtherModule", (m) => {

  const StakeERC20 = m.contract("StakeETH");

  return { StakeERC20 };

});

export default StakeEtherModule;

// npx hardhat verify --network lisk-sepolia --constructor-args args.js DEPLOYED_CONTRACT_ADDRESS