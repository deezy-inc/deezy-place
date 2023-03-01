/* eslint-disable react/forbid-prop-types */
import { useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { TailSpin } from "react-loading-icons";
import SectionTitle from "@components/section-title";
import OrdinalCard from "@components/ordinal-card";
import { toast } from "react-toastify";
import { ordinalsImageUrl, cloudfrontUrl } from "@utils/crypto";
import nostrRelay, { RELAY_KINDS } from "@services/nostr-relay";
import { getInscriptionDataById } from "@utils/openOrdex";
import { main } from "@utils/openOrdexV2";

// Use this to fetch data from an API service
const axios = require("axios");

const collectionAuthor = [
    {
        name: "Danny Deezy",
        slug: "/deezy",
        image: {
            src: "/images/logo/nos-ft-logo.png",
        },
    },
];

const OnSaleOrdinalsArea = ({ className, space }) => {
    const [openOrders, setOpenOrders] = useState([]);
    const [isLoadingOpenOrders, setIsLoadingOpenOrders] = useState(true);

    useEffect(() => {
        console.log("useEffect called");
        const load = async () => {
            setIsLoadingOpenOrders(true);
            const orders = await main();

            for (const inscription of orders?.latestOrders) {
                let inscriptionData = inscription.tags
                    // .filter(([t, v]) => t === "i" && v)
                    .map(([tagId, inscriptionId, signedPsbt]) => ({
                        [tagId]: {
                            inscriptionId,
                            signedPsbt,
                        },
                    }));
                // Convert array into object of key tagId
                inscriptionData = Object.assign(
                    {},
                    ...inscriptionData.map((o) => o)
                );

                // const { inscriptionId, signedPsbt } = inscriptionData.i;
                // const data = await getInscriptionDataById(inscriptionId);
                // console.log(data);
                // const txResp = await axios.get(
                //     `https://mempool.space/api/tx/${data["genesis transaction"]}`
                // );
                // const utxo = txResp.data;

                // tempInscriptionsByUtxo[`${utxo.txid}:${utxo.vout}`] = utxo;
                // setInscriptionUtxosByUtxo(tempInscriptionsByUtxo);

                // utxo.value = data["output value"]; // TODO: @danny why I am not getting the value from the API?

                console.log(inscriptionData);
                setOpenOrders([...openOrders, inscriptionData]);
            }

            setIsLoadingOpenOrders(false);
        };
        load();
    }, []);

    const getSrc = (utxo) => {
        if (utxo.status.confirmed) {
            return ordinalsImageUrl(
                inscriptionUtxosByUtxo[`${utxo.txid}:${utxo.vout}`]
            );
        }
        return cloudfrontUrl(utxo);
    };

    return (
        <div
            id="selling-collection"
            className={clsx(
                "rn-product-area",
                space === 1 && "rn-section-gapTop",
                className
            )}
        >
            <div className="container">
                <div className="row mb--50 align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        <SectionTitle
                            className="mb--0"
                            {...{ title: "On sale" }}
                        />
                    </div>
                </div>

                {isLoadingOpenOrders && (
                    <TailSpin stroke="#fec823" speed={0.75} />
                )}

                {!isLoadingOpenOrders && (
                    <div className="row g-5">
                        {openOrders.length > 0 ? (
                            <>
                                {openOrders.map((utxo) => (
                                    <div
                                        key={utxo.txid}
                                        className="col-5 col-lg-4 col-md-6 col-sm-6 col-12"
                                    >
                                        {/* <OrdinalCard
                                            overlay
                                            slug={utxo.txid}
                                            minted={utxo.status.confirmed}
                                            price={{
                                                amount: utxo.value.toLocaleString(
                                                    "en-US"
                                                ),
                                                currency: "Sats",
                                            }}
                                            image={{
                                                src: getSrc(utxo),
                                            }}
                                            authors={collectionAuthor}
                                            utxo={utxo}
                                        /> */}
                                    </div>
                                ))}
                            </>
                        ) : (
                            <div>There are no inscriptions for sale yet..</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

OnSaleOrdinalsArea.propTypes = {
    className: PropTypes.string,
    space: PropTypes.oneOf([1, 2]),
};

OnSaleOrdinalsArea.defaultProps = {
    space: 1,
};

export default OnSaleOrdinalsArea;
