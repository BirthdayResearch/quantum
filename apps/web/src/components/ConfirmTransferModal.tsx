import clsx from "clsx";
import BigNumber from "bignumber.js";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { NetworkName } from "types";
import { FiCheck } from "react-icons/fi";
import { useNetworkContext } from "@contexts/NetworkContext";
import useResponsive from "@hooks/useResponsive";
import useDisableEscapeKey from "@hooks/useDisableEscapeKey";
import truncateTextFromMiddle from "@utils/textHelper";
import AlertInfoMessage from "@components/commons/AlertInfoMessage";
import IconTooltip from "@components/commons/IconTooltip";
import ActionButton from "@components/commons/ActionButton";
import Modal from "@components/commons/Modal";
import NumericFormat from "@components/commons/NumericFormat";
import BrLogoIcon from "@components/icons/BrLogoIcon";
import DeFiChainToERC20Transfer from "@components/erc-transfer/DeFiChainToERC20Transfer";
import { ethers, utils } from "ethers";
import {
  useContractWrite,
  usePrepareContractWrite,
  useWaitForTransaction,
} from "wagmi";
import { useContractContext } from "@contexts/ContractContext";
import { setStorageItem } from "@utils/localStorage";
import useBridgeFormStorageKeys from "@hooks/useBridgeFormStorageKeys";
import {
  CONSORTIUM_INFO,
  DISCLAIMER_MESSAGE,
  ETHEREUM_SYMBOL,
  FEES_INFO,
} from "../constants";
import BridgeV1Abi from "../config/BridgeV1Abi.json";
import ErrorModal from "./commons/ErrorModal";

interface RowDataI {
  address: string;
  networkName: NetworkName;
  networkIcon: string;
  tokenName: string;
  tokenIcon: string;
  amount: BigNumber;
}

interface TransferData {
  from: RowDataI;
  to: RowDataI;
}

