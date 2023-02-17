import BigNumber from "bignumber.js";
import { useNetworkContext } from "@contexts/NetworkContext";
import { Network } from "types";
import { ETHEREUM_SYMBOL } from "../constants";

/**
 * Computes transfer fee
 * Any changes to the fee logic can be updated here
 */

const EVM_TO_DFC_FEE_PERCENTAGE = 0.01;
const DFC_TO_EVM_FEE_PERCENTAGE = 0.03;
export default function useTransferFee(transferAmount: string | number) {
  const { selectedNetworkA, selectedTokensA } = useNetworkContext();
  const isSendingErcToken =
    selectedNetworkA.name === Network.Ethereum &&
    selectedTokensA.tokenA.name !== ETHEREUM_SYMBOL;
  const feeSymbol = selectedTokensA.tokenA.name;
  const fee = new BigNumber(transferAmount || 0).multipliedBy(
    isSendingErcToken ? EVM_TO_DFC_FEE_PERCENTAGE : DFC_TO_EVM_FEE_PERCENTAGE
  );

  return [fee, feeSymbol];
}
