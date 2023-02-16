import React from "react";
import ScrollToTop from "@ui/scroll-to-top";
import PropTypes from "prop-types";

const Wrapper = ({ children }) => (
    <>
        {children}
        <ScrollToTop />
    </>
);

Wrapper.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Wrapper;
