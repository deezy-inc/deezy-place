import React from "react";

import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import HeroArea from "@containers/HeroArea";
import OrdinalsArea from "@containers/OrdinalsArea";
import { normalizedData } from "@utils/methods";

import ordinalsData from "@data/ordinals.json"; // TODO: Replace with FETCH of pub key
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

                <OrdinalsArea
                    data={{
                        ...content["your-collection-section"],
                        products: ordinalsData,
                    }}
                />
            </main>

            <Footer />
        </Wrapper>
    );
};

export default App;
