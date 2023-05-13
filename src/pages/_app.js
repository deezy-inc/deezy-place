import { useEffect } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import sal from "sal.js";
import { ThemeProvider } from "next-themes";
import { GoogleAnalytics } from "nextjs-google-analytics";

import "../assets/css/bootstrap.min.css";
import "../assets/css/feather.css";
import "react-toastify/dist/ReactToastify.css";
import "../assets/scss/style.scss";
import "react-datepicker/dist/react-datepicker.css";

const MyApp = ({ Component, pageProps }) => {
    const router = useRouter();
    useEffect(() => {
        sal({ threshold: 0.1, once: true });
    }, [router.asPath]);

    useEffect(() => {
        sal();
    }, []);
    useEffect(() => {
        document.body.className = `${pageProps.className}`;
    });
    return (
        <ThemeProvider defaultTheme="dark">
            <GoogleAnalytics trackPageViews />
            <Component {...pageProps} />
        </ThemeProvider>
    );
};

MyApp.propTypes = {
    Component: PropTypes.elementType,
    pageProps: PropTypes.shape({
        className: PropTypes.string,
    }),
};

export default MyApp;
