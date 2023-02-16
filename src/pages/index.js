import React from "react";

import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import SEO from "@components/seo";
import HeroArea from "@containers/HeroArea";

import { normalizedData } from "@utils/methods";
import homepageData from "@data/general/home.json";

export async function getStaticProps() {
    return { props: { className: "template-color-1" } };
}

const App = () => {
    const content = normalizedData(homepageData?.content || []);

    return (
        <Wrapper>
            <SEO pageTitle="Deezy" />
            <Header />

            <main id="main-content">
                <HeroArea data={content["hero-section"]} />
            </main>
        </Wrapper>
    );
};

export default App;
