import { EnvironmentNetwork } from '@waveshq/walletkit-core';

interface WTokenToDTokenMapI {
  [key: string]: {
    id: string;
    symbol: string;
  };
}
export const getDTokenDetailsByWToken = (
  wTokenSymbol: string,
  network: EnvironmentNetwork,
): { id: string; symbol: string } => {
  let wTokenToDTokenMap: WTokenToDTokenMapI;
  switch (network) {
    case EnvironmentNetwork.RemotePlayground:
      wTokenToDTokenMap = {
        ETH: {
          id: '2',
          symbol: 'ETH',
        },
        MWBTC: {
          id: '1',
          symbol: 'BTC',
        },
        MUSDT: {
          id: '3',
          symbol: 'USDT',
        },
        MUSDC: {
          id: '5',
          symbol: 'USDC',
        },
      };
      break;
    case EnvironmentNetwork.LocalPlayground:
      wTokenToDTokenMap = {
        ETH: {
          id: '2',
          symbol: 'ETH',
        },
        MWBTC: {
          id: '1',
          symbol: 'BTC',
        },
        MUSDT: {
          id: '3',
          symbol: 'USDT',
        },
        MUSDC: {
          id: '5',
          symbol: 'USDC',
        },
      };
      break;
    case EnvironmentNetwork.DevNet:
    case EnvironmentNetwork.TestNet:
      wTokenToDTokenMap = {
        ETH: {
          id: '2',
          symbol: 'ETH',
        },
        wBTC: {
          id: '1',
          symbol: 'BTC',
        },
        USDT: {
          id: '5',
          symbol: 'USDT',
        },
        USDC: {
          id: '22',
          symbol: 'USDC',
        },
      };
      break;
    case EnvironmentNetwork.MainNet:
    default:
      wTokenToDTokenMap = {
        ETH: {
          id: '1',
          symbol: 'ETH',
        },
        wBTC: {
          id: '2',
          symbol: 'BTC',
        },
        USDT: {
          id: '3',
          symbol: 'USDT',
        },
        USDC: {
          id: '13',
          symbol: 'USDC',
        },
      };
      break;
  }
  return wTokenToDTokenMap[wTokenSymbol];
};
