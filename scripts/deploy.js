const { Contract } = require('ethers')
const { ethers } = require('hardhat')

async function main() {
    const [deployer] = await ethers.getSigners()
    console.log(`Deploying contracts with the account: ${deployer.address}`)

    const balance = await deployer.getBalance()
    console.log(`Account balance: ${balance.toString()}`)

    const Faucet = await ethers.getContractFactory('Faucet')
    const faucet = await Faucet.deploy()
    console.log(`Faucet address: ${faucet.address}`)

    await faucet.deployed()
}

main()
    .then(() => process.exit())
    .catch(err => {
        console.error(err);
        process.exit(1)
    })


// async function main() {

//   const url = process.env.SEPOLIA_RPC_URL;

//   let artifacts = await hre.artifacts.readArtifact("Faucet");

//   const provider = new ethers.providers.JsonRpcProvider(url);

//   let privateKey = process.env.PRIVATE_KEY;

//   let wallet = new ethers.Wallet(privateKey, provider);

//   // Create an instance of a Faucet Factory
//   let factory = new ethers.ContractFactory(artifacts.abi, artifacts.bytecode, wallet);

//   let faucet = await factory.deploy();

//   console.log("Faucet address:", faucet.address);

//   await faucet.deployed();
// }

// main()
//   .then(() => process.exit(0))
//   .catch(error => {
//     console.error(error);
//     process.exit(1);
// });