/* eslint-disable react/forbid-prop-types */
import React from "react";
import PropTypes from "prop-types";
import { getInscription } from "@utils/inscriptions";

const Inscription = ({ inscription, collection, e }) => {
    console.log({ inscription, collection, e });
    return (
        <>
            <h1>Hello, Inscription!</h1>
            <pre>{JSON.stringify(inscription, null, 2)}</pre>
        </>
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
