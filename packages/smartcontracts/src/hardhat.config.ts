import '@nomicfoundation/hardhat-chai-matchers';
import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-etherscan';

import { HardhatUserConfig, task, types } from 'hardhat/config';

import { TX_AUTOMINE_ENV_VAR, TX_AUTOMINE_INTERVAL_ENV_VAR } from './envvar';

// Default chainId for local testing purposes. Most local testnets (Ganache, etc) use this chainId
export const DEFAULT_CHAINID = 1337;

interface DeployContractArgs {
  name: string;
  deployargs: string | undefined;
  libraries: Record<string, string>;
}

require('dotenv').config({
  path: './.env',
});

task('deployContract', 'Deploys a contract based on the name of the contract')
  .addParam(
    'name',
    'The contract name. If the contract is Foo.sol, the contract name is Foo.',
    // no default value
    undefined,
    types.string,
  )
  .addOptionalParam(
    'deployargs',
    'Comma-delimited contract deployment arguments. If empty, there are no necessary deployment args.',
    // no default value
    undefined,
    types.string,
  )
  .addOptionalParam(
    'libraries',
    'Link a contract to a deployed library. Expects a JSON of library name to address.',
    undefined,
    types.json,
  )
  .setAction(async (taskArgs: DeployContractArgs, hre) => {
    try {
      const { name, deployargs, libraries } = taskArgs;

      const contractFactory = await hre.ethers.getContractFactory(name, {
        libraries,
      });
      const contract = await contractFactory.deploy(...(deployargs === undefined ? [] : deployargs.split(',')));

      // Logs the contract address as the output of this task
      // Can be picked up by the task executor to create a contract instance with the outputted contract address
      console.log(contract.address);
    } catch (e) {
      // Logs the error message to be picked up by the caller. Errors start with 'Error: ...'
      console.log(e);
    }
  });

task('setupLocalTestnet', 'Sets up all the contracts necessary for dApp integration.').setAction(
  async (taskArgs, hre) => {
    // suppressing type error - method is actually properly typed
    // @ts-ignore
    const [defaultNodeSigner] = await hre.ethers.getSigners();
    const eoaAddress = defaultNodeSigner.address;
    console.log(`Please use ${eoaAddress} as your address for testing with Hardhat`);

    // Deploy the ERC20 tokens
    const ERC20 = await hre.ethers.getContractFactory('TestToken');
    const mockTokenUSDT = await ERC20.deploy('MockUSDT', 'MUSDT');
    await mockTokenUSDT.deployed();
    console.log('Test token MUSDT is deployed to ', mockTokenUSDT.address);

    const mockTokenUSDC = await ERC20.deploy('MockUSDC', 'MUSDC');
    await mockTokenUSDC.deployed();
    console.log('Test token MUSDC is deployed to ', mockTokenUSDC.address);

    // Mint tokens to EOA
    await mockTokenUSDT.mint(eoaAddress, 1_000_000_000);
    console.log(`Minted 1,000,000,000 MUSDT tokens to ${eoaAddress}`);

    await mockTokenUSDC.mint(eoaAddress, 1_000_000_000);
    console.log(`Minted 1,000,000,000 MUSDC tokens to ${eoaAddress}`);

    // Deploy Bridge implementation contract
    const BridgeV1 = await hre.ethers.getContractFactory('BridgeV1');
    const bridgeV1 = await BridgeV1.deploy();
    await bridgeV1.deployed();
    console.log('BridgeV1 implementation deployed. You do not need to worry about the address of this contract.');

    const BridgeProxy = await hre.ethers.getContractFactory('BridgeProxy');
    const encodedData = BridgeV1.interface.encodeFunctionData('initialize', [
      'CAKE_BRIDGE',
      '1',
      // admin address
      eoaAddress,
      // operational address
      eoaAddress,
      // relayer address - set to AddressZero for now, since we are not worried about DFC -> ETH flow yet
      hre.ethers.constants.AddressZero,
      // 0.3% fee
      30,
    ]);
    const bridgeProxy = await BridgeProxy.deploy(bridgeV1.address, encodedData);
    await bridgeProxy.deployed();

    console.log(`BridgeProxy deployed to ${bridgeProxy.address} You will need to use this address for testing.`);
    console.log(`${eoaAddress} has been set as the operational address and admin address.`);

    // Add the tokens as supported tokens to the bridge
    const bridgeProxyContract = BridgeV1.attach(bridgeProxy.address);
    await bridgeProxyContract.addSupportedTokens(
      mockTokenUSDT.address,
      hre.ethers.constants.MaxInt256,
      // current timestamp
      Math.floor(Date.now() / 1000),
    );
    await bridgeProxyContract.addSupportedTokens(
      mockTokenUSDC.address,
      hre.ethers.constants.MaxInt256,
      // current timestamp
      Math.floor(Date.now() / 1000),
    );

    console.log(
      `MUSDT and MUSDC have been added as supported tokens to the bridge, with daily allowance set to MaxInt256`,
    );
  },
);

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more
const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: '0.8.17',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: DEFAULT_CHAINID,
      // To enable/disable auto-mining at runtime, refer to:
      // https://hardhat.org/hardhat-network/docs/explanation/mining-modes#using-rpc-methods
      mining: {
        auto: (process.env[TX_AUTOMINE_ENV_VAR] ?? 'true').toLowerCase() === 'true',
        interval: Number(process.env[TX_AUTOMINE_INTERVAL_ENV_VAR] ?? 0),
      },
      // We need to allow large contract sizes since contract sizes
      // could be larger than the stipulated max size in EIP-170
      allowUnlimitedContractSize: true,
    },
    goerli: {
      url: process.env.GOERLI_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 30000000000, // this is 30 Gwei
    },
  },
  paths: {
    sources: './contracts',
    // tests run in the Hardhat context
    tests: './tests',
    artifacts: './artifacts',
    cache: './cache',
  },
  typechain: {
    outDir: './generated',
    target: 'ethers-v5',
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
