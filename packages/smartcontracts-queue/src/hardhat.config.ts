import '@nomicfoundation/hardhat-toolbox';

import { TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD } from 'hardhat/builtin-tasks/task-names';
import { HardhatUserConfig, subtask } from 'hardhat/config';
import path from 'path';

require('dotenv').config({
  path: '.env',
});

subtask(TASK_COMPILE_SOLIDITY_GET_SOLC_BUILD, async (args, hre, runSuper) => {
  const compilerPath = path.join(__dirname, 'sol-0.8.18.js');
  return {
    compilerPath,
    isSolcJs: true, // if you are using a native compiler, set this to false
    version: '0.8.18',
  };

  // we just use the default subtask if the version is not 0.8.18
  return runSuper();
});

const config: HardhatUserConfig = {
  solidity: '0.8.18',
  typechain: {
    outDir: './generated',
    target: 'ethers-v5',
  },
  paths: {
    sources: './contracts',
    tests: './tests',
    artifacts: './artifacts',
    cache: './cache',
  },
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_URL || '',
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
