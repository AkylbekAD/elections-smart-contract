const { expect } = require("chai");
require("@nomiclabs/hardhat-web3");

describe ("Election contract", function () {
    const {abi} = require('../artifacts/contracts/Election.sol/Election.json');
    const Web3 = require('web3');

    beforeEach(async function () {
        const contractAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
        const web3 = new Web3 (new Web3.providers.HttpProvider("http://127.0.0.1:8545/"));
        const ElectionInterface = new web3.eth.Contract(abi,contractAddress);
    });

})