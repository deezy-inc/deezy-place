/* eslint-disable react/forbid-prop-types */
import OrdinalCard from "@components/ordinal-card";
import useInfiniteScroll from "react-easy-infinite-scroll-hook";
import { TailSpin } from "react-loading-icons";
import PropTypes from "prop-types";

const collectionAuthor = [
    {
        name: "Danny Deezy",
        slug: "/deezy",
        image: {
            src: "/images/logo/nos-ft-logo.png",
        },
    },
];

const InfiniteOrdinalsList = ({ isLoading, items, canLoadMore, next, onSale }) => {
    const ref = useInfiniteScroll({
        windowScroll: true,
        next,
        rowCount: items.length,
        hasMore: { down: canLoadMore },
    });

    return (
        <div className="row g-5" ref={ref}>
            {items.map((inscription) => (
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
                        onSale={onSale}
                    />
                </div>
            ))}
            {isLoading && (
                <div className="ordinal-loader">
                    <TailSpin stroke="#fec823" speed={0.75} />
                </div>
            )}
        </div>
    );
};

InfiniteOrdinalsList.propTypes = {
    isLoading: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.object),
    canLoadMore: PropTypes.bool,
    next: PropTypes.func,
    onSale: PropTypes.func,
};

export default InfiniteOrdinalsList;
