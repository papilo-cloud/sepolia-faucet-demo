const { expect } = require("chai"); 
const { ethers } = require("hardhat");

describe('Faucet contract', () => {
    let faucetFactory, faucet, owner, user1, user2;

    beforeEach( async () => {
        faucetFactory = await ethers.getContractFactory('Faucet')
        faucet = await faucetFactory.deploy();
        [owner, user1, user2, _] = await ethers.getSigners()

        await faucet.deployed();
        await owner.sendTransaction({
          to: faucet.address,
          value: ethers.utils.parseEther("2.0")
        })
    })

    it('should set the right owner', async () => {
        expect(await faucet.owner()).to.equal(owner.address)
        const balance = await ethers.provider.getBalance(user1.address)
        console.log('Balance', ethers.utils.formatEther(balance))
    })

    it('Should allow withdraw of <= 0.1 ETH ', async () => {
        const amount = ethers.utils.parseEther("0.05")
        const beforeBalance = await ethers.provider.getBalance(user1.address)
        const tx = await faucet.connect(user1).withdraw(amount);
        const receipt = await tx.wait()
        const gasUsed = receipt.gasUsed.mul(receipt.effectiveGasPrice)
        const afterBalance = await ethers.provider.getBalance(user1.address)

        expect(afterBalance).to.be.closeTo(beforeBalance.add(amount).sub(gasUsed), ethers.utils.parseEther("0.01"))

        // const balance = await ethers.provider.getBalance(user1.address)
        // console.log('Balance', ethers.utils.formatEther(balance))
    })

    it('should revert if withdraw > 0.1 ETH', async () => {
        const amount = ethers.utils.parseEther("0.2")
        await expect(faucet.connect(user1).withdraw(amount)).to.be.reverted
    })

    it('should enforce 1 hour rate limit', async () => {
        const amount = ethers.utils.parseEther("0.05")
        await faucet.connect(user1).withdraw(amount)

        await expect(faucet.connect(user1).withdraw(amount)).to.be.reverted
    })

    it('should enforce 0.1 ETH daily quota', async () => {
        const amount1 = ethers.utils.parseEther('0.05')
        const amount2 = ethers.utils.parseEther('0.06')

        await faucet.connect(user1).withdraw(amount1)
        await ethers.provider.send('evm_increaseTime', [3601]) // +1hr
        await ethers.provider.send('evm_mine')
        await expect(faucet.connect(user1).withdraw(amount2)).to.be.reverted
    })

    it('should reset daily quota after 1 day', async () => {
        const amount = ethers.utils.parseEther('0.09')
        await faucet.connect(user1).withdraw(amount)

        await ethers.provider.send('evm_increaseTime', [86401]) // +1 day
        await ethers.provider.send('evm_mine') // mine a block so time takes effect

        await expect(faucet.connect(user1).withdraw(amount)).to.emit(faucet, 'Withdraw')
    })

    it('should allow owner to pause and unpause', async () => {
      const amount = ethers.utils.parseEther('0.05')
        await faucet.connect(owner).togglePaused()
        await expect(faucet.connect(user2).withdraw(amount)).to.be.reverted

        await faucet.connect(owner).togglePaused()
        await expect(faucet.connect(user2).withdraw(amount)).to.emit(faucet, 'Withdraw')
    })
})
