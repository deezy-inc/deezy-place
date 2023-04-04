/* eslint-disable no-irregular-whitespace */
import { useEffect } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import sal from "sal.js";
import Script from "next/script";
import { ThemeProvider } from "next-themes";
import * as gtag from "../lib/gtag";
import "../assets/css/bootstrap.min.css";
import "../assets/css/feather.css";

import "react-toastify/dist/ReactToastify.css";
import "../assets/scss/style.scss";

const MyApp = ({ Component, pageProps }) => {
    const router = useRouter();
    useEffect(() => {
        sal({ threshold: 0.1, once: true });
    }, [router.asPath]);

    useEffect(() => {
        const handleRouteChange = (url) => {
            gtag.pageview(url);
        };
        router.events.on("routeChangeComplete", handleRouteChange);
        return () => {
            router.events.off("routeChangeComplete", handleRouteChange);
        };
    }, [router.events]);

    useEffect(() => {
        sal();
        document.body.className = `${pageProps.className}`;
    }, []);

    return (
        <>
            <Script strategy="afterInteractive" src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX" />

            <Script
                id="google-analytics"
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', 'G-T3FQG97YST');
                    `,
                }}
            />
            <ThemeProvider defaultTheme="dark">
                <Component {...pageProps} />
            </ThemeProvider>
        </>
    );
};

MyApp.propTypes = {
    Component: PropTypes.elementType,
    pageProps: PropTypes.shape({
        className: PropTypes.string,
    }),
};

export default MyApp;
