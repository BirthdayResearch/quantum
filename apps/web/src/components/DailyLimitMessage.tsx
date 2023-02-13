import clsx from "clsx";

export default function LimitMessage({
  message,
  color,
}: {
  message: string;
  color: string;
}) {
  return (
    <span
      className={clsx(
        "text-xs md:text-sm lg:text-base leading-4 md:leading-5 lg:leading-5",
        color
      )}
    >
      {message}
    </span>
  );
}
