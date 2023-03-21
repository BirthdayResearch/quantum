import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/router";

export default function Navigation() {
  const router = useRouter();
  const isRoot = router.pathname === "/";

  return (
    <div className="flex flex-row rounded-[40px] bg-dark-100 p-1 border-[0.5px] border-dark-300/50">
      <NextLink
        href="/"
        className={clsx(
          "w-1/2 text-xs md:text-sm py-3 min-w-[136px] text-center font-semibold rounded-[40px]",
          isRoot ? "bg-dark-1000 text-dark-00" : "text-dark-1000"
        )}
      >
        Bridge
      </NextLink>
      <NextLink
        href="/liquidityOverview"
        className={clsx(
          "w-1/2 text-xs md:text-sm py-3 min-w-[136px] text-center font-semibold rounded-[40px]",
          !isRoot ? "bg-dark-1000 text-dark-00" : "text-dark-1000"
        )}
      >
        Liquidity
      </NextLink>
    </div>
  );
}
