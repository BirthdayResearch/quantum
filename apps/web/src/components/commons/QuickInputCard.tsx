import BigNumber from "bignumber.js";
import clsx from "clsx";
import { IoCloseCircleSharp } from "react-icons/io5";

interface QuickInputCardProps {
  maxValue: BigNumber;
  value: string;
  onChange: (amount: string) => void;
  error?: string;
  showAmountsBtn?: boolean;
  disabled?: boolean;
}

interface SetAmountButtonProps {
  type: AmountButtonTypes;
  onClick: (amount: string) => void;
  amount: BigNumber;
  hasBorder?: boolean;
  disabled?: boolean;
}

export enum AmountButtonTypes {
  TwentyFive = "25%",
  Half = "50%",
  SeventyFive = "75%",
  Max = "Max",
}

export enum TransactionCardStatus {
  Default,
  Active,
  Error,
}

function SetAmountButton({
  type,
  onClick,
  amount,
  hasBorder,
  disabled,
}: SetAmountButtonProps): JSX.Element {
  const decimalPlace = 8;
  let value = amount.toFixed(decimalPlace);
  switch (type) {
    case AmountButtonTypes.TwentyFive:
      value = amount.multipliedBy(0.25).toFixed(decimalPlace);
      break;
    case AmountButtonTypes.Half:
      value = amount.multipliedBy(0.5).toFixed(decimalPlace);
      break;
    case AmountButtonTypes.SeventyFive:
      value = amount.multipliedBy(0.75).toFixed(decimalPlace);
      break;
    case AmountButtonTypes.Max:
    default:
      value = amount.toFixed(decimalPlace);
      break;
  }

  return (
    <button
      type="button"
      className={clsx(
        "w-full bg-dark-700 hover:hover-text-gradient-1 bg-clip-text",
        {
          "border-r-[0.5px] border-dark-300/50": hasBorder,
        }
      )}
      onClick={(): void => {
        onClick(value);
      }}
      disabled={disabled}
    >
      <div className="py-1 lg:py-1.5">
        <span className="font-semibold text-base lg:text-lg text-transparent">
          {type}
        </span>
      </div>
    </button>
  );
}

export function QuickInputCard({
  value,
  maxValue,
  onChange,
  error = "",
  disabled,
  showAmountsBtn = true,
}: QuickInputCardProps): JSX.Element {
  return (
    <div
      className={clsx(
        "relative w-full outline-0 group p-px rounded-lg mt-1 lg:mt-2 border",
        { "pointer-events-none": disabled },
        error === ""
          ? "border-dark-300 hover:border-dark-500 focus-within:!border-transparent focus-within:before:dark-gradient-2 focus-within:before:-inset-[1px] focus-within:before:rounded-lg focus-within:before:p-px"
          : "border-error"
      )}
    >
      <div className="flex flex-row px-5 py-[18px] lg:py-[22px]">
        <input
          data-testid="amount"
          className={clsx(
            "w-full max-h-36 grow resize-none bg-transparent text-lg lg:text-2xl text-dark-1000 focus:outline-none caret-dark-1000 placeholder-dark-500 hover:placeholder-dark-800 focus:placeholder-dark-300"
          )}
          placeholder="0.00"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
        />
        {value !== "" && !disabled && (
          <IoCloseCircleSharp
            size={20}
            onClick={() => onChange("")}
            className="text-dark-500 self-center cursor-pointer"
          />
        )}
      </div>
      {showAmountsBtn && (
        <div className="flex flex-row justify-between items-center py-1.5 lg:p-2 border-t border-dark-300/50 bg-dark-gradient-3">
          {Object.values(AmountButtonTypes).map((type, index, { length }) => (
            <SetAmountButton
              key={type}
              amount={maxValue}
              onClick={onChange}
              type={type}
              hasBorder={length - 1 !== index}
              disabled={disabled}
            />
          ))}
        </div>
      )}
    </div>
  );
}
