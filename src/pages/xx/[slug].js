/* eslint-disable react/forbid-prop-types */
import React, { useState } from "react";
import PropTypes from "prop-types";
import { getInscription } from "@utils/inscriptions.server";
import ProductDetailsArea from "@containers/product-details";

const Inscription = ({ inscription, collection, e }) => {
    const [headerHeight, setHeaderHeight] = useState(148); // Optimistically
    const [nostrData, setNostrData] = useState();

    console.log({ inscription, collection, e });
    return (
        <main id="main-content" style={{ paddingTop: headerHeight }}>
            {inscription && <ProductDetailsArea inscription={inscription} collection={collection} nostr={nostrData} />}
        </main>
    );
};

export async function getServerSideProps({ params }) {
    try {
        const { inscription, collection = null } = await getInscription(params.slug);
        return { props: { inscription, collection, className: "template-color-1" } };
    } catch (e) {
        console.log(e);
        return { props: { inscription: null, collection: null, className: "template-color-1", e: e.message || "" } };
    }
}

Inscription.propTypes = {
    inscription: PropTypes.object,
    collection: PropTypes.object,
    e: PropTypes.string,
};

export default Inscription;
