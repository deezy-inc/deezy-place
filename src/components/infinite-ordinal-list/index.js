/* eslint-disable react/forbid-prop-types */
import OrdinalCard from "@components/ordinal-card";
import { TailSpin } from "react-loading-icons";
import PropTypes from "prop-types";
import useInfiniteScroll from "src/hooks/use-infinite-scroll";

const collectionAuthor = [
    {
        name: "Danny Deezy",
        slug: "/deezy",
        image: {
            src: "/images/logo/nos-ft-logo.png",
        },
    },
];

const InfiniteOrdinalsList = ({ isLoading, isFiltering, items, canLoadMore, next, onSale }) => {
    const [sentryRef] = useInfiniteScroll({
        loading: isLoading,
        onLoadMore: next,
        hasNextPage: canLoadMore && !isFiltering,
        rootMargin: `0px 0px 0px 0px`,
    });
    return (
        <div className="row g-5">
            {items.map((inscription) => (
                <div key={inscription.inscriptionId} className="col-5 col-lg-4 col-md-6 col-sm-6 col-12">
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
                    <br />
                </div>
            ))}
            <div ref={sentryRef} />
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
    isFiltering: PropTypes.bool,
    items: PropTypes.arrayOf(PropTypes.object),
    canLoadMore: PropTypes.bool,
    next: PropTypes.func,
    onSale: PropTypes.func,
};

export default InfiniteOrdinalsList;
