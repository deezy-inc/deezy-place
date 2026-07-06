import React, { useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import HeroArea from "@containers/HeroArea";
import { normalizedData } from "@utils/methods";
import homepageData from "@data/general/home.json";
import { useWalletState, useHeaderHeight } from "@hooks";
import { WalletContext } from "@context/wallet-context";

const App = () => {
  const walletState = useWalletState();
  const { ordinalsPublicKey, nostrOrdinalsAddress } = walletState;
  const elementRef = useRef(null);
  const headerHeight = useHeaderHeight(elementRef);
  const router = useRouter();

  useEffect(() => {
    if (ordinalsPublicKey && nostrOrdinalsAddress) {
      router.replace("/wallet");
    }
  }, [ordinalsPublicKey, nostrOrdinalsAddress, router]);

  const content = normalizedData(homepageData?.content || []);

  const userLoggedIn = ordinalsPublicKey && nostrOrdinalsAddress;

  if (userLoggedIn) {
    // Optionally, render nothing while redirecting
    return null;
  }

  return (
    <WalletContext.Provider value={walletState}>
      <Wrapper>
        <SEO pageTitle="Deezy" />
        <Header ref={elementRef} />
        <main id="main-content" style={{ paddingTop: headerHeight }}>
          <HeroArea data={content["hero-section"]} />
        </main>
        <Footer />
      </Wrapper>
    </WalletContext.Provider>
  );
};

export default App;
