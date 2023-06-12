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
        DFI: {
          id: '0',
          symbol: 'MDFI',
        },
        ETH: {
          id: '2',
          symbol: 'ETH',
        },
        MWBTC: {
          id: '1',
          symbol: 'MWBTC',
        },
        MUSDT: {
          id: '3',
          symbol: 'MUSDT',
        },
        MUSDC: {
          id: '5',
          symbol: 'MUSDC',
        },
        MEURC: {
          id: '12',
          symbol: 'MEUROC',
        },
      };
      break;
    case EnvironmentNetwork.LocalPlayground:
      wTokenToDTokenMap = {
        DFI: {
          id: '0',
          symbol: 'MDFI',
        },
        ETH: {
          id: '2',
          symbol: 'ETH',
        },
        MWBTC: {
          id: '1',
          symbol: 'MWBTC',
        },
        MUSDT: {
          id: '3',
          symbol: 'MUSDT',
        },
        MUSDC: {
          id: '5',
          symbol: 'MUSDC',
        },
        MEURC: {
          id: '12',
          symbol: 'MEUROC',
        },
      };
      break;
    case EnvironmentNetwork.DevNet:
    case EnvironmentNetwork.TestNet:
      wTokenToDTokenMap = {
        DFI: {
          id: '0',
          symbol: 'MDFI',
        },
        ETH: {
          id: '2',
          symbol: 'ETH',
        },
        MWBTC: {
          id: '1',
          symbol: 'MWBTC',
        },
        MUSDT: {
          id: '5',
          symbol: 'MUSDT',
        },
        MUSDC: {
          id: '22',
          symbol: 'MUSDC',
        },
        MEURC: {
          id: '25',
          symbol: 'MEUROC',
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
