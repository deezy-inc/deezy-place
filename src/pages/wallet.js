/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue */

import React, { useRef } from "react";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";

import { useWalletState, useHeaderHeight } from "@hooks";
import { WalletContext } from "@context/wallet-context";
import WalletArea from "@containers/WalletArea";

export async function getStaticProps() {
  return { props: { className: "template-color-1" } };
}

const App = () => {
  const walletState = useWalletState();
  const { ordinalsPublicKey, nostrOrdinalsAddress } = walletState;
  const elementRef = useRef(null);
  const headerHeight = useHeaderHeight(elementRef);
  return (
    <WalletContext.Provider value={walletState}>
      <Wrapper>
        <SEO pageTitle="Deezy" />
        <Header ref={elementRef} />
        <main id="main-content" style={{ paddingTop: headerHeight }}>
          {ordinalsPublicKey && nostrOrdinalsAddress ? (
            <WalletArea />
          ) : (
            <>Please connect your wallet.</>
          )}
        </main>
        <Footer />
      </Wrapper>
    </WalletContext.Provider>
  );
};

export default App;
