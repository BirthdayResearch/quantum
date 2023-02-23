/**
 * Hook to write `bridgeToDeFiChain` function from our own BridgeV1 contract
 */

import BigNumber from "bignumber.js";
import { ethers, utils } from "ethers";
import { useEffect, useState } from "react";
import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { useContractContext } from "@contexts/ContractContext";
import { Erc20Token } from "types";
import { ETHEREUM_SYMBOL } from "../constants";

interface EventErrorI {
  customErrorDisplay?:
    | "InsufficientAllowanceError"
    | "UserRejectedRequestError";
  message: string;
}

interface BridgeToDeFiChainI {
  receiverAddress: string;
  transferAmount: BigNumber;
  tokenName: Erc20Token;
  tokenDecimals: number | "gwei";
  onBridgeTxnSettled: () => void;
}

export default function useWriteBridgeToDeFiChain({
  receiverAddress,
  transferAmount,
  tokenName,
  tokenDecimals,
  onBridgeTxnSettled,
}: BridgeToDeFiChainI) {
  const { BridgeV1, Erc20Tokens } = useContractContext();
  const sendingFromETH = (tokenName as string) === ETHEREUM_SYMBOL;
  const [eventError, setEventError] = useState<EventErrorI>();
  const [requiresApproval, setRequiresApproval] = useState(false);

  const handlePrepContractError = (err) => {
    let customErrorDisplay: EventErrorI["customErrorDisplay"];
    if (err.message.includes("insufficient allowance")) {
      // Need to request approval from user - Insufficient allowance
      setRequiresApproval(true);
      customErrorDisplay = "InsufficientAllowanceError";
    }

    setEventError({
      customErrorDisplay,
      message: err?.message,
    });
  };

  const handleWriteContractError = (err) => {
    let customErrorMessage;
    let customErrorDisplay: EventErrorI["customErrorDisplay"];
    if (err?.name === "UserRejectedRequestError") {
      customErrorDisplay = "UserRejectedRequestError";
      customErrorMessage =
        "The transaction was rejected in your wallet. No funds have been transferred. Please retry your transaction.";
    }

    setEventError({
      customErrorDisplay,
      message: customErrorMessage ?? err?.message,
    });
  };

  // Prepare write contract for `bridgeToDeFiChain` function
  const { config: bridgeConfig, refetch: refetchBridge } =
    usePrepareContractWrite({
      address: BridgeV1.address,
      abi: BridgeV1.abi,
      functionName: "bridgeToDeFiChain",
      args: [
        utils.hexlify(utils.toUtf8Bytes(receiverAddress)) as `0x${string}`,
        Erc20Tokens[tokenName].address,
        sendingFromETH
          ? 0 // ETH amount is set inside overrides' `value` field
          : utils.parseUnits(transferAmount.toFixed(), tokenDecimals),
      ],
      ...(sendingFromETH
        ? {
            overrides: {
              value: ethers.utils.parseEther(transferAmount.toFixed()),
            },
          }
        : {}),
      onError: handlePrepContractError,
    });

  // Write contract for `bridgeToDeFiChain` function
  const {
    data: bridgeContract,
    write: writeBridgeToDeFiChain,
    error: writeBridgeTxnError,
  } = useContractWrite(bridgeConfig);

  // Wait and get result from write contract for `bridgeToDeFiChain` function
  const {
    error: bridgeTxnError,
    isSuccess: isBridgeTxnCreated,
    isLoading: isBridgeTxnLoading,
  } = useWaitForTransaction({
    hash: bridgeContract?.hash,
    onSettled: onBridgeTxnSettled,
  });

  useEffect(() => {
    if (writeBridgeTxnError || bridgeTxnError) {
      handleWriteContractError(writeBridgeTxnError ?? bridgeTxnError);
    }
  }, [writeBridgeTxnError, bridgeTxnError]);

  return {
    isBridgeTxnLoading,
    isBridgeTxnCreated,
    refetchBridge,
    writeBridgeToDeFiChain,
    transactionHash: bridgeContract?.hash,
    requiresApproval,
    eventError,
  };
}
