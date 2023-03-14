/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
import { useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import OrdinalCard from "@components/ordinal-card";
import { toast } from "react-toastify";
import WalletContext from "@context/wallet-context";
import Image from "next/image";
import { shortenStr } from "@utils/crypto";
import { getAddressUtxos } from "@utils/utxos";
import axios from "axios";

const collectionAuthor = [
    {
        name: "Danny Deezy",
        slug: "/deezy",
        image: {
            src: "/images/logo/nos-ft-logo.png",
        },
    },
];

const getOwnedInscriptions = async (nostrAddress) => {
    const utxos = await getAddressUtxos(nostrAddress);
    const sortedData = utxos.sort((a, b) => b.status.block_time - a.status.block_time);
    const inscriptions = sortedData.map((utxo) => ({ ...utxo, key: `${utxo.txid}i${utxo.vout}` }));
    return inscriptions;
};

const OrdinalsArea = ({ className, space }) => {
    const { nostrAddress } = useContext(WalletContext);
    const [utxosReady, setUtxosReady] = useState(false);
    const [ownedUtxos, setOwnedUtxos] = useState([]);
    const [refreshHack, setRefreshHack] = useState(false);

    const handleRefreshHack = () => {
        setRefreshHack(!refreshHack);
    };

    useEffect(() => {
        const getInscriptions = async () => {
            setUtxosReady(false);
            const { data } = await axios.get(`https://turbo.ordinalswallet.com/wallet/${nostrAddress}/inscriptions`);
            const utxos = await getOwnedInscriptions(nostrAddress);
            const matchedUtxos = utxos
                .map((utxo) => {
                    const ins = data.find((x) => x.id === utxo.key);
                    if (ins) {
                        return {
                            ...utxo,
                            inscriptionId: ins.id,
                            ...ins,
                        };
                    }
                    return undefined;
                })
                .filter((x) => x);
            setOwnedUtxos(matchedUtxos);
            setUtxosReady(true);
        };
        getInscriptions();
    }, [refreshHack, nostrAddress]);

    return (
        <div id="your-collection" className={clsx("rn-product-area", space === 1 && "rn-section-gapTop", className)}>
            <div className="container">
                <div className="row mb--50 align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        <SectionTitle className="mb--0" {...{ title: "Your collection" }} isLoading={!utxosReady} />
                        <br />
                        <span>
                            <Image
                                src="/images/logo/ordinals-white.svg"
                                alt="Ordinal"
                                width={15}
                                height={15}
                                className="mb-1"
                                priority
                            />
                            <button
                                type="button"
                                className="btn-transparent"
                                onClick={() => {
                                    navigator.clipboard.writeText(nostrAddress);
                                    toast("Receive Address copied to clipboard!");
                                }}
                            >
                                {" "}
                                {shortenStr(nostrAddress)}
                            </button>
                        </span>
                    </div>
                </div>

                <div className="row g-5">
                    {utxosReady && ownedUtxos.length > 0 && (
                        <>
                            {ownedUtxos.map((inscription) => (
                                <div key={inscription.txid} className="col-5 col-lg-4 col-md-6 col-sm-6 col-12">
                                    <OrdinalCard
                                        overlay
                                        price={{
                                            amount: inscription.value.toLocaleString("en-US"),
                                            currency: "Sats",
                                        }}
                                        type="send"
                                        confirmed={inscription.status.confirmed}
                                        date={inscription.status.block_time}
                                        authors={collectionAuthor}
                                        utxo={inscription}
                                        onSale={handleRefreshHack}
                                    />
                                </div>
                            ))}
                        </>
                    )}

                    {utxosReady && ownedUtxos.length === 0 && (
                        <div>
                            This address does not own anything yet..
                            <br />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

OrdinalsArea.propTypes = {
    className: PropTypes.string,
    space: PropTypes.oneOf([1, 2]),
    onSale: PropTypes.func,
};

OrdinalsArea.defaultProps = {
    space: 1,
};

export default OrdinalsArea;
