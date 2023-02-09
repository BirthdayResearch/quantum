import Image from "next/image";
import Link from "next/link";
import { useAccount } from "wagmi";
import clsx from "clsx";
import { FiBook, FiHelpCircle } from "react-icons/fi";
import { TokenDetailI } from "types";
import truncateTextFromMiddle from "@utils/textHelper";
import { useNetworkContext } from "@contexts/NetworkContext";
import useResponsive from "@hooks/useResponsive";
import DailyLimit from "./DailyLimit";
import IconTooltip from "./commons/IconTooltip";
import { DAILY_LIMIT_INFO } from "../constants";

function TokenSupplyItem({
  token,
  tokenStyle,
}: {
  token: TokenDetailI;
  tokenStyle?: string;
}) {
  return (
    <div
      className={clsx(
        "flex flex-row items-center min-w-[45%] 2xl:min-w-[30%]",
        tokenStyle
      )}
    >
      <Image
        width={100}
        height={100}
        src={token.icon}
        alt={token.name}
        className="w-6 h-6"
      />
    </div>
  );
}

export default function ProofOfAssetsCard() {
  const { isMd, isLg } = useResponsive();
  const { selectedTokensA, selectedTokensB } = useNetworkContext();
  const { address } = useAccount();

  return (
    <div className="h-full md:h-auto relative w-full md:dark-card-bg-image md:rounded-lg lg:rounded-xl md:border md:border-dark-200 md:backdrop-blur-[18px] md:px-6 md:pt-6 lg:px-8 lg:pt-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <span className="hidden md:block text-lg lg:text-2xl font-semibold leading-6 lg:leading-9 tracking-wide text-dark-900">
            Daily Limit
          </span>
          <div className="ml-[9.33px]">
            <IconTooltip
              title={DAILY_LIMIT_INFO.title}
              content={DAILY_LIMIT_INFO.content}
            />
          </div>
        </div>

        <div className="flex">
          <TokenSupplyItem
            token={selectedTokensA.tokenA}
            tokenStyle="absolute z-50"
          />
          <TokenSupplyItem
            token={selectedTokensB.tokenA}
            tokenStyle=" ml-5 z-40"
          />
        </div>
      </div>

      <Link href={`/address/${address ?? ""}`} className="focus:outline-none">
        <div className="text-sm md:text-xs lg:text-sm text-valid break-all pr-[76px] md:pr-0 hover:underline">
          {isMd
            ? truncateTextFromMiddle(address ?? "", isLg ? 16 : 10)
            : address}
        </div>
      </Link>
      <div className="hidden md:block mt-5 lg:mt-6">
        <DailyLimit />
      </div>
      <div className="flex items-center border-t-[0.5px] border-t-dark-200 md:border-t-0 rounded-b-lg lg:rounded-b-xl md:dark-bg-card-section md:-mx-6 mt-5 md:mt-4 lg:mt-6 lg:-mx-8 pt-4 pb-0 md:pb-5 md:px-6 lg:px-8">
        <div className="hidden md:block">
          <div className="flex flex-row items-center">
            <button type="button" className="flex flex-row items-center">
              <FiBook size={20} className="text-dark-700" />
              <span className="ml-2 text-sm font-semibold text-dark-700">
                User Guide
              </span>
            </button>
            <button type="button" className="ml-6 flex flex-row items-center">
              <FiHelpCircle size={20} className="text-dark-700" />
              <span className="ml-2 text-sm font-semibold text-dark-700">
                FAQs
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
