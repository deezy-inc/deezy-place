import React from "react";
import Head from "next/head";

const SEO = ({ pageTitle }: { pageTitle: string }) => {
    const title = `${pageTitle} | Nosft`;
    return (
        <Head>
            <title>{title}</title>
            <meta httpEquiv="x-ua-compatible" content="ie=edge" />
            <meta
                name="description"
                content="Bitcoin web wallet connected to your nostr key, designed to hold ordinal inscription NFTs"
            />
            <meta name="robots" content="noindex, follow" />
            <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
            <link rel="icon" href="/images/logo/favicon.svg" type="image/svg+xml" />
        </Head>
    );
};

export default SEO;
