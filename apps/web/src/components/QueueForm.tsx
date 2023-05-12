import clsx from "clsx";
import BigNumber from "bignumber.js";
import { useEffect, useState } from "react";
import { FiRefreshCw } from "react-icons/fi";
import { useAccount, useBalance } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { autoUpdate, shift, size, useFloating } from "@floating-ui/react-dom";
import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import { Network, TokenBalances } from "types";
import UtilityModal, {
  ModalConfigType,
} from "@components/commons/UtilityModal";
import ActionButton from "@components/commons/ActionButton";
import IconTooltip from "@components/commons/IconTooltip";
import NumericFormat from "@components/commons/NumericFormat";
import { QuickInputCard } from "@components/commons/QuickInputCard";
import { useContractContext } from "@contexts/ContractContext";
import { useQueueStorageContext } from "@contexts/QueueStorageContext";
import { useGetAddressDetailMutation } from "@store/index";
import dayjs from "dayjs";
import useTransferFee from "@hooks/useTransferFee";
import useCheckBalance from "@hooks/useCheckBalance";
import debounce from "@utils/debounce";
import WalletAddressInput from "./WalletAddressInput";
import ConfirmTransferModal from "./ConfirmTransferModal";
import {
  DFC_TO_ERC_RESET_FORM_TIME_LIMIT,
  ETHEREUM_SYMBOL,
  FEES_INFO,
} from "../constants";
import {
  useNetworkContext,
  FormOptions,
} from "../layouts/contexts/NetworkContext";
import QueryTransactionModal from "./erc-transfer/QueryTransactionModal";

