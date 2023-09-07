/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue */

import React, { useRef } from "react";
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
  const { sales, auctions, loading, sourse } = useHome({ realtime: true });

  //   TODO: remove
  //     console.log(
  //       sourse,
  //       "sales",
  //       sales.length,
  //       "auctions",
  //       auctions,
  //       auctions.length,
  //       loading,
  //     );

  const content = normalizedData(homepageData?.content || []);

  const userLoggedIn = ordinalsPublicKey && nostrOrdinalsAddress;

  return (
    <WalletContext.Provider value={walletState}>
      <Wrapper>
        <SEO pageTitle="Deezy" />

        <Header ref={elementRef} />
        <main id="main-content" style={{ paddingTop: headerHeight }}>
          {!userLoggedIn && <HeroArea data={content["hero-section"]} />}
          <>
            <MainCollections />
            <NostrLive type="bidding" openOffers={auctions} loading={loading} />
            <NostrLive openOffers={sales} loading={loading} />
            {userLoggedIn && <OrdinalsArea />}
          </>
        </main>

        <Footer />
      </Wrapper>
    </WalletContext.Provider>
  );
};

export default App;
