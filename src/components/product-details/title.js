import PropTypes from "prop-types";
import clsx from "clsx";
// import ShareDropdown from "../share-dropdown";

const ProductTitle = ({ className, title, likeCount }) => (
    <div className={clsx("pd-title-area", className)}>
        <h4 className="title">{title}</h4>
        {/* TODO: IMPLEMENT SHARE, NOW THAT WE HAVE SPECIFIC INSCRIPTION PAGES */}
        {/* <div className="pd-react-area">
            <div className="share">
                <i className="feather-share" />
                <span>Share</span>
            </div>
        </div> */}
    </div>
);

ProductTitle.propTypes = {
    className: PropTypes.string,
    title: PropTypes.string.isRequired,
};

ProductTitle.defaultProps = {};

export default ProductTitle;
