import { PropsWithChildren } from "react";
import { useDeFiScanContext } from "@contexts/DeFiScanContext";
import { networks } from "@contexts/NetworkContext";
import Image from "next/image";
import NumericFormat from "@components/commons/NumericFormat";
import BigNumber from "bignumber.js";
import { FiArrowUpRight, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useContractContext } from "@contexts/ContractContext";
import { Network, TokensI } from "types";
import clsx from "clsx";
import useResponsive from "@hooks/useResponsive";
import { Disclosure } from "@headlessui/react";
import IconTooltip from "./commons/IconTooltip";

function TokenInfo({
  name,
  icon,
  iconClass,
  nameClass,
  onClose,
}: {
  name: string;
  icon: string;
  iconClass?: string;
  nameClass?: string;
  onClose?: () => void;
}) {
  return (
    <div className="flex flex-row items-center justify-between">
      <div className="flex flex-row items-center">
        <Image
          width={100}
          height={100}
          src={icon}
          alt={name}
          data-testid={name}
          className={iconClass ?? "h-8 w-8"}
        />
        <span
          className={clsx(
            "ml-2 lg:ml-3 block truncate text-dark-1000 text-base",
            nameClass
          )}
        >
          {name}
        </span>
      </div>
      {onClose !== undefined && (
        <FiChevronUp
          onClick={onClose}
          className={clsx("h-6 w-6 text-dark-1000 transition-[transform]")}
        />
      )}
    </div>
  );
}

function AddressComponent({
  address,
  isDeFiAddress,
}: {
  address: string;
  isDeFiAddress: boolean;
}) {
  const { ExplorerURL } = useContractContext();
  const { getAddressUrl } = useDeFiScanContext();
  const url = isDeFiAddress
    ? getAddressUrl(address)
    : `${ExplorerURL}/address/${address}`;
  return (
    <a
      className="flex flex-col lg:flex-row items-end lg:items-center justify-end lg:justify-start text-dark-1000 text-xs lg:text-base font-semibold text-right lg:text-left break-all flex-1"
      href={url}
      target="_blank"
      rel="noreferrer"
    >
      {address}
      <div className="flex flex-row justify-between items-center mt-1 lg:mt-0 mb-1 lg:mb-0">
        <FiArrowUpRight className="text-dark-1000 mr-1 lg:mr-0 lg:ml-1 h-4 w-4" />
        <span className="lg:hidden font-semibold text-sm">View</span>
      </div>
    </a>
  );
}

function BorderDiv({
  children,
  className,
}: PropsWithChildren<{ className: string }>) {
  return (
    <div
      className={clsx(
        "border-gradient-6 relative bg-dark-00/50 rounded-[15px]",
        "before:absolute before:content-[''] before:inset-0 before:p-px before:rounded-[15px] before:z-[-1]",
        className
      )}
    >
      {children}
    </div>
  );
}

function TokenDetails({
  name,
  tokenName,
  icon,
  tokenIcon,
  isDeFiAddress,
  amount,
  containerClass,
  onClose,
}: {
  name: string;
  tokenName: string;
  icon: string;
  tokenIcon: string;
  isDeFiAddress: boolean;
  amount: BigNumber;
  containerClass?: string;
  onClose?: () => void;
}) {
  const { BridgeV1, hotWalletAddress } = useContractContext();
  const address = isDeFiAddress ? hotWalletAddress : BridgeV1.address;
  return (
    <div
      className={clsx(
        "flex flex-col md:w-1/2 lg:w-full lg:flex-row space-y-5 lg:space-y-0 justify-between items-center",
        containerClass
      )}
    >
      <div className="w-full lg:w-2/12">
        <TokenInfo
          name={tokenName}
          icon={tokenIcon}
          onClose={onClose}
          nameClass="font-semibold lg:font-normal"
          iconClass="h-6 w-6 md:h-8 md:w-8"
        />
      </div>
      <div className="w-full flex flex-row items-center justify-between lg:w-2/12">
        <span className="lg:hidden text-dark-700 text-sm w-5/12">
          Blockchain
        </span>
        <TokenInfo name={name} icon={icon} iconClass="h-5 w-5 lg:h-8 lg:w-8" />
      </div>
      <div className="w-full flex flex-row items-center justify-between lg:w-4/12">
        <div className="flex flex-row items-center lg:hidden text-dark-700 w-5/12 space-x-1">
          <span className="text-sm">Liquidity</span>
          <IconTooltip
            size={16}
            position="top"
            customIconColor="text-dark-700"
            content="The max amount available to bridge for a specific token."
          />
        </div>
        <NumericFormat
          className="text-dark-1000 text-sm lg:text-base text-dark-1000 text-right lg:text-left flex-1"
          value={amount}
          decimalScale={8}
          thousandSeparator
          suffix={` ${tokenName}`}
        />
      </div>
      <div className="w-full flex flex-row items-start lg:items-center justify-between lg:w-4/12">
        <span className="lg:hidden text-dark-700 text-sm w-5/12">Address</span>
        <AddressComponent address={address} isDeFiAddress={isDeFiAddress} />
      </div>
    </div>
  );
}

