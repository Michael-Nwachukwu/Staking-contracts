// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

contract StakeETH {
    // state vars that holds owner address
    address owner;

    // total amount of stakes in the contract
    uint256 public totalStaked;

    // struct to define a staking plan
    struct StakingPlan {
        string name;
        uint256 duration;
        uint8 rate;
        uint256 totalRewards;
        uint256 totalStaked;
    }

    // struct to define the structure of a stake
    struct Stake {
        StakingPlan plan;
        uint256 amount;
        uint256 startTime;
        uint256 unlockTime;
        uint256 rewards;
    }

    // array of type stakingplan to hold all the stakeplans created by the owner
    StakingPlan[] public stakePlans;

    // mapping to create all stakes made in the contract.
    mapping (address => Stake) public stakes;

    // contract balance
    mapping(address => uint) public balances;

    // constructor function that defines the owner at deploy time
    constructor() {
        owner = msg.sender;
    }

    // modifier to allow onlyOwner call function it is applied to
    modifier onlyOwner() {
        require(owner == msg.sender, "Not owner");
        _;
    }

    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event OwnerDeposit(uint256 amount);
    
    // Function to deposit Ether
    // uint256 public totalRewardsDeposited;

    function depositRewards() external payable onlyOwner {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        emit OwnerDeposit(msg.value);
    }

    // Function to add a new staking plan to the contract
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
   
    // Function to stake Ether to the contract
    function stake(uint256 _plan) external payable {
        // First run sanity check to ensure non-address zero interaction
        require(msg.sender != address(0), "Zero address detected");

        // require stakeAmount to be above 0 to avoid gas guzzling
        require(msg.value > 0, "Can't stake zero amount");

        // make sure we are passing a valid/existing plan index
        require(_plan < stakePlans.length, "Invalid plan index");

        // Grab the plan the user is subscribing to from the array of plans
        StakingPlan storage stakePlan = stakePlans[_plan];

        // Add the users stake to the pool of stakes in the mapping
        stakes[msg.sender] = Stake({
            plan: stakePlan,
            amount: msg.value,
            startTime: block.timestamp,
            unlockTime: block.timestamp + stakePlan.duration,
            rewards: 0
        });

        // add the amount to the totalStaked of the staking plan to keep track of each plans total subscriptions
        stakePlan.totalStaked += msg.value;
        // add the amount to the General contracts totalstaked to keep track of all stakes in the contract
        totalStaked += msg.value;

        // emit event staked
        emit Staked(msg.sender, msg.value);
    }

    // Function to calculate and update rewards
    function updateRewards() private {
        // Grab the stake of the tx caller from the mapping
        Stake storage userStake = stakes[msg.sender];

        // grab the amount the user staked
        uint256 stakeAmount = userStake.amount;
        // grab the users duration by digging into the stakes, get the plan which is a struct that has duration
        uint256 stakingDuration = userStake.plan.duration;
        // grab the rewardRate of the users subscribed plan
        uint8 rewardRate = userStake.plan.rate;
        
        // calculate for the users reward and assign it to the user's stake.rewards for easy retrival
        // SI of P x R x T / 
        userStake.rewards = stakeAmount * rewardRate * stakingDuration / (365 days * 100);
    }

    function unStake() external {
        // call the function to update the users rewards
        updateRewards();

        // Grabbing a users stake and staking plan from the mapping of stakes
        Stake memory userStake = stakes[msg.sender];

        // ensuring that the user actually has a stake in the specified plan
        require(userStake.amount > 0, "No stake found");

        // Time check to reject immature unstakes
        require(block.timestamp >= userStake.unlockTime, "Staking period not ended");

        // get the user's principal stake
        uint256 stakeBalance = userStake.amount;
        // get the rewards in their stake which must have been updated by the updateRewards() function
        uint256 reward = userStake.rewards;
        // calculate totalPayout by adding principal to rewards
        uint256 totalPayOut = stakeBalance + reward;

        // Check if contract has enough Ether to pay
        require(address(this).balance >= totalPayOut, "Insufficient contract balance");

        // Reset user's stake
        delete stakes[msg.sender];

        // Transfer staked Ether and rewards back to user
        (bool success, ) = payable(msg.sender).call{value: totalPayOut}("");
        require(success, "Transfer failed");

        // emit withdrawn event
        emit Withdrawn(msg.sender, totalPayOut);
    }

    // Function to get contract's Ether balance
    function getContractBalance() external view returns(uint256) {
        return address(this).balance;
    }

    // Function to allow contract to receive Ether
    receive() external payable {}
}