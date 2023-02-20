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

const useLazyBridgeStatusQuery = () =>
  useWrappedLazyQuery(bridgeApi.useLazyBridgeStatusQuery, true);

export {
  useGenerateAddressMutation,
  useLazyVerifyQuery,
  useGetAddressDetailMutation,
  useConfirmEthTxnMutation,
  bridgeApi,
  useLazyBridgeStatusQuery,
};
