/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-extra-boolean-cast */
import { useContext, useState, useMemo, useEffect } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import OrdinalCard from "@components/ordinal-card";
import { toast } from "react-toastify";
import WalletContext from "@context/wallet-context";
import Image from "next/image";
import { shortenStr } from "@utils/crypto";
import { getInscriptions } from "@utils/inscriptions";
import OrdinalFilter from "@components/ordinal-filter";
import { collectionAuthor, applyFilters } from "@containers/helpers";

const OrdinalsArea = ({ className, space }) => {
    const { nostrAddress } = useContext(WalletContext);

    const [utxosReady, setUtxosReady] = useState(false);
    const [ownedUtxos, setOwnedUtxos] = useState([]);
    const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);
    const [refreshHack, setRefreshHack] = useState(false);

    const [activeSort, setActiveSort] = useState("date");
    const [sortAsc, setSortAsc] = useState(false);
    const [hideText, setHideText] = useState(true);

    const handleRefreshHack = () => {
        setRefreshHack(!refreshHack);
    };

    const onCopyAddress = () => {
        navigator.clipboard.writeText(nostrAddress);
        toast("Receive Address copied to clipboard!");
    };

    useMemo(() => {
        const filteredUtxos = applyFilters({
            utxos: filteredOwnedUtxos,
            activeSort,
            sortAsc,
        });
        setFilteredOwnedUtxos(filteredUtxos);
    }, [filteredOwnedUtxos, activeSort, sortAsc]);

    useEffect(() => {
        const loadUtxos = async () => {
            setUtxosReady(false);

            const utxosWithInscriptionData = await getInscriptions(nostrAddress);

            setOwnedUtxos(utxosWithInscriptionData);
            setFilteredOwnedUtxos(utxosWithInscriptionData);
            setUtxosReady(true);
        };

        loadUtxos();
    }, [refreshHack, nostrAddress]);

    return (
        <div id="your-collection" className={clsx("rn-product-area", space === 1 && "rn-section-gapTop", className)}>
            <div className="container">
                <div className="row mb--50 align-items-center">
                    <div className="col-lg-4 col-md-6 col-sm-6 col-12">
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
                            <button type="button" className="btn-transparent" onClick={onCopyAddress}>
                                {" "}
                                {shortenStr(nostrAddress)}
                            </button>
                        </span>
                    </div>
                    <div className="col-lg-8 col-md-6 col-sm-6 col-6">
                        <OrdinalFilter
                            ownedUtxos={ownedUtxos}
                            setFilteredOwnedUtxos={setFilteredOwnedUtxos}
                            setActiveSort={setActiveSort}
                            setSortAsc={setSortAsc}
                            activeSort={activeSort}
                            sortAsc={sortAsc}
                            hideText={hideText}
                            setHideText={setHideText}
                        />
                    </div>
                </div>

                <div className="row g-5">
                    {utxosReady && ownedUtxos.length > 0 && (
                        <>
                            {filteredOwnedUtxos.map((inscription) => (
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
                            {filteredOwnedUtxos.length === 0 && (
                                <div className="col-12">
                                    <div className="text-center">
                                        <h3>No results found</h3>
                                    </div>
                                </div>
                            )}
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
