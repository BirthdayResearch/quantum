import BridgeForm from "@components/BridgeForm";
import WelcomeHeader from "@components/WelcomeHeader";
import ProofOfAssetsCard from "@components/ProofOfAssetsCard";
import MobileBottomMenu from "@components/MobileBottomMenu";
import useResponsive from "@hooks/useResponsive";

function Home() {
  const { isMd } = useResponsive();

  return (
    <section
      className="relative mt-8 flex min-h-screen flex-col md:mt-7 lg:mt-12"
      data-testid="homepage"
    >
      <div className="flex flex-col md:flex-row w-full px-0 md:px-12 lg:px-[120px]">
        <div className="flex flex-col justify-between px-6 pb-7 md:px-0 md:pb-0 md:w-5/12 md:mr-8 lg:mr-[72px]">
          <WelcomeHeader />
          {isMd && <ProofOfAssetsCard />}
        </div>
        <div className="flex-1">
          <BridgeForm />
        </div>
      </div>
      <div className="md:hidden mt-6 mb-12 mx-6">
        <MobileBottomMenu />
      </div>
    </section>
  );
}

export default Home;
