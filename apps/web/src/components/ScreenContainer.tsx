import Footer from "@components/Footer";
import Header from "@components/Header";
import { useGetBridgeStatusQuery } from "@store/website";
import clsx from "clsx";
import { useRouter } from "next/router";
import Maintenance from "./Maintenance";

export default function ScreenContainer({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {
  // if isMaintenanceEnabled is true, this condition will supersede /404 page display
  const { data: getBridgeStatus } = useGetBridgeStatusQuery("");
  const isMaintenanceEnabled = getBridgeStatus?.isUp;

  const router = useRouter();

  // background picture has 2 conditions/designs: connected wallet bg design vs preconnected wallet bg design
  const bgPicture =
    isMaintenanceEnabled || router.pathname === "/404"
      ? "bg-[url('/background/error_mobile.png')] md:bg-[url('/background/error_tablet.png')] lg:bg-[url('/background/error_desktop.png')]"
      : "bg-[url('/background/mobile.png')] md:bg-[url('/background/tablet.png')] lg:bg-[url('/background/desktop.png')]";

  return (
    <div className="relative">
      <Header />
      <div className="relative z-[1] flex-grow md:pb-28">
        {isMaintenanceEnabled ? <Maintenance /> : <main>{children}</main>}
      </div>
      <div
        className={clsx(
          "absolute top-0 left-0 z-auto h-full w-full bg-cover bg-local bg-clip-padding bg-top bg-no-repeat bg-origin-padding mix-blend-screen lg:bg-center",
          bgPicture
        )}
      />
      <Footer />
    </div>
  );
}
