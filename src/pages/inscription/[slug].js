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
import { getInscription as getNostrInscription } from "@utils/nostr";

const Inscription = ({ inscription, collection, e }) => {
    const [headerHeight, setHeaderHeight] = useState(148); // Optimistically
    const elementRef = useRef(null);

    const [nostrAddress, setNostrAddress] = useState();
    const [ethProvider, setEthProvider] = useState();
    const { nostrPublicKey, onConnectHandler, onDisconnectHandler } = useConnectWallet();
    const [nostrData, setNostrData] = useState();
    // const [inscription, setInscription] = useState();
    // const [collection, setCollection] = useState();

    useEffect(() => {
        if (!nostrPublicKey) return;
        const { address } = getAddressInfo(nostrPublicKey);
        setNostrAddress(address);
    }, [nostrPublicKey]);

    useEffect(() => {
        getNostrInscription(inscription.inscriptionId, (error, data) => {
            // object exists in nostr
            if (data) {
                console.log("sccess getting data", data);
                setNostrData(data);
            }

            if (error) {
                console.error("failed to get inscription from nostr", error);
            }
        });
    }, [inscription?.inscriptionId]);

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

    if (e) {
        return <h1>{e}</h1>;
    }

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
                    {inscription && (
                        <ProductDetailsArea inscription={inscription} collection={collection} nostr={nostrData} />
                    )}
                </main>

                <Footer />
            </Wrapper>
        </WalletContext.Provider>
    );
};

export async function getServerSideProps({ params }) {
    try {
        const { inscription, collection = null } = await getInscription(params.slug);
        return { props: { inscription, collection, className: "template-color-1" } };
    } catch (e) {
        console.log(e);
        return { props: { inscription: null, collection: null, className: "template-color-1", e: e.message } };
    }
}

Inscription.propTypes = {
    // inscriptionId: PropTypes.string,
    inscription: PropTypes.object,
    collection: PropTypes.object,
    e: PropTypes.object,
};

export default Inscription;
