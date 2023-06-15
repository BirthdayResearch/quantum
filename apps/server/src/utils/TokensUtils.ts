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
        MDFI: {
          id: '0',
          symbol: 'DFI',
        },
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
        MEURC: {
          id: '12',
          symbol: 'EUROC',
        },
      };
      break;
    case EnvironmentNetwork.LocalPlayground:
      wTokenToDTokenMap = {
        MDFI: {
          id: '0',
          symbol: 'DFI',
        },
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
        MEURC: {
          id: '12',
          symbol: 'EUROC',
        },
      };
      break;
    case EnvironmentNetwork.DevNet:
    case EnvironmentNetwork.TestNet:
      wTokenToDTokenMap = {
        MDFI: {
          id: '0',
          symbol: 'DFI',
        },
        ETH: {
          id: '2',
          symbol: 'ETH',
        },
        MWBTC: {
          id: '1',
          symbol: 'BTC',
        },
        MUSDT: {
          id: '5',
          symbol: 'USDT',
        },
        MUSDC: {
          id: '22',
          symbol: 'USDC',
        },
        MEURC: {
          id: '25',
          symbol: 'EUROC',
        },
      };
      break;
    case EnvironmentNetwork.MainNet:
    default:
      wTokenToDTokenMap = {
        DFI: {
          id: '0',
          symbol: 'DFI',
        },
        ETH: {
          id: '1',
          symbol: 'ETH',
        },
        WBTC: {
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
        EUROC: {
          id: '216',
          symbol: 'EUROC',
        },
      };
      break;
  }
  return wTokenToDTokenMap[wTokenSymbol];
};
