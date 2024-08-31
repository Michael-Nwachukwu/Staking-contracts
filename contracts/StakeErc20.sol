// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakeERC20 {
    address owner;
    address tokenAddress;

    uint256 public totalStaked;

    struct StakingPlan {
        string name;
        uint256 duration;
        uint8 rate;
        uint256 totalRewards;
        uint256 totalStaked;
    }

    struct Stake {
        StakingPlan plan;
        uint256 amount;
        uint256 startTime;
        uint256 unlockTime;
        uint256 rewards;
    }

    StakingPlan[] public stakePlans;

    mapping (address => Stake) public stakes;

    constructor(address _tokenAddress) {
        owner = msg.sender;
        tokenAddress = _tokenAddress;
    }

    modifier onlyOwner() {
        require(owner == msg.sender, "Not owner");
        _;
    }

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);

    // Function to add a new staking plan
    function addStakingPlan(string memory _name, uint _duration, uint8 _rate) external onlyOwner {
        StakingPlan memory newPlan = StakingPlan({
            name: _name,
            duration: _duration,
            rate: _rate,
            totalRewards: 0,
            totalStaked: 0
        });

        stakePlans.push(newPlan);
    }
   
    // Function to stake tokens
    function stake(uint256 _amount, uint256 _plan) external {
        require(msg.sender != address(0), "Zero address detected");
        require(_amount > 0, "Can't stake zero amount");
        require(_plan < stakePlans.length, "Invalid plan index");
 
        uint256 _userTokenBalance = IERC20(tokenAddress).balanceOf(msg.sender);
        require(_userTokenBalance >= _amount, "Insufficient balance");

        // Transfer tokens from user to contract
        require(IERC20(tokenAddress).transferFrom(msg.sender, address(this), _amount), "Transfer failed");

        StakingPlan storage stakePlan = stakePlans[_plan];

        stakes[msg.sender] = Stake({
            plan: stakePlan,
            amount: _amount,
            startTime: block.timestamp,
            unlockTime: block.timestamp + stakePlan.duration,
            rewards: 0
        });

        stakePlan.totalStaked += _amount;
        totalStaked += _amount;

        emit Staked(msg.sender, _amount);
    }

    // Function to calculate and update rewards
    function updateRewards() private {
        Stake storage userStake = stakes[msg.sender];

        uint256 stakeAmount = userStake.amount;
        uint256 stakingDuration = userStake.plan.duration;
        uint8 rewardRate = userStake.plan.rate;

        userStake.rewards = stakeAmount * rewardRate * stakingDuration / (365 days * 100);
    }

    // function updateRewards() private {
    //     Stake storage userStake = stakes[msg.sender];

    //     uint256 stakeAmount = userStake.amount;
    //     uint256 stakingDuration = block.timestamp - userStake.startTime; // Calculate actual staking duration
    //     uint8 rewardRate = userStake.plan.rate;

    //     userStake.rewards = (stakeAmount * rewardRate * stakingDuration) / (365 days * 100);
    // }


    function unStake() external payable {

        Stake storage userStake = stakes[msg.sender];

        require(userStake.amount > 0, "No stake found");
        require(block.timestamp >= userStake.unlockTime, "Staking period not ended");

        updateRewards();

        uint256 stakeBalance = userStake.amount;
        uint256 reward = userStake.rewards;
        uint256 totalPayOut = stakeBalance + reward;

        // Check if contract has enough tokens to pay
        uint256 contractBalance = IERC20(tokenAddress).balanceOf(address(this));
        require(contractBalance >= totalPayOut, "Insufficient contract balance");

        // Transfer staked tokens and rewards back to user
        (bool sent) = IERC20(tokenAddress).transfer(msg.sender, totalPayOut);
        require(sent, "Transfer failed");

        // Update state variables
        totalStaked -= stakeBalance;
        userStake.plan.totalStaked -= stakeBalance;
        userStake.plan.totalRewards += reward;

        // Reset user's stake
        delete stakes[msg.sender];

        emit Withdrawn(msg.sender, totalPayOut);
    }


    // Function to get contract's token balance
    function getContractBalance() external view onlyOwner returns(uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }
}
