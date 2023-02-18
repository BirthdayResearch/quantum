import clsx from "clsx";
import BigNumber from "bignumber.js";
import { useEffect, useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { ConnectKitButton } from "connectkit";
import { shift, autoUpdate, size, useFloating } from "@floating-ui/react-dom";
import { networks, useNetworkContext } from "@contexts/NetworkContext";
import { useNetworkEnvironmentContext } from "@contexts/NetworkEnvironmentContext";
import { getStorageItem, setStorageItem } from "@utils/localStorage";
import {
  Network,
  SelectionType,
  TokensI,
  NetworkOptionsI,
  NetworkName,
  UnconfirmedTxnI,
  AddressDetails,
} from "types";
import SwitchIcon from "@components/icons/SwitchIcon";
import ArrowDownIcon from "@components/icons/ArrowDownIcon";
import ActionButton from "@components/commons/ActionButton";
import AlertInfoMessage from "@components/commons/AlertInfoMessage";
import IconTooltip from "@components/commons/IconTooltip";
import NumericFormat from "@components/commons/NumericFormat";
import { QuickInputCard } from "@components/commons/QuickInputCard";
import { useContractContext } from "@contexts/ContractContext";
import useBridgeFormStorageKeys from "@hooks/useBridgeFormStorageKeys";
import { useGetAddressDetailMutation } from "@store/defichain";
import dayjs from "dayjs";
import useTransferFee from "@hooks/useTransferFee";
import InputSelector from "./InputSelector";
import WalletAddressInput from "./WalletAddressInput";
import DailyLimit from "./DailyLimit";
import ConfirmTransferModal from "./ConfirmTransferModal";
import {
  DFC_TO_ERC_RESET_FORM_TIME_LIMIT,
  ETHEREUM_SYMBOL,
  FEES_INFO,
} from "../constants";

function SwitchButton({
  onClick,
  disabled = false,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="my-8 flex flex-row">
      <div className="mt-6 flex w-full flex-1 justify-between border-t border-dark-300 border-opacity-50" />
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={clsx(
          "dark-card-bg dark-bg-card-section group flex h-12 w-12 items-center justify-center rounded-full",
          { "pointer-events-none": disabled }
        )}
      >
        <div className="hidden group-hover:hidden lg:block">
          <ArrowDownIcon size={24} className="fill-dark-700" />
        </div>
        <div className="group-hover:block lg:hidden">
          <SwitchIcon size={24} className="fill-dark-700" />
        </div>
      </button>
      <div className="mt-6 flex w-full flex-1 justify-between border-t border-dark-300 border-opacity-50" />
    </div>
  );
}

export default function BridgeForm() {
  const {
    selectedNetworkA,
    selectedTokensA,
    selectedNetworkB,
    selectedTokensB,
    setSelectedNetworkA,
    setSelectedTokensA,
    setSelectedNetworkB,
    setSelectedTokensB,
    resetNetworkSelection,
  } = useNetworkContext();

  const { networkEnv, updateNetworkEnv, resetNetworkEnv } =
    useNetworkEnvironmentContext();
  const { Erc20Tokens } = useContractContext();

  const [amount, setAmount] = useState<string>("");
  const [amountErr, setAmountErr] = useState<string>("");
  const [addressInput, setAddressInput] = useState<string>("");
  const [hasAddressInputErr, setHasAddressInputErr] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  const [fee, feeSymbol] = useTransferFee(amount);

  const { address, isConnected } = useAccount();
  const isSendingErcToken =
    selectedNetworkA.name === Network.Ethereum &&
    selectedTokensA.tokenA.name !== ETHEREUM_SYMBOL;
  const { data } = useBalance({
    address,
    watch: true,
    ...(isSendingErcToken && {
      token: Erc20Tokens[selectedTokensA.tokenA.name].address,
    }),
  });

  const maxAmount = new BigNumber(data?.formatted ?? 0);
  const [fromAddress, setFromAddress] = useState<string>(address || "");
  const [hasUnconfirmedTxn, setHasUnconfirmedTxn] = useState(false);

  const [getAddressDetail] = useGetAddressDetailMutation();
  const [addressDetail, setAddressDetail] = useState<AddressDetails>();

  const { TXN_KEY, DFC_ADDR_KEY } = useBridgeFormStorageKeys();

  const switchNetwork = () => {
    setSelectedNetworkA(selectedNetworkB);
  };

  const validateAmountInput = (value: string) => {
    const isSendingToDFC = selectedNetworkB.name === NetworkName.DeFiChain;
    let err = "";
    if (isSendingToDFC && new BigNumber(value).gt(maxAmount)) {
      err = "Insufficient Funds";
    }
    setAmountErr(err);
  };

  const onInputChange = (value: string): void => {
    // regex to allow only number
    const re = /^\d*\.?\d*$/;
    if (value === "" || re.test(value)) {
      setAmount(value);
      validateAmountInput(value);
    }
  };

  const onTransferTokens = (): void => {
    if (!hasUnconfirmedTxn) {
      const newTxn = {
        selectedNetworkA,
        selectedTokensA,
        selectedNetworkB,
        selectedTokensB,
        networkEnv,
        amount,
        fromAddress,
        toAddress: addressInput,
      };
      setStorageItem<UnconfirmedTxnI>(TXN_KEY, newTxn);
    }
    /* TODO: Handle token transfer here */
    setShowConfirmModal(true);
  };

  const onResetTransferForm = () => {
    setStorageItem(TXN_KEY, null);
    setStorageItem(DFC_ADDR_KEY, null);
    setAddressDetail(undefined);
    setHasUnconfirmedTxn(false);
    setAmount("");
    setAddressInput("");
    setFromAddress(address || "");
    setAmountErr("");
    resetNetworkSelection();
    resetNetworkEnv();
  };

  const getActionBtnLabel = () => {
    switch (true) {
      case hasUnconfirmedTxn:
        return "Retry transfer";
      case isConnected:
        return `Transfer to ${NetworkName[selectedNetworkB.name]}`;
      default:
        return "Connect wallet";
    }
  };

  useEffect(() => {
    if (amount) {
      // Revalidate entered amount when selected token is changed
      validateAmountInput(amount);
    }
  }, [maxAmount]);

  useEffect(() => {
    const localData = getStorageItem<UnconfirmedTxnI>(TXN_KEY);
    if (localData && networkEnv === localData.networkEnv) {
      // Load data from storage
      setHasUnconfirmedTxn(true);
      setAmount(localData.amount);
      setAddressInput(localData.toAddress);
      setFromAddress(localData.fromAddress);
      setSelectedNetworkA(localData.selectedNetworkA);
      setSelectedTokensA(localData.selectedTokensA);
      setSelectedNetworkB(localData.selectedNetworkB);
      setSelectedTokensB(localData.selectedTokensB);
      updateNetworkEnv(localData.networkEnv);
    } else {
      setHasUnconfirmedTxn(false);
    }
  }, [networkEnv]);

  const fetchAddressDetail = async (): Promise<void> => {
    try {
      const localDfcAddress = getStorageItem<string>(DFC_ADDR_KEY);
      if (localDfcAddress) {
        const addressDetailRes = await getAddressDetail({
          address: localDfcAddress,
        }).unwrap();
        const diff = dayjs().diff(dayjs(addressDetailRes?.createdAt));
        if (diff > DFC_TO_ERC_RESET_FORM_TIME_LIMIT) {
          setStorageItem(TXN_KEY, null);
          setStorageItem(DFC_ADDR_KEY, null);
        } else {
          setAddressDetail(addressDetailRes);
        }
      } else {
        setAddressDetail(undefined);
      }
    } catch {
      setAddressDetail(undefined);
    }
  };

  useEffect(() => {
    // fetch address details
    fetchAddressDetail();
  }, [networkEnv]);

  const { y, reference, floating, strategy, refs } = useFloating({
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

  const isFormValid =
    amount && new BigNumber(amount).gt(0) && !amountErr && !hasAddressInputErr;

  return (
    <div className="w-full md:w-[calc(100%+2px)] lg:w-full dark-card-bg-image p-6 md:pt-8 pb-16 lg:p-12 rounded-lg lg:rounded-xl border border-dark-200 backdrop-blur-[18px]">
      {hasUnconfirmedTxn && (
        <AlertInfoMessage
          message="An unconfirmed transaction is found in your device and has been pre-loaded for your confirmation"
          containerStyle="px-4 py-3 mb-8 md:px-6 md:py-4 md:mb-12"
          textStyle="text-xs md:text-base"
        />
      )}
      <div className="flex flex-row items-center" ref={reference}>
        <div className="w-1/2">
          <InputSelector
            label="Source Network"
            popUpLabel="Select source"
            options={networks}
            floatingObj={floatingObj}
            type={SelectionType.Network}
            onSelect={(value: NetworkOptionsI) => setSelectedNetworkA(value)}
            value={selectedNetworkA}
            disabled={hasUnconfirmedTxn}
          />
        </div>
        <div className="w-1/2">
          <InputSelector
            label="Token"
            popUpLabel="Select token"
            options={selectedNetworkA.tokens}
            floatingObj={floatingObj}
            type={SelectionType.Token}
            onSelect={(value: TokensI) => setSelectedTokensA(value)}
            value={selectedTokensA}
            disabled={hasUnconfirmedTxn}
          />
        </div>
      </div>
      <div className="mt-5">
        <span className="pl-4 text-xs font-semibold text-dark-900 lg:pl-5 lg:text-base">
          Amount to transfer
        </span>
        <QuickInputCard
          maxValue={maxAmount}
          onChange={onInputChange}
          value={amount}
          error={amountErr}
          showAmountsBtn={selectedNetworkA.name === Network.Ethereum}
          disabled={hasUnconfirmedTxn}
        />
        <div className="flex flex-row pl-4 lg:pl-5 mt-2">
          {amountErr ? (
            <span className="text-xs lg:text-sm text-error">{amountErr}</span>
          ) : (
            selectedNetworkA.name === Network.Ethereum && (
              <>
                <span className="text-xs lg:text-sm text-dark-700">
                  Available:
                </span>
                <NumericFormat
                  className="text-xs lg:text-sm text-dark-900 ml-1"
                  value={maxAmount}
                  decimalScale={8}
                  thousandSeparator
                  suffix={` ${selectedTokensA.tokenA.name}`}
                />
              </>
            )
          )}
        </div>
      </div>
      <SwitchButton onClick={switchNetwork} disabled={hasUnconfirmedTxn} />

      <div className="flex flex-row items-end mb-4 lg:mb-5">
        <div className="w-1/2">
          <InputSelector
            label="Destination Network"
            disabled
            popUpLabel="Select destination"
            floatingObj={floatingObj}
            type={SelectionType.Network}
            value={selectedNetworkB}
          />
        </div>
        <div className="w-1/2">
          <InputSelector
            disabled
            label="Token to Receive"
            popUpLabel="Select token"
            floatingObj={floatingObj}
            type={SelectionType.Token}
            value={selectedTokensB}
          />
        </div>
      </div>
      <div className="mb-8">
        <WalletAddressInput
          label="Address"
          blockchain={selectedNetworkB.name as Network}
          addressInput={addressInput}
          onAddressInputChange={(addrInput) => setAddressInput(addrInput)}
          onAddressInputError={(hasError) => setHasAddressInputErr(hasError)}
          disabled={!isConnected}
          readOnly={hasUnconfirmedTxn}
        />
      </div>
      <div className="flex flex-row justify-between items-center px-4 lg:px-5">
        <span className="text-dark-700 text-xs lg:text-base font-semibold md:font-normal">
          To receive
        </span>
        <NumericFormat
          className="text-left text-xs text-dark-1000 lg:text-base"
          value={amount || 0}
          thousandSeparator
          suffix={` ${selectedTokensB.tokenA.name}`}
          trimTrailingZeros
        />
      </div>
      <div className="flex flex-row justify-between items-center px-4 lg:px-5 mt-4 lg:mt-6">
        <div className="flex flex-row items-center">
          <span className="text-dark-700 text-xs lg:text-base font-semibold md:font-normal">
            Fees
          </span>
          <div className="ml-2">
            <IconTooltip title={FEES_INFO.title} content={FEES_INFO.content} />
          </div>
        </div>
        <NumericFormat
          className="text-left text-xs text-dark-1000 lg:text-base"
          value={fee}
          thousandSeparator
          suffix={` ${feeSymbol}`}
          trimTrailingZeros
        />
      </div>
      <div className="block md:hidden px-5 mt-4">
        <DailyLimit />
      </div>
      <div className="mt-8 px-6 md:mt-6 md:px-4 lg:mt-16 lg:mb-0 lg:px-0 xl:px-20">
        <ConnectKitButton.Custom>
          {({ show }) => (
            <ActionButton
              testId="transfer-btn"
              label={getActionBtnLabel()}
              disabled={isConnected && !isFormValid}
              onClick={!isConnected ? show : () => onTransferTokens()}
            />
          )}
        </ConnectKitButton.Custom>
        {hasUnconfirmedTxn && (
          <div className="mt-3">
            <ActionButton
              label="Reset form"
              onClick={() => onResetTransferForm()}
              variant="secondary"
            />
          </div>
        )}
      </div>
      <ConfirmTransferModal
        show={showConfirmModal}
        addressDetail={addressDetail}
        onClose={() => setShowConfirmModal(false)}
        amount={amount}
        fromAddress={fromAddress}
        toAddress={addressInput}
      />
    </div>
  );
}
