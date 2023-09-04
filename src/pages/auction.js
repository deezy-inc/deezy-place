/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue */

import React, { useRef } from "react";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import NostrLiveAll from "@containers/NostrLiveAll";
import { WalletContext } from "@context/wallet-context";
import { useWalletState, useHeaderHeight, useLiveAuctions } from "@hooks";

export async function getStaticProps() {
  return { props: { className: "template-color-1" } };
}

const App = () => {
  const walletState = useWalletState();
  const elementRef = useRef(null);
  const headerHeight = useHeaderHeight(elementRef);

  const { auctions: openOrders, loading } = useLiveAuctions();

  return (
    <WalletContext.Provider value={walletState}>
      <Wrapper>
        <SEO pageTitle="Deezy" />
        <Header ref={elementRef} />
        <main id="main-content" style={{ paddingTop: headerHeight }}>
          <NostrLiveAll
            type="bidding"
            openOrders={openOrders}
            loading={loading}
          />
        </main>

        <Footer />
      </Wrapper>
    </WalletContext.Provider>
  );
};

export default App;
