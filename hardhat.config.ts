import "@matterlabs/hardhat-zksync-deploy";
import "@matterlabs/hardhat-zksync-solc";
import "@matterlabs/hardhat-zksync-verify";


module.exports = {
  zksolc: {
    version: "1.3.5",
    compilerSource: "binary",
    settings: {},
  },
  defaultNetwork: "zkSyncMain",

  networks: {
    zkSyncTestnet: {
      url: "https://zksync2-testnet.zksync.dev",
      ethNetwork: "goerli", // Can also be the RPC URL of the network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
      zksync: false,
    },
    zkSyncMain: {
      url: "https://mainnet.era.zksync.io",
      ethNetwork: "https://mainnet.era.zksync.io", // Can also be the RPC URL of the network (e.g. `https://goerli.infura.io/v3/<API_KEY>`)
      verifyURL: 'https://zksync2-mainnet-explorer.zksync.io/contract_verification',
      zksync: true,
    },
  },
  solidity: {
    version: "0.8.17",
  },
};
