import PropTypes from "prop-types";
import clsx from "clsx";
import { ImageType } from "@utils/types";

const InscriptionCollection = ({ className, collection, client }) => (
    <div className={clsx("collection", className)}>
        <span>Collection</span>
        <div className="collection-info">
            <img src={collection.icon} loading="lazy" />
            <h6 className="name">{collection.name}</h6>
        </div>
    </div>
);

InscriptionCollection.propTypes = {
    className: PropTypes.string,
    collection: PropTypes.shape({
        name: PropTypes.string,
        slug: PropTypes.string,
        image: ImageType,
    }),
};

export default InscriptionCollection;
