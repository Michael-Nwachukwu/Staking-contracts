import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const StakeERC20Module = buildModule("StakeERC20Module", (m) => {

  const tokenAddress = "0x9f3eB17a20a4E57Ed126F34061b0E40dF3a4f5C2";

  const StakeERC20 = m.contract("StakeERC20", [tokenAddress],);

  return { StakeERC20 };

});

export default StakeERC20Module;

// npx hardhat verify --network lisk-sepolia --constructor-args args.js DEPLOYED_CONTRACT_ADDRESS