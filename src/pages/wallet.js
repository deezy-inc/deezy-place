/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue */

import React, { useState, useEffect, useRef } from "react";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import NostrLiveAll from "@containers/NostrLiveAll";
import { WalletContext } from "@context/wallet-context";
import { useWalletState, useHeaderHeight } from "@hooks";
import OrdinalsArea from "@containers/OrdinalsArea";
import Wallet from "@containers/Wallet";
import HeroArea from "@containers/HeroArea";
import homepageData from "@data/general/home.json";
import { normalizedData } from "@utils/methods";

export async function getStaticProps() {
    return { props: { className: "template-color-1" } };
}

const App = () => {
    const walletState = useWalletState();
    const elementRef = useRef(null);
    const headerHeight = useHeaderHeight(elementRef);

    const { nostrPublicKey, nostrAddress } = walletState;
    const content = normalizedData(homepageData?.content || []);

    return (
        <WalletContext.Provider value={walletState}>
            <Wrapper>
                <SEO pageTitle="Deezy" />
                <Header ref={elementRef} />
                <main id="main-content" style={{ paddingTop: headerHeight }}>
                    {!nostrPublicKey && <HeroArea data={content["hero-section"]} />}

                    {nostrPublicKey && nostrAddress && <Wallet />}
                    {nostrPublicKey && nostrAddress && <OrdinalsArea displayOnlyInscriptions hideAddress />}
                    {nostrPublicKey && nostrAddress && <NostrLiveAll type="my-bidding" address={nostrAddress} />}
                </main>

                <Footer />
            </Wrapper>
        </WalletContext.Provider>
    );
};

export default App;