export default function QueueForm({
  hasPendingTxn,
  activeTab,
}: {
  hasPendingTxn: boolean;
  activeTab: FormOptions;
}) {
  const {
    selectedQueueNetworkA,
    selectedQueueTokensA,
    selectedQueueNetworkB,
    selectedQueueTokensB,
    setSelectedQueueNetworkA,
    setSelectedQueueTokensA,
    setSelectedQueueNetworkB,
    setSelectedQueueTokensB,
    resetNetworkSelection,
  } = useNetworkContext();

  const { networkEnv, updateNetworkEnv, resetNetworkEnv } =
    useNetworkEnvironmentContext();
  const { Erc20Tokens } = useContractContext();
  const { dfcAddress, dfcAddressDetails, txnForm, setStorage, txnHash } =
    useQueueStorageContext();

  const [amount, setAmount] = useState<string>("");
  const [amountErr, setAmountErr] = useState<string>("");
  const [addressInput, setAddressInput] = useState<string>("");
  const [hasAddressInputErr, setHasAddressInputErr] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showErcToDfcRestoreModal, setShowErcToDfcRestoreModal] =
    useState<boolean>(false);

  const [utilityModalData, setUtilityModalData] =
    useState<ModalConfigType | null>(null);

  const [fee, feeSymbol] = useTransferFee(amount);

  const { address, isConnected } = useAccount();
  const isSendingFromEthNetwork =
    selectedQueueNetworkA.name === Network.Ethereum;
  const {
    data: evmBalance,
    refetch: refetchEvmBalance,
    isFetching: isEvmBalanceFetching,
  } = useBalance({
    address,
    enabled: isSendingFromEthNetwork,
    watch: false,
    ...(isSendingFromEthNetwork &&
      selectedQueueTokensA.tokenA.name !== ETHEREUM_SYMBOL && {
        token: Erc20Tokens[selectedQueueTokensA.tokenA.name].address,
      }),
  });

  const maxAmount = new BigNumber(evmBalance?.formatted ?? 0);
  const [fromAddress, setFromAddress] = useState<string>(address || "");
  const [hasUnconfirmedTxn, setHasUnconfirmedTxn] = useState(false);

  const [getAddressDetail] = useGetAddressDetailMutation();

  const { getBalance } = useCheckBalance();
  const [isBalanceSufficient, setIsBalanceSufficient] = useState(true);
  const [tokenBalances, setTokenBalances] = useState<TokenBalances | {}>({});
  const [isVerifyingTransaction, setIsVerifyingTransaction] = useState(false);

  async function getBalanceFn(): Promise<TokenBalances | {}> {
    const key = `${selectedQueueNetworkA.name}-${selectedQueueTokensA.tokenB.symbol}`;
    const balance = await getBalance(selectedQueueTokensA.tokenB.symbol);
    const updatedBalances = {
      ...tokenBalances,
      [key]: balance,
    };

    setTokenBalances(updatedBalances);
    return updatedBalances;
  }

  const checkBalance = debounce(async () => {
    await getBalanceFn();
  }, 200);

  async function verifySufficientHWBalance(
    refetch?: boolean
  ): Promise<boolean | undefined> {
    const key = `${selectedQueueNetworkA.name}-${selectedQueueTokensA.tokenB.symbol}`;
    const balance = (refetch ? await getBalanceFn() : tokenBalances)[key];

    if (balance === null || new BigNumber(balance).lte(0)) {
      setIsBalanceSufficient(false);
      return false;
    }

    if (balance) {
      const isSufficientBalance = new BigNumber(balance).isGreaterThanOrEqualTo(
        amount !== "" ? amount : 0
      );

      setIsBalanceSufficient(isSufficientBalance);
      return isSufficientBalance;
    }

    return undefined;
  }

  useEffect(() => {
    verifySufficientHWBalance();
  }, [
    selectedQueueNetworkA,
    selectedQueueTokensA,
    networkEnv,
    tokenBalances,
    amount,
  ]);

  useEffect(() => {
    checkBalance();
  }, [selectedQueueNetworkA, selectedQueueTokensA, networkEnv]);

  const isFormValid =
    amount && new BigNumber(amount).gt(0) && !amountErr && !hasAddressInputErr;

  const validateAmountInput = (value: string, maxValue: BigNumber) => {
    const isSendingToDFC = selectedQueueNetworkB.name === Network.DeFiChain;
    let err = "";
    if (isSendingToDFC && new BigNumber(value).gt(maxValue.toFixed(8))) {
      err = "Insufficient Funds";
    }
    if (
      isSendingToDFC &&
      new BigNumber(value).lt(
        new BigNumber(1).dividedBy(new BigNumber(10).pow(8))
      )
    ) {
      err = "Invalid Amount";
    }
    setAmountErr(err);

    return err;
  };

  const onInputChange = (value: string): void => {
    const numberOnlyRegex = /^\d*\.?\d*$/; // regex to allow only number
    const maxDpRegex = /^\d*(\.\d{0,5})?$/; // regex to allow only max of 5 dp

    if (
      value === "" ||
      (numberOnlyRegex.test(value) && maxDpRegex.test(value))
    ) {
      setAmount(value);
      validateAmountInput(value, maxAmount);
    }
  };

  const onTransferTokens = async (): Promise<void> => {
    setIsVerifyingTransaction(true);
    const isBalanceSufficientVerified = await verifySufficientHWBalance(true);
    if (isBalanceSufficientVerified) {
      if (isSendingFromEthNetwork) {
        // Revalidate entered amount after refetching EVM balance
        const refetchedEvmBalance = await refetchEvmBalance();
        if (
          validateAmountInput(
            amount,
            new BigNumber(refetchedEvmBalance.data?.formatted ?? 0)
          )
        ) {
          setIsVerifyingTransaction(false);
          return;
        }
      }
      if (!hasUnconfirmedTxn) {
        const newTxn = {
          selectedQueueNetworkA,
          selectedQueueTokensA,
          selectedQueueNetworkB,
          selectedQueueTokensB,
          networkEnv,
          amount,
          fromAddress,
          toAddress: addressInput,
        };
        setStorage("txn-form-queue", JSON.stringify(newTxn));
      }
      setShowConfirmModal(true);
    }
    setIsVerifyingTransaction(false);
  };

  const onResetTransferForm = () => {
    setUtilityModalData(null);
    setStorage("txn-form-queue", null);
    setStorage("dfc-address-queue", null);
    setStorage("dfc-address-details-queue", null);
    setHasUnconfirmedTxn(false);
    setAmount("");
    setAddressInput("");
    setFromAddress(address || "");
    setAmountErr("");
    resetNetworkSelection();
    resetNetworkEnv();
  };

  const onRefreshEvmBalance = async () => {
    await refetchEvmBalance();
  };

  const getActionBtnLabel = () => {
    switch (true) {
      case hasPendingTxn:
        return "Pending Transaction";
      case hasUnconfirmedTxn:
        return "Retry transfer";
      case isConnected:
        return "Review transaction";
      default:
        return "Connect wallet";
    }
  };

  const UtilityModalMessage = {
    resetForm: {
      title: "Are you sure you want to reset form?",
      message:
        "Resetting it will lose any pending transaction and funds related to it. This is irrecoverable, proceed with caution",
      primaryButtonLabel: "Reset form",
      onPrimaryButtonClick: () => onResetTransferForm(),
      secondaryButtonLabel: "Go back",
      onSecondaryButtonClick: () => setUtilityModalData(null),
    },
    leaveTransaction: {
      title: "Are you sure you want to leave your transaction?",
      message:
        "You may lose any pending transaction and funds related to it. This is irrecoverable, proceed with caution",
      primaryButtonLabel: "Leave transaction",
      onPrimaryButtonClick: () => {
        setShowConfirmModal(false);
        setUtilityModalData(null);
      },
      secondaryButtonLabel: "Go back",
      onSecondaryButtonClick: () => setUtilityModalData(null),
    },
  };

  async function confirmationModalonClose(noCloseWarning: boolean) {
    if (noCloseWarning) {
      if (isSendingFromEthNetwork) {
        // Wait 15 seconds to give some time for txn to be confirmed
        setTimeout(async () => {
          await refetchEvmBalance();
        }, 15000);
      }

      setShowConfirmModal(false);
    } else setUtilityModalData(UtilityModalMessage.leaveTransaction);
  }

  useEffect(() => {
    if (amount) {
      // Revalidate entered amount when selected token is changed
      validateAmountInput(amount, maxAmount);
    }
  }, [maxAmount]);

  useEffect(() => {
    const localData = txnForm;

    if (localData && networkEnv === localData.networkEnv) {
      // Load data from storage
      setHasUnconfirmedTxn(true);
      setAmount(localData.amount);
      setAddressInput(localData.toAddress);
      setFromAddress(localData.fromAddress ?? address);
      setSelectedQueueNetworkA(localData.selectedQueueNetworkA);
      setSelectedQueueTokensA(localData.selectedQueueTokensA);
      setSelectedQueueNetworkB(localData.selectedQueueNetworkB);
      setSelectedQueueTokensB(localData.selectedQueueTokensB);
      updateNetworkEnv(localData.networkEnv);
    } else {
      setHasUnconfirmedTxn(false);
      setFromAddress(address as string);
    }
  }, [networkEnv, txnForm]);

  const fetchAddressDetail = async (
    localDfcAddress: string | undefined
  ): Promise<void> => {
    try {
      if (localDfcAddress) {
        const addressDetailRes = await getAddressDetail({
          address: localDfcAddress,
        }).unwrap();
        const diff = dayjs().diff(dayjs(addressDetailRes?.createdAt));
        if (diff > DFC_TO_ERC_RESET_FORM_TIME_LIMIT) {
          setStorage("txn-form-queue", null);
          setStorage("dfc-address-queue", null);
        } else {
          // TODO: Improve setStorage by not forcing stringified JSON
          setStorage(
            "dfc-address-details-queue",
            JSON.stringify(addressDetailRes)
          );
        }
      } else {
        setStorage("dfc-address-details-queue", null);
      }
    } catch {
      setStorage("dfc-address-details-queue", null);
    }
  };

  useEffect(() => {
    fetchAddressDetail(dfcAddress);
  }, [networkEnv, dfcAddress]);

  const { y, floating, strategy, refs } = useFloating({
    placement: "bottom-end",
    middleware: [
      shift(),
      size({
        apply({ rects }) {
          if (
            refs.floating.current !== null &&
            refs.floating.current !== undefined
          ) {
            Object.assign(refs.floating.current.style, {
              minWidth: "225px",
              maxWidth: "368px",
              width: `${rects.reference.width}px`,
            });
          }
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const floatingObj = {
    strategy,
    y,
    floating,
  };

  const warningTextStyle =
    "block text-xs text-warning text-center lg:px-6 lg:text-sm";

  return (
    <div
      className={clsx(
        "w-full md:w-[calc(100%+2px)] lg:w-full p-6 md:pt-8 pb-16 lg:p-10",
        "dark-card-bg-image backdrop-blur-[18px]",
        "border border-dark-200 rounded-lg border-t-0 lg:rounded-tr-none lg:rounded-tl-none rounded-tr-none rounded-tl-none lg:rounded-xl",
        activeTab === FormOptions.QUEUE ? "block" : "hidden"
      )}
    >
      <section className="flex flex-col lg:px-5 px-4 gap-y-1">
        <span className="text-dark-900 lg:font-bold font-semibold lg:text-xl text-[16px] leading-5">
          Queue beyond active liquidity
        </span>
        <span className="lg:text-[16px] lg:leading-5 text-sm text-dark-700 font-desc">
          Transactions will be queued and may take up to 72 hours to be
          fulfilled.
        </span>
      </section>

      <div className="mt-4">
        <span className="pl-4 text-xs font-semibold text-dark-900 lg:pl-5 lg:text-sm">
          Amount to transfer
        </span>
        <QuickInputCard
          maxValue={maxAmount}
          onChange={onInputChange}
          value={amount}
          error={amountErr}
          showAmountsBtn={selectedQueueNetworkA.name === Network.Ethereum}
          disabled={hasUnconfirmedTxn}
          floatingObj={floatingObj}
          showTokenDropdown
          tokenDropDownValue={selectedQueueTokensA}
          options={selectedQueueNetworkA.tokens}
          setSelectedTokens={setSelectedQueueTokensA}
        />
        {isConnected && (
          <div className="flex flex-row pl-3 md:pl-5 lg:pl-6 mt-2 items-center">
            {amountErr ? (
              <span className="text-xs lg:text-sm text-error">{amountErr}</span>
            ) : (
              selectedQueueNetworkA.name === Network.Ethereum && (
                <>
                  <span className="text-xs lg:text-sm text-dark-700">
                    Available:
                  </span>
                  <NumericFormat
                    className="text-xs lg:text-sm text-dark-900 ml-1"
                    value={maxAmount.toFixed(5, BigNumber.ROUND_FLOOR)}
                    decimalScale={5}
                    thousandSeparator
                    suffix={` ${selectedQueueTokensA.tokenA.name}`}
                  />
                  <FiRefreshCw
                    onClick={onRefreshEvmBalance}
                    size={12}
                    className={clsx("text-dark-900 ml-2 cursor-pointer", {
                      "animate-spin": isEvmBalanceFetching,
                    })}
                  />
                </>
              )
            )}
          </div>
        )}
      </div>
      <div className="mb-6 mt-8 md:mt-6 lg:mt-7">
        <WalletAddressInput
          label="Destination Address"
          blockchain={selectedQueueNetworkB.name as Network}
          addressInput={addressInput}
          onAddressInputChange={(addrInput) => setAddressInput(addrInput)}
          onAddressInputError={(hasError) => setHasAddressInputErr(hasError)}
          disabled={!isConnected}
          readOnly={hasUnconfirmedTxn}
        />
      </div>
      <div className="flex flex-row justify-between items-center px-3 lg:px-5 mt-6 lg:mt-0">
        <div className="flex flex-row items-center">
          <span className="text-dark-700 text-xs lg:text-base font-semibold md:font-normal">
            Fees
          </span>
          <div className="ml-2">
            <IconTooltip title={FEES_INFO.title} content={FEES_INFO.content} />
          </div>
        </div>
        <NumericFormat
          className="max-w-[70%] block break-words text-right text-xs text-dark-1000 lg:text-base"
          value={fee}
          thousandSeparator
          suffix={` ${feeSymbol}`}
          trimTrailingZeros
        />
      </div>
      <div className="flex flex-row justify-between items-center px-3 lg:px-5 mt-4 lg:mt-[18px]">
        <span className="text-dark-700 text-xs lg:text-base font-semibold md:font-normal">
          To receive
        </span>
        <NumericFormat
          className="max-w-[70%] block break-words text-right text-dark-1000 text-sm leading-5 lg:text-lg lg:leading-6 font-bold"
          value={BigNumber.max(
            new BigNumber(amount || 0).minus(fee),
            0
          ).toFixed(6, BigNumber.ROUND_FLOOR)}
          thousandSeparator
          suffix={` ${selectedQueueTokensB.tokenA.name}`}
          trimTrailingZeros
        />
      </div>
      <div className="mt-8 px-6 md:px-4 lg:mt-12 lg:mb-0 lg:px-0 xl:px-20">
        {/* Todo: to update the button when Review modal is ready*/}
        <ConnectKitButton.Custom>
          {({ show }) => (
            <ActionButton
              testId="transfer-btn"
              label={getActionBtnLabel()}
              isLoading={hasPendingTxn || isVerifyingTransaction}
              disabled={(isConnected && !isFormValid) || hasPendingTxn}
              onClick={!isConnected ? show : () => onTransferTokens()}
            />
          )}
        </ConnectKitButton.Custom>
        {isConnected &&
          selectedQueueNetworkA.name === Network.Ethereum &&
          !amount &&
          !addressInput &&
          !hasPendingTxn &&
          !txnHash.confirmed && (
            <div className="text-xs lg:text-sm leading-4 lg:leading-5 text-dark-700 text-center mt-4">
              Transaction interrupted?
              <button
                type="button"
                className="text-dark-1000 font-bold ml-1"
                onClick={() => setShowErcToDfcRestoreModal(true)}
              >
                Recover it here
              </button>
            </div>
          )}

        {hasPendingTxn && (
          <span className={clsx("pt-2", warningTextStyle)}>
            Unable to edit while transaction is pending
          </span>
        )}
        {hasUnconfirmedTxn && !hasPendingTxn && (
          <div className="mt-3">
            <ActionButton
              label="Reset form"
              onClick={() => {
                setUtilityModalData(UtilityModalMessage.resetForm);
              }}
              variant="secondary"
            />
          </div>
        )}

        {isBalanceSufficient && !hasPendingTxn && amount !== "" && (
          <div
            className={clsx(
              "lg:pt-5 md:pt-4 pt-[15px] text-center lg:text-sm text-xs"
            )}
          >
            <span className="text-dark-700">
              Amount entered is within the active limit. Use&nbsp;
            </span>
            <span className="text-dark-1000 font-semibold">Instant</span>
            <span className="text-dark-700">&nbsp;for faster processing.</span>
          </div>
        )}
      </div>
      <ConfirmTransferModal
        show={showConfirmModal}
        addressDetail={dfcAddressDetails}
        onClose={(noCloseWarning) => {
          confirmationModalonClose(noCloseWarning);
        }}
        amount={amount}
        fromAddress={fromAddress}
        toAddress={addressInput}
      />
      {utilityModalData && (
        <UtilityModal
          title={utilityModalData.title}
          message={utilityModalData.message}
          primaryButtonLabel={utilityModalData.primaryButtonLabel}
          onPrimaryButtonClick={utilityModalData.onPrimaryButtonClick}
          secondaryButtonLabel={utilityModalData.secondaryButtonLabel}
          onSecondaryButtonClick={utilityModalData.onSecondaryButtonClick}
        />
      )}
      {showErcToDfcRestoreModal && (
        <QueryTransactionModal
          title="Recover transaction"
          message="Enter your Ethereum transaction hash to load your transaction again for review"
          inputLabel="Transaction hash"
          inputPlaceholder="Enter transaction hash"
          buttonLabel="Restore transaction"
          onClose={() => setShowErcToDfcRestoreModal(false)}
          // contractType={ContractType.Instant}
          inputErrorMessage="Enter a valid transaction hash for Ethereum"
        />
      )}
    </div>
  );
}
