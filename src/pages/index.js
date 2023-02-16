import React from "react";

// Support @
import Wrapper from "../layouts/wrapper";
import Header from "../layouts/header";
import SEO from "../components/seo";

export async function getStaticProps() {
    return { props: { className: "template-color-1" } };
}

const App = () => {
    return (
        <Wrapper>
            <SEO pageTitle="Deezy" />
            <Header />
        </Wrapper>
    );
};

export default App;
