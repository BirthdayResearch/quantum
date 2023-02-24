import BigNumber from "bignumber.js";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { utils } from "ethers";
import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { useRouter } from "next/router";
import { FiCheck } from "react-icons/fi";
import { useContractContext } from "@contexts/ContractContext";
import ActionButton from "@components/commons/ActionButton";
import Modal from "@components/commons/Modal";
import ErrorModal from "@components/commons/ErrorModal";
import { SignedClaim, TransferData } from "types";
import UtilityButton from "@components/commons/UtilityButton";
import useTransferFee from "@hooks/useTransferFee";
import { useStorageContext } from "@contexts/StorageContext";
import { useBalanceEvmMutation } from "@store/index";
import Logging from "@api/logging";

const CLAIM_INPUT_ERROR =
  "Check your connection and try again.  If the error persists get in touch with us.";

export default function StepLastClaim({
  data,
  signedClaim,
}: {
  data: TransferData;
  signedClaim: SignedClaim;
}) {
  const router = useRouter();
  const [showLoader, setShowLoader] = useState(false);
  const [error, setError] = useState<string>();
  const [balanceEvm] = useBalanceEvmMutation();
  const [isBalanceInsufficient, setIsBalanceInsufficient] = useState(false);

  const { BridgeV1, Erc20Tokens, ExplorerURL } = useContractContext();
  const tokenAddress = Erc20Tokens[data.to.tokenName].address;
  const { setStorage } = useStorageContext();

  // Prepare write contract for `claimFund` function
  const [fee] = useTransferFee(data.to.amount.toString());
  const amountLessFee = BigNumber.max(data.to.amount.minus(fee), 0);
  const { config: bridgeConfig } = usePrepareContractWrite({
    address: BridgeV1.address,
    abi: BridgeV1.abi,
    functionName: "claimFund",
    args: [
      data.to.address,
      utils.parseEther(amountLessFee.toString()),
      signedClaim.nonce,
      signedClaim.deadline,
      tokenAddress,
      signedClaim.signature,
    ],
    onError: () => setError(CLAIM_INPUT_ERROR),
  });

  // Write contract for `claimFund` function
  const {
    data: claimFundData,
    error: writeClaimTxnError,
    write,
  } = useContractWrite(bridgeConfig);

  // Wait and get result from write contract for `claimFund` function
  const { error: claimTxnError, isSuccess } = useWaitForTransaction({
    hash: claimFundData?.hash,
    onSettled: () => setShowLoader(false),
  });

  const handleOnClaim = async () => {
    setError(undefined);
    setShowLoader(true);
    if (!write) {
      setTimeout(() => {
        setError(CLAIM_INPUT_ERROR);
        setShowLoader(false);
      }, 500);
      return;
    }
    write?.();
  };

  useEffect(() => {
    if (isSuccess) {
      setStorage("txn-form", null);
      setStorage("dfc-address", null);
      setStorage("dfc-address-details", null);
    }
  }, [isSuccess]);

  useEffect(() => {
    setError(writeClaimTxnError?.message ?? claimTxnError?.message);
  }, [writeClaimTxnError, claimTxnError]);

  useEffect(() => {
    async function checkBalance() {
      try {
        const contractBalance = await balanceEvm({
          tokenSymbol: data.to.tokenName.toUpperCase(),
        }).unwrap();
        const isInsufficient = data.to.amount.isGreaterThan(
          new BigNumber(contractBalance)
        );
        setIsBalanceInsufficient(isInsufficient);
      } catch (error) {
        Logging.error(error);
      }
    }
    checkBalance();
  }, []);

  useEffect(() => {
    if (error && isBalanceInsufficient) {
      setError(
        "Quantum's servers are currently at capacity. We are unable to process transactions at this time, please try again in a few hours to claim your tokens."
      );
    }
  }, [error, isBalanceInsufficient]);

  return (
    <>
      {showLoader && (
        <Modal isOpen={showLoader}>
          <div className="flex flex-col items-center mt-6 mb-14">
            <div className="w-24 h-24 border border-brand-200 border-b-transparent rounded-full animate-spin" />
            <span className="font-bold text-2xl text-dark-900 mt-12">
              Waiting for confirmation
            </span>
            <span className="text-dark-900 mt-2">
              Confirm this transaction in your Wallet.
            </span>
          </div>
        </Modal>
      )}
      {isSuccess && (
        // TODO: Replace success ui/message
        <Modal isOpen={isSuccess} onClose={() => router.reload()}>
          <div className="flex flex-col items-center mt-6 mb-14">
            <FiCheck className="text-8xl text-valid ml-1" />
            <span className="font-bold text-2xl text-dark-900 mt-8">
              Token claimed
            </span>
            <span className="text-dark-900 mt-2">
              {`You have successfully claimed your ${data.to.tokenName} tokens.`}
            </span>
            <div className="mt-14">
              <UtilityButton
                label="View on Etherscan"
                onClick={() =>
                  window.open(
                    `${ExplorerURL}/tx/${claimFundData?.hash}`,
                    "_blank"
                  )
                }
              />
            </div>
          </div>
        </Modal>
      )}
      {error && (
        <ErrorModal
          title="Claim Error"
          message={error}
          primaryButtonLabel={
            claimFundData?.hash ? "View on Etherscan" : "Try again"
          }
          onPrimaryButtonClick={() =>
            claimFundData?.hash
              ? window.open(`${ExplorerURL}/tx/${claimFundData.hash}`, "_blank")
              : handleOnClaim()
          }
        />
      )}
      <div className={clsx("pt-4 px-6", "md:px-[73px] md:pt-4 md:pb-6")}>
        <span className="font-semibold block text-center text-dark-900 tracking-[0.01em] md:tracking-wider text-2xl">
          Ready for claiming
        </span>
        <span className="block text-center text-sm text-dark-900 mt-3 pb-6">
          Your transaction has been verified and is now ready to be transferred
          to destination chain (ERC-20). You will be redirected to your wallet
          to claim your tokens.
        </span>
        <ActionButton label="Claim tokens" onClick={() => handleOnClaim()} />
      </div>
    </>
  );
}
