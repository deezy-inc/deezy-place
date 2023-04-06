/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import React, { useState, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import { getQueryStringParam } from "@utils/methods";
import { getAddressInfo } from "@utils/crypto";
import { getOutpointFromCache } from "@utils/inscriptions";
import { useConnectWallet } from "@hooks";
import WalletContext from "@context/wallet-context";
import axios from "axios";
import { TURBO_API, MEMPOOL_API_URL } from "@lib/constants";
import ProductDetailsArea from "@containers/product-details";

const Inscription = ({ inscription, collection }) => {
    const [isExperimental, setIsExperimental] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(148); // Optimistically
    const elementRef = useRef(null);

    const [nostrAddress, setNostrAddress] = useState();
    const [ethProvider, setEthProvider] = useState();
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

    useEffect(() => {
        if (typeof window === "undefined") return;
        if (!window.ethereum) return;
        const provider = window.ethereum;
        setEthProvider(provider);
    }, []);

    const obj = useMemo(
        () => ({
            nostrPublicKey,
            nostrAddress,
            isExperimental,
            ethProvider,
        }),
        [nostrPublicKey, nostrAddress, isExperimental, ethProvider]
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
    const props = {};

    const { data: inscription } = await axios.get(`${TURBO_API}/inscription/${params.slug}`);
    const outpoint = await getOutpointFromCache(params.slug);
    const rawVout = outpoint.slice(-8);
    const txid = outpoint
        .substring(0, outpoint.length - 8)
        .match(/[a-fA-F0-9]{2}/g)
        .reverse()
        .join("");

    const buf = new ArrayBuffer(4);
    const view = new DataView(buf);
    rawVout.match(/../g)?.forEach((b, i) => {
        view.setUint8(i, parseInt(b, 16));
    });

    const vout = view.getInt32(0, 1);

    const { data: utxo } = await axios.get(`${MEMPOOL_API_URL}/api/tx/${txid}`);

    if (inscription?.collection?.name) {
        try {
            const { data: collection } = await axios.get(`${TURBO_API}/collection/${inscription?.collection?.slug}`);
            props.collection = collection;
        } catch (e) {
            console.warn("No collection found");
        }
    }

    // TODO: @HABIBI - remove hardcoded value
    props.inscription = { ...inscription, inscriptionId: inscription.id, ...utxo, vout, value: 1000 };
    props.className = "template-color-1";

    return { props };
}

Inscription.propTypes = {
    inscription: PropTypes.any,
    collection: PropTypes.any,
};

export default Inscription;
