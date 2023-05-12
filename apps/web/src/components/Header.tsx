import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useNetwork } from "wagmi";
import ConnectButton from "./ConnectButton";
import Banner from "./Banner";
import Navigation from "./Navigation";
import EnvironmentNetworkSwitch from "./EnvironmentNetworkSwitch";
import AnnouncementBanner from "./AnnouncementBanner";
import QueryTransactionModal from "./erc-transfer/QueryTransactionModal";
import SearchQueuedTransactionButton from "./SearchQueuedTransactionButton";

export default function Header({
  isBridgeUp,
}: {
  isBridgeUp: boolean;
}): JSX.Element {
  const { chain } = useNetwork();
  const [
    isSearchQueuedTransactionModalOpen,
    setIsSearchQueuedTransactionModalOpen,
  ] = useState(false);

  return (
    <div className="relative z-[1] flex flex-col">
      <Banner />
      <AnnouncementBanner />
      <div className="flex items-center justify-between px-5 md:px-10 lg:px-[120px] pt-8 pb-6 md:py-6 lg:py-8 lg:pb-20">
        <Link href="/">
          <div className="relative cursor-pointer w-[85px] h-[15px] md:-ml-1 lg:-ml-2 md:w-[132px] md:h-[24.5px] lg:h-[31.5px] lg:w-[170px]">
            <Image
              fill
              data-testid="header-bridge-logo"
              src="/header-no-byline.svg"
              alt="Bridge Logo"
            />
          </div>
        </Link>
        {isBridgeUp && (
          <div className="hidden lg:block">
            <Navigation />
          </div>
        )}
        <div className="flex h-9 items-center md:h-10 lg:h-12">
          <SearchQueuedTransactionButton
            onClick={() => setIsSearchQueuedTransactionModalOpen(true)}
          />
          <ConnectButton />
          {chain === undefined && <EnvironmentNetworkSwitch />}
          {isSearchQueuedTransactionModalOpen && (
            <QueryTransactionModal
              title="Track transaction"
              message="Enter transaction hash of a queue transaction to track its status"
              inputLabel="Transaction hash"
              inputPlaceholder="Enter transaction hash"
              buttonLabel="Track status"
              onClose={() => setIsSearchQueuedTransactionModalOpen(false)}
              // contractType={ContractType.Queue}
              inputErrorMessage="Enter a valid transaction hash for Ethereum"
            />
          )}
        </div>
      </div>
      {isBridgeUp && (
        <div className="lg:hidden px-5 md:px-10 mb-6 md:mb-8">
          <Navigation />
        </div>
      )}
    </div>
  );
}
