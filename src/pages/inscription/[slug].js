/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import React, { useState, useEffect, useRef } from "react";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import { getInscription, getNostrInscription, getAuctionByInscription } from "@services/nosft";
import ProductDetailsArea from "@containers/product-details";
import { useRouter } from "next/router";
import { WalletContext } from "@context/wallet-context";
import { useWalletState, useHeaderHeight } from "@hooks";

const Inscription = () => {
    const walletState = useWalletState();
    const router = useRouter();
    const { slug } = router.query;

    const elementRef = useRef(null);
    const headerHeight = useHeaderHeight(elementRef);

    const [nostrData, setNostrData] = useState();
    const [auctionData, setAuctionData] = useState();
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
        if (!inscription?.inscriptionId) return;
        const fetchNostrInscription = async () => {
            const auctions = await getAuctionByInscription(inscription?.inscriptionId);
            const auction = auctions?.find((a) => a.status === "RUNNING");

            if (auction) {
                setAuctionData(auction);
            }

            // TODO: if the item is on auction, let's get the auction data by the even, not the inscriptionId
            const data = await getNostrInscription(`${inscription.txid}:${inscription.vout}`);
            if (data) {
                // If exists in nostr, it might be in auction
                setNostrData(data);
            }
        };

        fetchNostrInscription();
    }, [inscription?.inscriptionId]);

    return (
        <WalletContext.Provider value={walletState}>
            <Wrapper>
                <SEO pageTitle="Inscription details" />
                <Header ref={elementRef} />
                <main id="main-content" style={{ paddingTop: headerHeight }}>
                    {inscription && (
                        <ProductDetailsArea
                            inscription={inscription}
                            collection={collection}
                            nostr={nostrData}
                            auction={auctionData}
                        />
                    )}
                </main>

                <Footer />
            </Wrapper>
        </WalletContext.Provider>
    );
};

Inscription.propTypes = {};

export default Inscription;
