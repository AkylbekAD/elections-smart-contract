const hre = require ('hardhat');
const ethers = hre.ethers;

async function main() {
    const [owner] = await ethers.getSigners()

    const Elections = await ethers.getContractFactory('Elections', owner)
    const elections = await Elections.deploy()
    await elections.deployed()
    console.log(elections.address)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });