import PropTypes from "prop-types";
import clsx from "clsx";

const OffcanvasHeader = ({ className, onClick, children }) => (
    <div className={clsx("header-top", className)}>
        {children}
        <div className="close-menu">
            <button className="close-button" type="button" onClick={onClick}>
                <i className="feather-x" />
            </button>
        </div>
    </div>
);

OffcanvasHeader.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.string,
    onClick: PropTypes.func.isRequired,
};

export default OffcanvasHeader;