function RowData({
  data,
  label,
  networkLabel,
  isSendingToDFC = true,
}: {
  data: RowDataI;
  label: string;
  networkLabel: string;
  isSendingToDFC?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-row items-center gap-2">
        <span className="text-sm font-semibold tracking-wide text-dark-500">
          {label}
        </span>
        <Image
          width={100}
          height={100}
          src={data.networkIcon}
          alt={data.networkName}
          className={clsx("block w-7 h-7", "md:hidden md:w-9 md:h-9")}
        />
        <hr className="w-full border-dark-200" />
      </div>
      <div className={clsx("flex gap-4 py-6", "md:gap-2 md:py-4")}>
        <Image
          width={100}
          height={100}
          src={data.networkIcon}
          alt={data.networkName}
          className={clsx(
            "hidden w-7 h-7 ml-2",
            "md:block md:w-9 md:h-9 md:ml-0"
          )}
        />
        <div className={clsx("flex flex-col w-1/2", "md:grow md:w-auto")}>
          <span
            className={clsx(
              "text-sm text-dark-900 !leading-5 break-all",
              "md:text-base md:break-normal"
            )}
          >
            {data.address}
          </span>
          <span
            className={clsx("text-xs text-dark-700 mt-1", "md:text-sm md:mt-0")}
          >
            {networkLabel} {isSendingToDFC ? `(${data.networkName})` : ""}
          </span>
        </div>
        <div
          className={clsx(
            "flex flex-col self-center w-1/2",
            "md:self-end md:w-auto"
          )}
        >
          <span
            className={clsx(
              "!text-xl font-bold leading-6 text-right",
              "md:text-lg md:font-semibold",
              data.amount.isPositive() ? "text-valid" : "text-error"
            )}
          >
            {data.amount.toFixed(2)}
          </span>
          <div className="flex items-center justify-end gap-1">
            <Image
              width={100}
              height={100}
              src={data.tokenIcon}
              alt={data.tokenName}
              className={clsx(
                "w-5 h-5 order-last",
                "md:w-4 md:h-4 md:order-none"
              )}
            />
            <span className="text-sm text-dark-700 mt-0.5 md:mt-0">
              {data.tokenName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ERC20ToDeFiChainTransfer({ data }: { data: TransferData }) {
  const [hasError, setHasError] = useState(false);

  const router = useRouter();
  const { isMobile } = useResponsive();
  const contractConfig = useContractContext();
  const sendingFromETH = data.from.tokenName === ETHEREUM_SYMBOL;
  const { TXN_KEY } = useBridgeFormStorageKeys();

  const { config } = usePrepareContractWrite({
    address: contractConfig.BridgeProxyContractAddress,
    abi: BridgeV1Abi,
    functionName: "bridgeToDeFiChain",
    args: [
      utils.hexlify(utils.toUtf8Bytes(data.to.address)) as `0x${string}`,
      contractConfig.Erc20Tokens[data.from.tokenName],
      utils.parseUnits(data.to.amount.toString(), "18"), // TODO: Check how to get decimal set for selected token
    ],
    ...(sendingFromETH
      ? {
          overrides: {
            value: ethers.utils.parseEther(data.to.amount.toString()),
          },
        }
      : {}),
    onError: () => setHasError(true),
  });

  const { data: bridgeContract, write } = useContractWrite(config);
  const { isLoading, isSuccess } = useWaitForTransaction({
    hash: bridgeContract?.hash,
    onError: () => setHasError(true),
  });

  useEffect(() => {
    if (isSuccess) {
      setStorageItem(TXN_KEY, null);
    }
  }, [isSuccess]);

  return (
    <>
      {isLoading && (
        <Modal isOpen={isLoading}>
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
            <span className="font-bold text-2xl text-dark-900 mt-12">
              Transaction confirmed
            </span>
            <span className="text-dark-900 mt-2">
              Funds will be transferred to your DeFiChain wallet shortly.
            </span>
          </div>
        </Modal>
      )}
      {hasError && (
        <ErrorModal
          title="Transaction error"
          message="The transaction verification has failed. Check your network connection
        and try again."
          hasError={hasError}
          primaryButtonLabel="Try again"
          secondaryButtonLabel="Close"
        />
      )}
      <AlertInfoMessage
        message={DISCLAIMER_MESSAGE}
        containerStyle="px-5 py-4 mt-8"
        textStyle="text-xs"
      />
      <div className={clsx("px-6 py-8", "md:px-[72px] md:pt-16")}>
        <ActionButton
          testId="confirm-transfer-btn"
          label={isMobile ? "Confirm transfer" : "Confirm transfer on wallet"}
          onClick={() => write?.()}
          isLoading={isLoading}
          disabled={isSuccess}
        />
      </div>
      {/* TODO: Update screen shown for successful transfer */}
      {isSuccess && (
        <div className="flex justify-center items-center text-valid">
          Transfer successful! <FiCheck size={20} className="text-valid ml-1" />
        </div>
      )}
    </>
  );
}

export default function ConfirmTransferModal({
  show,
  onClose,
  amount,
  fromAddress,
  toAddress,
  initialRefundAddress,
}: {
  show: boolean;
  onClose: () => void;
  amount: string;
  fromAddress: string;
  toAddress: string;
  initialRefundAddress: string;
}) {
  const {
    selectedNetworkA,
    selectedTokensA,
    selectedNetworkB,
    selectedTokensB,
  } = useNetworkContext();
  useDisableEscapeKey(show);

  // Direction of transfer
  const isSendingToDFC = selectedNetworkB.name === NetworkName.DeFiChain;

  const data: TransferData = {
    from: {
      address: (isSendingToDFC ? fromAddress : "DeFiChain address") as string,
      networkName: NetworkName[selectedNetworkA.name],
      networkIcon: selectedNetworkA.icon,
      tokenName: selectedTokensA.tokenA.name,
      tokenIcon: selectedTokensA.tokenA.icon,
      amount: new BigNumber(amount).negated(),
    },
    to: {
      address: toAddress,
      networkName: NetworkName[selectedNetworkB.name],
      networkIcon: selectedNetworkB.icon,
      tokenName: selectedTokensB.tokenA.name,
      tokenIcon: selectedTokensB.tokenA.icon,
      amount: new BigNumber(amount),
    },
  };

  // TODO: Replace with real address
  const consortiumAddress = "df10szLaksgysjl088man5vfmsm6wsstquabds9123";

  return (
    <Modal title="Transfer" isOpen={show} onClose={onClose}>
      <RowData
        data={data.from}
        label="FROM"
        networkLabel="Source"
        isSendingToDFC={isSendingToDFC}
      />
      <RowData data={data.to} label="TO" networkLabel="Destination" />
      <div className="w-full border-t border-t-dark-200 md:mt-3" />

      {/* Fees */}
      <div className="flex justify-between mt-6 md:mt-5 py-2">
        <div className="inline-flex items-center">
          <span className="text-dark-700 text-sm md:text-base">Fees</span>
          <div className="ml-2">
            <IconTooltip
              title={FEES_INFO.title}
              content={FEES_INFO.content}
              position="right"
            />
          </div>
        </div>
        <NumericFormat
          className="text-right text-dark-900 tracking-[0.01em] md:tracking-normal"
          value={0}
          decimalScale={2}
          thousandSeparator
          suffix=" DFI" // TODO: Create hook to get fee based on source/destination
        />
      </div>

      {/* Consortium */}
      <div className="flex justify-between items-baseline mt-4 md:mt-2 py-2">
        <div className="inline-flex items-center">
          <span className="text-dark-700 text-sm md:text-base">Consortium</span>
          <div className="ml-2">
            <IconTooltip
              title={CONSORTIUM_INFO.title}
              content={CONSORTIUM_INFO.content}
              position="right"
            />
          </div>
        </div>
        {/* TODO: Add link to Scan once available */}
        <div>
          <span className="text-right text-dark-900 tracking-[0.01em] md:tracking-normal">
            {truncateTextFromMiddle(consortiumAddress, 8)}
          </span>
          <div className="flex items-center mt-2 md:mt-1">
            <BrLogoIcon />
            <span className="text-xs md:text-sm text-dark-700 ml-2">
              Birthday Research
            </span>
          </div>
        </div>
      </div>

      {isSendingToDFC ? (
        <ERC20ToDeFiChainTransfer data={data} />
      ) : (
        <DeFiChainToERC20Transfer initialRefundAddress={initialRefundAddress} />
      )}
    </Modal>
  );
}
