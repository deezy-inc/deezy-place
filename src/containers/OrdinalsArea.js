import { useReducer, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import OrdinalCard from "@components/ordinal-card";

import { SectionTitleType, OrdinalType } from "@utils/types";

function reducer(state, action) {
    switch (action.type) {
        case "FILTER_TOGGLE":
            return { ...state, filterToggle: !state.filterToggle };
        case "SET_INPUTS":
            return { ...state, inputs: { ...state.inputs, ...action.payload } };
        case "SET_PRODUCTS":
            return { ...state, products: action.payload };
        default:
            return state;
    }
}

const OrdinalsArea = ({ className, space, data }) => {
    const [state, dispatch] = useReducer(reducer, {
        products: data.products || [],
        inputs: { price: [0, 100] },
    });

    return (
        <div
            className={clsx(
                "rn-product-area",
                space === 1 && "rn-section-gapTop",
                className
            )}
        >
            <div className="container">
                <div className="row mb--50 align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        {data?.section_title && (
                            <SectionTitle
                                className="mb--0"
                                {...data.section_title}
                            />
                        )}
                    </div>
                </div>

                <div className="row g-5">
                    {state.products.length > 0 ? (
                        <>
                            {state.products.slice(0, 10).map((prod) => (
                                <div
                                    key={prod.id}
                                    className="col-5 col-lg-4 col-md-6 col-sm-6 col-12"
                                >
                                    <OrdinalCard
                                        overlay
                                        title={prod.title}
                                        slug={prod.slug}
                                        description={prod.description}
                                        price={prod.price}
                                        likeCount={prod.likeCount}
                                        image={prod.images?.[0]}
                                        authors={prod.authors}
                                        utxo={prod.utxo}
                                    />
                                </div>
                            ))}
                        </>
                    ) : (
                        <p>No item to show</p>
                    )}
                </div>
            </div>
        </div>
    );
};

OrdinalsArea.propTypes = {
    className: PropTypes.string,
    space: PropTypes.oneOf([1, 2]),
    data: PropTypes.shape({
        section_title: SectionTitleType,
        products: PropTypes.arrayOf(OrdinalType),
    }),
};

OrdinalsArea.defaultProps = {
    space: 1,
};

export default OrdinalsArea;
