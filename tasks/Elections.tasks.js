const ethers = require('ethers')
const { task } = require("hardhat/config");

const {abi} = require('../artifacts/contracts/Elections.sol/Elections.json')


// for Rinkeby testnetwork:
const alchemyProvider = new ethers.providers.AlchemyProvider(network = "rinkeby", process.env.ALCHEMY_KEY);
const rinkebyContractAddress = "0x1332358eE095635EC7e1D37cc86AFaA5b0421c01"
const getSigner = new ethers.Wallet(process.env.PRIVATE_KEY, alchemyProvider);
const signer = getSigner.connect(alchemyProvider);
const ElectionsInterface = new ethers.Contract(rinkebyContractAddress, abi, signer)

/* 
// for localhost node network:
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/")
const signer = provider.getSigner();
const localContractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"
const ElectionsInterface = new ethers.Contract(localContractAddress, abi, signer)
 */

task("getBalance", "Prints constract`s balance")
    .setAction(async () => {
        let balance = await ElectionsInterface.getBalance()
        balance = balance.toString()
        console.log("Contract`s balance: ", balance)
        return balance
    })

task("startElection", "If you`re owner, you can start an election")
    .addParam("election", "Name of election you want to start")
    .setAction(async (taskArgs) => {
        await ElectionsInterface.startElection(taskArgs.election)
        console.log(taskArgs.election, "election has been started, please add all candidates in 1 hour")
    })

task("addCandidate", "Adds candidate to election")
    .addParam("election", "Name of election you want to add candidate")
    .addParam("candidate", "Name of candidate you want to add")
    .addParam("address", "Wallet of of candidate you want to add")
    .setAction(async (taskArgs) => {
        await ElectionsInterface.addCandidate(taskArgs.election, taskArgs.candidate, taskArgs.address)
        console.log(`You have been added ${taskArgs.candidate} to ${taskArgs.election} election with ${taskArgs.address} address`)
    })

task("showCurrentResults", "Prints elections current results")
    .addParam("election", "Name of election you want to see results")
    .setAction(async (taskArgs) => {
        const results = await ElectionsInterface.showCurrentResults(taskArgs.election)
        let votes = []
        votes[0] = parseInt(Number(results[1][0]._hex)) // hexstring number to number
        votes[1] = parseInt(Number(results[1][1]._hex))
        console.log(results[0],votes)
    })

task("voteForCandidate", "Send a vote for 0.01 ETH for candidate in election")
    .addParam("election", "Name of election you want to vote")
    .addParam("candidate", "Name of candidate you want to vote")
    .setAction(async (taskArgs) => {
        payment = ethers.utils.parseEther("0.01").toHexString()
        await ElectionsInterface.VoteForCandidate(taskArgs.election, taskArgs.candidate, { value: payment })
        console.log(`You have been voted for ${taskArgs.candidate} in ${taskArgs.election} election and payed 0.01 ETH`)
    })

task("endElectionGetWinner", "Ends direct election and sets winner")
    .addParam("election", "Name of election you want to end")
    .setAction(async (taskArgs) => {
        const winner = await ElectionsInterface.endElectionGetWinner(taskArgs.election)
        console.log(winner)
    })

task("withdrawFeeFund", "Withdraw fee fund from elections to owner")
    .addParam("election", "Name of election you want to withdraw")
    .setAction(async (taskArgs) => {
        const transaction = await ElectionsInterface.withdrawFeeFund(taskArgs.election)
        console.log(transaction)
    })