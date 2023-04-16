/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { useRouter } from "next/router";

const Inscription = () => {
    const router = useRouter();
    const { slug } = router.query;

    const [headerHeight, setHeaderHeight] = useState(148); // Optimistically
    const elementRef = useRef(null);

    const [nostrAddress, setNostrAddress] = useState();
    const [ethProvider, setEthProvider] = useState();
    const { nostrPublicKey, onConnectHandler, onDisconnectHandler } = useConnectWallet();
    const [nostrData, setNostrData] = useState();
    const [inscription, setInscription] = useState();
    const [collection, setCollection] = useState();

    useEffect(() => {
        if (!slug) return;
        const fetchInscription = async () => {
            const { inscription: _inscription, collection: _collection } = await getInscription(slug);
            setInscription(_inscription);
            setCollection(_collection);
        };

        fetchInscription();
    }, [slug]);

    useEffect(() => {
        if (!nostrPublicKey) return;
        const { address } = getAddressInfo(nostrPublicKey);
        setNostrAddress(address);
    }, [nostrPublicKey]);

    useEffect(() => {
        if (!inscription?.inscriptionId) return;
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

Inscription.propTypes = {};

export default Inscription;
