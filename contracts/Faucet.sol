// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.28;

contract Faucet {
    address public owner;
    mapping (address => uint) public lastWithDrawTime;
    mapping (address => bool) public hasWithdrawn;

    uint public uniqueUsers;
    bool public paused = false;

    struct User {
        uint lastReset;
        uint dailyTotal;
    }
    mapping (address => User) public users;

    event Withdraw(address indexed user, uint amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }
    modifier whenNotPaused() {
        require(!paused, "Paused");
        _;
    }
    modifier rateLimiter() {
        require(block.timestamp - lastWithDrawTime[msg.sender] > 1 hours, "Please wait for 1 hour before withdrawing again." );
        _;
        lastWithDrawTime[msg.sender] = block.timestamp;
    }

    constructor () {
        owner = msg.sender;
    }
    
    function togglePaused() public onlyOwner {
        paused = !paused;
    }
    function withdraw(uint _amount) public whenNotPaused rateLimiter {
        require(_amount <= 0.1 ether, "Max 0.1 ETH per withdrawal");

        // Daily quota
        User storage user = users[msg.sender];
        if (block.timestamp > user.lastReset + 1 days ) {
            user.lastReset = block.timestamp;
            user.dailyTotal = 0;
        }

        require(user.dailyTotal + _amount < 0.1 ether, "Daily quota exceeded");
        user.dailyTotal += _amount;

        // Unique user tracking
        if (!hasWithdrawn[msg.sender]) { 
            hasWithdrawn[msg.sender] = true;
            uniqueUsers += 1;
        }

        payable(msg.sender).transfer(_amount);
        emit Withdraw(msg.sender, _amount);
    }

    receive() external payable {}
}