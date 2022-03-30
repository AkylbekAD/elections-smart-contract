require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-web3");
require("dotenv").config();
require("solidity-coverage")

require("./tasks/Elections.tasks")

/**
 * @type import('hardhat/config').HardhatUserConfig
*/

 module.exports = {
  solidity: "0.8.4",
  networks: {
    // localhost: {
    //   url: "http://127.0.0.1:8545"
    // },
      rinkeby: {
      url: `https://eth-rinkeby.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}`,
      accounts: [process.env.PRIVATE_KEY]
    },
    hardhat: {
      chainId: 1337
    }
  },
  etherscan: {
    apiKey: `${process.env.ETHERSCAN_KEY}`
  }
};
