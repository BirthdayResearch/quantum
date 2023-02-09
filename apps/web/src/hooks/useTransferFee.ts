import BigNumber from "bignumber.js";
import { useNetworkContext } from "@contexts/NetworkContext";

/**
 * Computes transfer fee
 * Any changes to the fee logic can be updated here
 */
const FEE_PERCENTAGE = 0.003;
export default function useTransferFee(transferAmount: string | number) {
  const { selectedTokensA } = useNetworkContext();
  const feeSymbol = selectedTokensA.tokenA.name;
  const fee = new BigNumber(transferAmount || 0).multipliedBy(FEE_PERCENTAGE);

  return [fee, feeSymbol];
}
