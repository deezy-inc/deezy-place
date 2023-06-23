import PropTypes from "prop-types";
import Image from "next/image";
import Anchor from "@ui/anchor";

const CollectionInfo = ({ collection }) => {
    return (
        <div className="slider-one rn-section-gapTop">
            <div className="container">
                <div className="row row-reverce-sm align-items-center">
                    <div className="col-sm-6">
                        <div className="slider-thumbnail mb--30">
                            <Image src={collection.icon} alt={"Slider Images"} width={108} height={108} priority />
                        </div>
                        {collection?.name && <h4 className="title">{collection?.name}</h4>}

                        <p>{collection.description}</p>
                        {collection?.links?.length > 0 && (
                            <>
                                {collection.links.map((link) => (
                                    <Anchor className="mr--10" path={link.url}>
                                        {link.name}
                                    </Anchor>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

CollectionInfo.propTypes = {
    collection: PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string,
        icon: PropTypes.string,
        slug: PropTypes.string,
        links: PropTypes.arrayOf(
            PropTypes.shape({
                name: PropTypes.string,
                url: PropTypes.string,
            })
        ),
    }),
};

export default CollectionInfo;
