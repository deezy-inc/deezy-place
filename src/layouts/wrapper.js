import React from 'react';
import PropTypes from "prop-types";

const Wrapper = ({ children }) => (
    <>
        {children}
    </>
);

Wrapper.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Wrapper;
