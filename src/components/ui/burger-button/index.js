import PropTypes from "prop-types";
import clsx from "clsx";

const BurgerButton = ({ className, onClick }) => (
    <button
        type="button"
        className={clsx(className, "hamberger-button")}
        onClick={onClick}
    >
        <i className="feather-menu" color="red" />
    </button>
);

BurgerButton.propTypes = {
    className: PropTypes.string,
    onClick: PropTypes.func,
};

export default BurgerButton;
