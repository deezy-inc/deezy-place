import { memo } from "react";
import clsx from "clsx";
import PropTypes from "prop-types";

const Offcanvas = memo(({ children, className, isOpen, onClick }) => (
    <div
        className={clsx("popup-mobile-menu", isOpen ? "active" : "", className)}
        onClick={onClick}
        onKeyPress={onClick}
        role="button"
        tabIndex={0}
    >
        <div
            className="inner"
            onClick={(e) => e.stopPropagation()}
            onKeyPress={onClick}
            role="button"
            tabIndex={0}
        >
            {children}
        </div>
    </div>
));

Offcanvas.displayName = "Offcanvas";

Offcanvas.propTypes = {
    children: PropTypes.node.isRequired,
    className: PropTypes.node,
    isOpen: PropTypes.bool.isRequired,
    onClick: PropTypes.func.isRequired,
};

export default Offcanvas;
