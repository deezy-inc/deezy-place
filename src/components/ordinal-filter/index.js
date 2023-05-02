/* eslint-disable react/forbid-prop-types */
import { useState } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import { matchSorter } from "match-sorter";
import { TiArrowSortedDown, TiArrowSortedUp } from "react-icons/ti";
import { Form } from "react-bootstrap";

const OrdinalFilter = ({
    ownedUtxos,
    setFilteredOwnedUtxos,
    setActiveSort,
    setSortAsc,
    activeSort,
    sortAsc,
    hideText,
    setHideText,
}) => {
    const [searchQuery, setSearchQuery] = useState("");

    const onFilterByValue = () => {
        if (activeSort === "value") {
            setSortAsc(!sortAsc);
            return;
        }
        setActiveSort("value");
    };

    const onFilterByNum = () => {
        if (activeSort === "num") {
            setSortAsc(!sortAsc);
            return;
        }
        setActiveSort("num");
    };

    const onFilterByDate = () => {
        if (activeSort === "date") {
            setSortAsc(!sortAsc);
            return;
        }
        setActiveSort("date");
    };

    const onHideText = (event) => {
        setHideText(event.target.checked);
    };

    return (
        <div className="row">
            <div className="col-6">
                <input
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value);
                        const filteredUtxos = matchSorter(ownedUtxos, e.target.value, {
                            keys: [
                                "inscriptionId",
                                "key",
                                "txid",
                                "vout",
                                "value",
                                "num",
                                "status.block_time",
                                "status.block_height",
                                "status.confirmed",
                            ],
                        });
                        setFilteredOwnedUtxos(filteredUtxos);
                    }}
                />
            </div>
            <div className="col">
                <button
                    type="button"
                    className={clsx(
                        "sort-button d-flex flex-row justify-content-center",
                        activeSort === "date" && "active"
                    )}
                    onClick={onFilterByDate}
                >
                    <div>Date</div>
                    {activeSort === "date" && <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>}
                </button>
            </div>
            <div className="col">
                <button
                    type="button"
                    className={clsx(
                        "sort-button d-flex flex-row justify-content-center",
                        activeSort === "value" && "active"
                    )}
                    onClick={onFilterByValue}
                >
                    <div>Value</div>
                    {activeSort === "value" && <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>}
                </button>
            </div>
            <div className="col">
                <button
                    type="button"
                    className={clsx(
                        "sort-button d-flex flex-row justify-content-center",
                        activeSort === "num" && "active"
                    )}
                    onClick={onFilterByNum}
                >
                    <div>#</div>
                    {activeSort === "num" && <div>{sortAsc ? <TiArrowSortedUp /> : <TiArrowSortedDown />}</div>}
                </button>
            </div>
            <div className="col">
                <Form.Check
                    type="checkbox"
                    id="hide-text-inscriptions"
                    label="Hide .txt"
                    onChange={onHideText}
                    checked={hideText}
                />
            </div>
        </div>
    );
};

OrdinalFilter.propTypes = {
    ownedUtxos: PropTypes.array,
    setFilteredOwnedUtxos: PropTypes.func,
    setHideText: PropTypes.func,
    hideText: PropTypes.bool,
    setActiveSort: PropTypes.func,
    setSortAsc: PropTypes.func,
    activeSort: PropTypes.string,
    sortAsc: PropTypes.bool,
};

OrdinalFilter.defaultProps = {};

export default OrdinalFilter;
