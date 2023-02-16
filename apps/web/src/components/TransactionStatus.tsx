import { useState, useEffect } from "react";
import BigNumber from "bignumber.js";
import { FiArrowUpRight } from "react-icons/fi";
import { CircularProgressbarWithChildren } from "react-circular-progressbar";
import useResponsive from "../hooks/useResponsive";
import { useContractContext } from "../layouts/contexts/ContractContext";

function ConfirmationProgress({
  confirmationBlocksTotal,
  confirmationBlocksCurrent,
}: {
  confirmationBlocksTotal: number;
  confirmationBlocksCurrent: string;
}) {
  const { isLg } = useResponsive();
  const [valuePercentage, setValuePercentage] = useState<number>(0);

  useEffect(() => {
    setValuePercentage(
      (Number(confirmationBlocksCurrent) * 100) / confirmationBlocksTotal
    );
  }, [confirmationBlocksCurrent]);

  return (
    <div className="w-full">
      {isLg ? (
        <div className="w-[136px] h-[136px]">
          <svg style={{ height: 0, width: 0 }}>
            <defs>
              <linearGradient
                id="circularProgress"
                gradientTransform="rotate(90)"
              >
                <stop offset="0%" stopColor="#FF00FF" />
                <stop offset="100.4%" stopColor="#EC0C8D" />
              </linearGradient>
            </defs>
          </svg>
          <CircularProgressbarWithChildren
            value={valuePercentage}
            strokeWidth={3}
            counterClockwise
            styles={{
              path: { stroke: 'url("#circularProgress")' },
              trail: { stroke: "#2B2B2B" },
            }}
          >
            <div className="text-center">
              <div className="text-lg font-bold text-dark-1000">{`${confirmationBlocksCurrent} of 65`}</div>
              <span className="text-xs text-dark-700">Confirmations</span>
            </div>
          </CircularProgressbarWithChildren>
        </div>
      ) : (
        <div>
          <div className="flex text-sm text-dark-700">
            <span className="font-semibold text-brand-100">
              {`${confirmationBlocksCurrent} of ${confirmationBlocksTotal} \u00A0`}
            </span>
            confirmations
          </div>
          <div className="h-2 w-full bg-dark-200 rounded-md">
            <div
              style={{ width: `${valuePercentage}%` }}
              className="h-full rounded-md bg-brand-100"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionStatus({
  ethTxnStatus,
  txnHash,
}: {
  ethTxnStatus: {
    isConfirmed: boolean;
    numberOfConfirmations: string;
  };
  txnHash?: string;
}) {
  const { ExplorerURL } = useContractContext();
  const ConfirmationBlocksTotal = 65;

  return (
    <div className="w-full flex flex-col-reverse lg:flex-row lg:space-x-8 px-8 py-6 mb-6 text-dark-1000 dark-bg-gradient-1 rounded-xl border border-transparent">
      <div>
        <div className="font-bold leading-5 lg:text-xl lg:font-semibold">
          Processing transaction
        </div>
        <div className="pt-1 text-sm text-dark-700">
          Do not refresh, leave the browser, or close the tab until transaction
          is complete. Doing so may interrupt the transaction and cause loss of
          funds.
        </div>
        <a
          className="flex flex-row items-center mt-2 text-dark-900 text-xl font-bold hover:opacity-70"
          href={`${ExplorerURL}/tx/${txnHash}`}
          target="_blank"
          rel="noreferrer"
        >
          <FiArrowUpRight size={20} className="mr-2" />
          View on Etherscan
        </a>
      </div>
      <div className="mb-4">
        <ConfirmationProgress
          confirmationBlocksTotal={ConfirmationBlocksTotal}
          confirmationBlocksCurrent={
            new BigNumber(ethTxnStatus.numberOfConfirmations).isGreaterThan(65)
              ? ConfirmationBlocksTotal.toString()
              : ethTxnStatus.numberOfConfirmations
          }
        />
      </div>
    </div>
  );
}
