/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import SEO from "@components/seo";
import Footer from "@layout/footer";
import Wrapper from "@layout/wrapper";
import React, { useMemo } from "react";
import PropTypes from "prop-types";

const Inscription = ({ inscription, collection, e }) => {
    const obj = useMemo(() => ({}), []);

    if (e) {
        return <h1>{e}</h1>;
    }

    return (
        <Wrapper>
            <SEO pageTitle="Inscription details" />
            <Footer />
        </Wrapper>
    );
};

export async function getServerSideProps({ params }) {
    try {
        // const { inscription, collection = null } = await getInscription(params.slug);
        const { inscription = {}, collection = {} } = {};
        return { props: { inscription, collection, className: "template-color-1" } };
    } catch (e) {
        console.log(e);
        return { props: { inscription: null, collection: null, className: "template-color-1", e: e.message } };
    }
}

Inscription.propTypes = {
    // inscriptionId: PropTypes.string,
    inscription: PropTypes.object,
    collection: PropTypes.object,
    e: PropTypes.string,
};

export default Inscription;
