import { JSX } from "@babel/types";
import { PropsWithChildren, ReactNode, useState } from "react";
import { Placement, useFloating, shift } from "@floating-ui/react-dom";
import clsx from "clsx";

interface IconPopoverProps {
  popover: string | ReactNode;
  placement?: Placement;
  className?: string;
}

export function HoverPopover(
  props: PropsWithChildren<IconPopoverProps>
): JSX.Element {
  const [isHover, setIsHover] = useState(false);

  const { x, y, reference, floating, strategy } = useFloating({
    placement: props.placement ?? "bottom",
    middleware: [shift()],
    strategy: "fixed",
  });

  return (
    <>
      <div
        ref={reference}
        onMouseOver={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        onTouchCancel={() => setIsHover(false)}
        className={clsx(props.className, "cursor-pointer")}
      >
        {props.children}
      </div>

      {(() => {
        if (!isHover) {
          return null;
        }

        return (
          <div
            ref={floating}
            style={{
              position: strategy,
              top: y ?? "",
              left: x ?? "",
            }}
            className="p-2 z-20"
          >
            {typeof props.popover === "string" ? (
              <div className=" w-[328px] rounded bg-dark-1000 px-3 py-2 text-sm text-dark-00 text-left">
                {props.popover}
              </div>
            ) : (
              props.popover
            )}
          </div>
        );
      })()}
    </>
  );
}