export default function OverviewList({ balances }) {
  const [firstNetwork, secondNetwork] = networks;
  const { isMobile } = useResponsive();

  const getAmount = (symbol: string, network): BigNumber => {
    if (network === Network.DeFiChain) {
      return new BigNumber(balances.DFC?.[symbol] ?? 0);
    }
    return new BigNumber(balances.EVM?.[symbol] ?? 0);
  };

  function getTokenRow(item: TokensI, onClose?: () => void) {
    return (
      <>
        <TokenDetails
          name={secondNetwork.name}
          tokenName={item.tokenA.name}
          icon={secondNetwork.icon}
          tokenIcon={item.tokenA.icon}
          isDeFiAddress={secondNetwork.name === Network.DeFiChain}
          amount={getAmount(item.tokenA.symbol, secondNetwork.name)}
          onClose={onClose}
          containerClass="pb-4 md:pb-0 lg:pb-5 md:pr-5 lg:pr-0"
        />
        <TokenDetails
          name={firstNetwork.name}
          tokenName={item.tokenB.name}
          icon={firstNetwork.icon}
          tokenIcon={item.tokenB.icon}
          isDeFiAddress={firstNetwork.name === Network.DeFiChain}
          amount={getAmount(item.tokenB.symbol, firstNetwork.name)}
          containerClass={clsx(
            "border-t-[0.5px] md:border-t-0 md:border-l-[0.5px] lg:border-l-0 lg:border-t-[0.5px] border-dark-200",
            "pt-4 md:pt-0 lg:pt-5 md:pl-5 lg:pl-0"
          )}
        />
      </>
    );
  }

  function getTokenCard(item: TokensI) {
    return (
      <Disclosure>
        {({ open, close }) => (
          <>
            {!open && (
              <Disclosure.Button>
                <div className="flex flex-row justify-between items-center">
                  <div className="flex flex-row">
                    <div className="mr-3">
                      <TokenInfo
                        name={item.tokenA.name}
                        icon={item.tokenA.icon}
                        iconClass="h-6 w-6"
                        nameClass="font-semibold"
                      />
                    </div>
                    <div className="pl-3 border-l-[0.5px] border-dark-200">
                      <TokenInfo
                        name={item.tokenB.name}
                        icon={item.tokenB.icon}
                        iconClass="h-6 w-6"
                        nameClass="font-semibold"
                      />
                    </div>
                  </div>
                  <FiChevronDown className="h-6 w-6 text-dark-1000 transition-[transform]" />
                </div>
              </Disclosure.Button>
            )}
            <Disclosure.Panel className="text-gray-500">
              {getTokenRow(item, close)}
            </Disclosure.Panel>
          </>
        )}
      </Disclosure>
    );
  }

  return (
    <>
      <div className="hidden lg:block mt-6 md:mt-8 lg:mt-12">
        <div className="flex flex-row px-8 py-4">
          <div className="text-dark-1000 text-sm font-semibold w-2/12">
            Token
          </div>
          <div className="text-dark-1000 text-sm font-semibold w-2/12">
            Blockchain
          </div>
          <div className="flex flex-row items-center text-dark-1000 text-sm w-4/12 space-x-1">
            <span className="font-semibold">Liquidity </span>
            <IconTooltip
              position="top"
              size={12}
              customIconColor="text-dark-1000"
              content="The max amount available to bridge for a specific token."
            />
          </div>
          <div className="text-dark-1000 text-sm font-semibold w-4/12">
            Address
          </div>
        </div>
      </div>
      <div className="space-y-3 md:space-y-4 px-5 md:px-0">
        {secondNetwork.tokens.map((item) => (
          <BorderDiv
            key={item.tokenA.name}
            className="px-4 md:px-5 lg:px-8 py-5 md:py-6 lg:py-5 flex flex-col md:flex-row lg:flex-col"
          >
            {isMobile ? getTokenCard(item) : getTokenRow(item)}
          </BorderDiv>
        ))}
      </div>
    </>
  );
}