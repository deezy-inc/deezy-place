import { useState, useEffect, useMemo, useRef } from "react";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import HeroArea from "@containers/HeroArea";
import OrdinalsArea from "@containers/OrdinalsArea";
import { getQueryStringParam } from "@utils/methods";
import { getAddressInfo } from "@utils/crypto";
import { useConnectWallet } from "@hooks";
import WalletContext from "@context/wallet-context";

export async function getStaticProps() {
    return { props: { className: "template-color-1" } };
}

const App = () => {
    const [isExperimental, setIsExperimental] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(148);
    const elementRef = useRef(null);

    const [nostrAddress, setNostrAddress] = useState<String>();
    const { nostrPublicKey, onConnectHandler, onDisconnectHandler } = useConnectWallet();

    useEffect(() => {
        const exp = getQueryStringParam("__mode");
        if (exp === "astral") {
            setIsExperimental(true);
        }
        if (elementRef.current) {
            setHeaderHeight(elementRef.current.clientHeight);
        }
    }, []);

    useEffect(() => {
        if (!nostrPublicKey) return;
        const { address } = getAddressInfo(nostrPublicKey);
        setNostrAddress(address);
    }, [nostrPublicKey]);


    const obj = useMemo(
        () => ({
            nostrPublicKey,
            nostrAddress,
            isExperimental,
        }),
        [nostrPublicKey, nostrAddress, isExperimental]
    );

    return (
        <WalletContext.Provider value={obj}>
            <Wrapper>
                <SEO pageTitle="Deezy" />
                <Header
                    ref={elementRef}
                    onConnectHandler={onConnectHandler}
                    onDisconnectHandler={onDisconnectHandler}
                />
                <main id="main-content" style={{ paddingTop: headerHeight }}>
                    {!nostrPublicKey && <HeroArea onConnectHandler={onConnectHandler} />}
                    {nostrPublicKey && nostrAddress && <OrdinalsArea />}
                </main>
                <Footer />
            </Wrapper>
        </WalletContext.Provider>
    );
};

export default App;
