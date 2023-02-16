import { CircularProgressbarWithChildren } from "react-circular-progressbar";
import { useState, useEffect } from "react";
import useResponsive from "../hooks/useResponsive";

export default function ConfirmationProgress({
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
