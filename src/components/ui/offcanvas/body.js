import clsx from "clsx";
import PropTypes from "prop-types";

const OffcanvasBody = ({ children, className }) => (
    <div className={clsx(className, "content")}>{children}</div>
);

OffcanvasBody.propTypes = {
    className: PropTypes.node,
    children: PropTypes.node.isRequired,
};

export default OffcanvasBody;
