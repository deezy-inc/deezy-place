import { useEffect } from "react";
import PropTypes from "prop-types";
import { useRouter } from "next/router";
import sal from "sal.js";
import { ThemeProvider } from "next-themes";
import { GoogleAnalytics } from "nextjs-google-analytics";
import dynamic from "next/dynamic";

import "../assets/css/bootstrap.min.css";
import "../assets/css/feather.css";
import "react-toastify/dist/ReactToastify.css";
import "../assets/scss/style.scss";

// Collects the user's nsec when a raw-nostr-key signing needs it; client-only
// since it drives a window-event-triggered modal
const NostrSignModal = dynamic(
  () => import("@components/modals/nostr-sign-modal"),
  { ssr: false }
);

const MyApp = ({ Component, pageProps }) => {
  const router = useRouter();
  useEffect(() => {
    sal({ threshold: 0.1, once: true });
  }, [router.asPath]);

  useEffect(() => {
    sal();
  }, []);
  useEffect(() => {
    document.body.className = pageProps.className || "template-color-1";
  });
  return (
    <ThemeProvider defaultTheme="dark">
      <GoogleAnalytics trackPageViews />
      <NostrSignModal />
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
