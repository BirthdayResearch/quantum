/**
 * Hook to write `approve` function from specific ERC20 token contract
 */

import BigNumber from "bignumber.js";
import { utils } from "ethers";
import { useEffect, useState } from "react";
import {
  erc20ABI,
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { useContractContext } from "@contexts/ContractContext";
import { Erc20Token } from "types";
import { DEFAULT_SPENDING_LIMIT } from "../constants";

interface ApproveTokenI {
  transferAmount: BigNumber;
  tokenName: Erc20Token;
  tokenDecimals: number | "gwei";
  tokenAllowance: string;
  setErrorMessage: any;
  refetchBridge?: () => Promise<any>;
}

function getSpendLimitToApprove(amount: BigNumber, allowance: string | number) {
  if (amount.gt(allowance)) {
    // TODO: Check if additional `0.1` is enough
    return amount.plus(0.1).toString();
  }
  return DEFAULT_SPENDING_LIMIT;
}

export default function useWriteApproveToken({
  transferAmount,
  tokenName,
  tokenDecimals,
  tokenAllowance,
  refetchBridge,
  setErrorMessage,
}: ApproveTokenI) {
  const [refetchedBridgeFn, setRefetchedBridgeFn] = useState(false);
  const { BridgeV1, Erc20Tokens } = useContractContext();

  const erc20TokenContract = {
    address: Erc20Tokens[tokenName].address,
    abi: erc20ABI,
  };

  // Prepare write (ERC20 token) contract for `approve` function
  const { config: tokenConfig } = usePrepareContractWrite({
    ...erc20TokenContract,
    functionName: "approve",
    args: [
      BridgeV1.address,
      utils.parseUnits(
        getSpendLimitToApprove(transferAmount, tokenAllowance),
        tokenDecimals
      ),
    ],
  });

  // Write (ERC20 token) contract for `approve` function
  const {
    data: tokenContract,
    write: writeApprove,
    error: writeApproveError,
  } = useContractWrite(tokenConfig);

  // Wait and get result from write (ERC20 token) contract for `approve` function
  const {
    error: approveTxnError,
    isSuccess: isApproveTxnSuccess,
    isLoading: isApproveTxnLoading,
  } = useWaitForTransaction({
    hash: tokenContract?.hash,
    onSuccess: () => refetchBridge?.().then(() => setRefetchedBridgeFn(true)),
  });

  useEffect(() => {
    if (writeApproveError || approveTxnError) {
      setErrorMessage(writeApproveError?.message ?? approveTxnError?.message);
    }
  }, [writeApproveError, approveTxnError]);

  return {
    isApproveTxnLoading,
    isApproveTxnSuccess,
    refetchedBridgeFn,
    writeApprove,
  };
}
