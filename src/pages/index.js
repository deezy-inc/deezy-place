import React, { useRef, useEffect } from "react";
import { useRouter } from "next/router";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import HeroArea from "@containers/HeroArea";
import OrdinalsArea from "@containers/OrdinalsArea";
import { normalizedData } from "@utils/methods";
import homepageData from "@data/general/home.json";
import NostrLive from "@containers/NostrLive";
import MainCollections from "@containers/MainCollections";
import { useWalletState, useHeaderHeight, useHome } from "@hooks";
import { WalletContext } from "@context/wallet-context";

export async function getStaticProps() {
  return { props: { className: "template-color-1" } };
}

const App = () => {
  const walletState = useWalletState();
  const { ordinalsPublicKey, nostrOrdinalsAddress } = walletState;
  const elementRef = useRef(null);
  const headerHeight = useHeaderHeight(elementRef);
  const { sourse, sales, auctions, loading } = useHome({ realtime: true });
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
          {/* <MainCollections />
          <NostrLive type="bidding" openOffers={auctions} loading={loading} />
          <NostrLive openOffers={sales} loading={loading} /> */}
        </main>
        <Footer />
      </Wrapper>
    </WalletContext.Provider>
  );
};

export default App;
