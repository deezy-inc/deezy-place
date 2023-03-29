/* eslint-disable react/forbid-prop-types */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-extra-boolean-cast */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
import { useContext } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import { toast } from "react-toastify";
import WalletContext from "@context/wallet-context";
import Image from "next/image";
import { shortenStr } from "@utils/crypto";
import { TiArrowSortedDown, TiArrowSortedUp } from "react-icons/ti";
import { useOrdinals } from "@hooks";
import InfiniteOrdinalsList from "@components/infinite-ordinal-list";

const OrdinalsArea = ({ className, space }) => {
    const { nostrAddress } = useContext(WalletContext);
    const {
        filteredOrdinals,
        isLoading,
        loadMore,
        canLoadMore,
        setKeyword,
        keyword,
        activeSort,
        setActiveSort,
        sortAsc,
        setSortAsc,
        total,
        refetchOrdinals,
        debouncedKeyword,
    } = useOrdinals({
        nostrAddress,
    });

    const handleRefreshHack = () => {
        refetchOrdinals();
    };

    const onFilterByValue = () => {
        if (activeSort === "value") {
            setSortAsc(!sortAsc);
            return;
        }
        setActiveSort("value");
    };
    const onFilterByDate = () => {
        if (activeSort === "date") {
            setSortAsc(!sortAsc);
            return;
        }
        setActiveSort("date");
    };
    const onSearchByKeyword = (event) => {
        setKeyword(event.target.value);
    };

    const onCopyAddress = () => {
        navigator.clipboard.writeText(nostrAddress);
        toast("Receive Address copied to clipboard!");
    };

    const counter = total !== 0 ? ` ${filteredOrdinals.length}/${total}` : "";
    const isFiltering = Boolean(debouncedKeyword);

    return (
        <div id="your-collection" className={clsx("rn-product-area", space === 1 && "rn-section-gapTop", className)}>
            <div className="container">
                <div className="row mb--50 align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        <SectionTitle className="mb--0" {...{ title: `Your collection`, counter }} />
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
                    <div className="col-lg-4 col-md-4 col-sm-4 col-8">
                        <input placeholder="Search" value={keyword} onChange={onSearchByKeyword} />
                    </div>
                    <div className="col-lg-1 col-md-1 col-sm-1 col-2">
                        <button
                            type="button"
                            className={clsx(
                                "sort-button d-flex flex-row justify-content-center",
                                activeSort === "date" && "active"
                            )}
                            onClick={onFilterByDate}
                        >
                            <div>Date</div>
                            {activeSort === "date" && (
                                <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>
                            )}
                        </button>
                    </div>
                    <div className="col-lg-1 col-md-1 col-sm-1 col-2">
                        <button
                            type="button"
                            className={clsx(
                                "sort-button d-flex flex-row justify-content-center",
                                activeSort === "value" && "active"
                            )}
                            onClick={onFilterByValue}
                        >
                            <div>Value</div>
                            {activeSort === "value" && (
                                <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>
                            )}
                        </button>
                    </div>
                </div>

                <div className="row g-5">
                    <InfiniteOrdinalsList
                        isFiltering={isFiltering}
                        isLoading={isLoading}
                        items={filteredOrdinals}
                        canLoadMore={canLoadMore}
                        next={loadMore}
                        onSale={handleRefreshHack}
                    />
                    {!isLoading && filteredOrdinals.length === 0 && (
                        <div>
                            {total === filteredOrdinals.length
                                ? "This address does not own anything yet..."
                                : "No results found..."}
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
