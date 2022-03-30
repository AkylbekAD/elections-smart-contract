# Elections smart-contract

Elections smart-contract allows to create an elections on blockchain, each of election continues for 3 days, to vote for candidate you have to pay 0.01 ETH, after endtime of election anyone can end it, then 90% of election balance would be send to winner.
Only owner can start election, add candidates to election and withdraw 10% of each election fee funds.

You can check or test deployed contract on:

Etherscan - https://rinkeby.etherscan.io/address/0x1332358eE095635EC7e1D37cc86AFaA5b0421c01#code

Alchemy - https://dashboard.alchemyapi.io/apps/pzssfh9tfvqpmk03


### To see all available hardhat tasks run:

```
npx hardhat help

```

Watch which parameters you need to add to interact with smart-contracts functionality by useing --help option

Example:

```
npx hardhat startElection --help

```

