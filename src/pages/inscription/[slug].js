/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import React, { useState, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import { getAddressInfo } from "@utils/crypto";
import { useConnectWallet } from "@hooks";
import WalletContext from "@context/wallet-context";
import { getInscription } from "@utils/inscriptions";
import ProductDetailsArea from "@containers/product-details";
import { useRouter } from "next/router";

const Inscription = ({ inscription, collection }) => {
    const [headerHeight, setHeaderHeight] = useState(148); // Optimistically
    const elementRef = useRef(null);

    const [nostrAddress, setNostrAddress] = useState();
    const [ethProvider, setEthProvider] = useState();
    const { nostrPublicKey, onConnectHandler, onDisconnectHandler } = useConnectWallet();
    // const [inscription, setInscription] = useState();
    // const [collection, setCollection] = useState();

    useEffect(() => {
        if (!nostrPublicKey) return;
        const { address } = getAddressInfo(nostrPublicKey);
        setNostrAddress(address);
    }, [nostrPublicKey]);

    useEffect(() => {
        const fetchInscription = async () => {
            // const { inscription: _inscription, collection: _collection } = await getInscription(inscriptionId);
            // setInscription(_inscription);
            // setCollection(_collection);
        };

        if (elementRef.current) {
            setHeaderHeight(elementRef.current.clientHeight);
        }

        if (typeof window === "undefined") return;
        if (!window.ethereum) return;
        const provider = window.ethereum;
        setEthProvider(provider);

        fetchInscription();
    }, []);

    const obj = useMemo(
        () => ({
            nostrPublicKey,
            nostrAddress,
            ethProvider,
        }),
        [nostrPublicKey, nostrAddress, ethProvider]
    );

    return (
        <WalletContext.Provider value={obj}>
            <Wrapper>
                <SEO pageTitle="Inscription details" />
                <Header
                    ref={elementRef}
                    nostrPublicKey={nostrPublicKey}
                    ethProvider={ethProvider}
                    onConnectHandler={onConnectHandler}
                    onDisconnectHandler={onDisconnectHandler}
                    address={nostrAddress}
                />
                <main id="main-content" style={{ paddingTop: headerHeight }}>
                    {inscription && <ProductDetailsArea inscription={inscription} collection={collection} />}
                </main>

                <Footer />
            </Wrapper>
        </WalletContext.Provider>
    );
};

export async function getServerSideProps({ params }) {
    const { inscription, collection } = await getInscription(params.slug);

    return { props: { inscription, collection, className: "template-color-1" } };
    // return { props: { inscriptionId: params.slug, className: "template-color-1" } };
}

Inscription.propTypes = {
    // inscriptionId: PropTypes.string,
    inscription: PropTypes.object,
    collection: PropTypes.object,
};

export default Inscription;
