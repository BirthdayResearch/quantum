import Footer from "@components/Footer";
import Header from "@components/Header";
import clsx from "clsx";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Maintenance from "./Maintenance";
import { useLazyBridgeStatusQuery } from "../store";

export default function ScreenContainer({
  children,
}: {
  children: JSX.Element;
}): JSX.Element {
  const router = useRouter();

  // if isMaintenanceEnabled is true, this condition will supersede /404 page display
  const [trigger] = useLazyBridgeStatusQuery();

  const [isLoaded, setIsLoaded] = useState(false);
  const [isBridgeUp, setIsBridgeUp] = useState(true);

  async function checkBridgeStatus() {
    try {
      const { data, isSuccess } = await trigger({});
      // Assumes that the bridge is up unless the api explicitly returns isUp !== true
      if (isSuccess) {
        setIsBridgeUp(data?.isUp === true);
      }
    } finally {
      setIsLoaded(true);
    }
  }

  useEffect(() => {
    checkBridgeStatus();
  }, []);

  // background picture has 2 conditions/designs: connected wallet bg design vs preconnected wallet bg design
  const bgPicture =
    !isBridgeUp || router.pathname === "/404"
      ? "bg-[url('/background/error_mobile.png')] md:bg-[url('/background/error_tablet.png')] lg:bg-[url('/background/error_desktop.png')]"
      : "bg-[url('/background/mobile.png')] md:bg-[url('/background/tablet.png')] lg:bg-[url('/background/desktop.png')]";

  return (
    <div className="relative">
      <Header />
      <div className="relative z-[1] flex-grow md:pb-12 lg:pb-20">
        {isLoaded ? (
          <div>{isBridgeUp ? <main>{children}</main> : <Maintenance />}</div>
        ) : (
          <div className="min-h-[60vh] lg:min-h-[50vh]" />
        )}
      </div>
      {isLoaded && (
        <div
          className={clsx(
            "absolute top-0 left-0 z-auto h-full w-full bg-cover bg-local bg-clip-padding bg-top bg-no-repeat bg-origin-padding mix-blend-screen lg:bg-center",
            bgPicture
          )}
        />
      )}
      <Footer />
    </div>
  );
}
