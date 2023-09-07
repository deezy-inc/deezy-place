/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue */

import React, { useRef } from "react";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import NostrLiveAll from "@containers/NostrLiveAll";
import { WalletContext } from "@context/wallet-context";
import { useWalletState, useHeaderHeight, useDeezySockets } from "@hooks";
import useMarketplace from "src/hooks/use-marketplace";

export async function getStaticProps() {
  return { props: { className: "template-color-1" } };
}

const App = () => {
  const walletState = useWalletState();
  const elementRef = useRef(null);
  const headerHeight = useHeaderHeight(elementRef);

  const { openOrders, loading, sourse } = useMarketplace({ realtime: false });

  console.log({ openOrders: openOrders.length, loading, sourse });

  return (
    <WalletContext.Provider value={walletState}>
      <Wrapper>
        <SEO pageTitle="Deezy" />
        <Header ref={elementRef} />
        <main id="main-content" style={{ paddingTop: headerHeight }}>
          <NostrLiveAll openOrders={openOrders} loading={loading} />
        </main>

        <Footer />
      </Wrapper>
    </WalletContext.Provider>
  );
};

export default App;
