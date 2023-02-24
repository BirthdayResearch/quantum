import useWrappedMutation from "@hooks/useWrappedMutation";
import useWrappedLazyQuery from "@hooks/useWrappedLazyQuery";

import { bridgeApi } from "./defichain";

const useGenerateAddressMutation = () =>
  useWrappedMutation(bridgeApi.useGenerateAddressMutation);
const useLazyVerifyQuery = () =>
  useWrappedLazyQuery(bridgeApi.useLazyVerifyQuery);
const useGetAddressDetailMutation = () =>
  useWrappedMutation(bridgeApi.useGetAddressDetailMutation);
const useConfirmEthTxnMutation = () =>
  useWrappedMutation(bridgeApi.useConfirmEthTxnMutation);
const useAllocateDfcFundMutation = () =>
  useWrappedMutation(bridgeApi.useAllocateDfcFundMutation);
const useBalanceEvmMutation = () =>
  useWrappedMutation(bridgeApi.useBalanceEvmMutation);
const useBalanceDfcMutation = () =>
  useWrappedMutation(bridgeApi.useBalanceDfcMutation);
const useLazyBridgeStatusQuery = () =>
  useWrappedLazyQuery(bridgeApi.useLazyBridgeStatusQuery, true);
const useLazyBridgeVersionQuery = () =>
  useWrappedLazyQuery(bridgeApi.useLazyBridgeVersionQuery);

export {
  useGenerateAddressMutation,
  useLazyVerifyQuery,
  useGetAddressDetailMutation,
  useConfirmEthTxnMutation,
  useAllocateDfcFundMutation,
  useBalanceEvmMutation,
  useBalanceDfcMutation,
  useLazyBridgeStatusQuery,
  useLazyBridgeVersionQuery,
  bridgeApi,
};
