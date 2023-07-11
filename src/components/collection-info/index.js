import PropTypes from "prop-types";
import Image from "next/image";
import Anchor from "@ui/anchor";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const CollectionInfo = ({ collection }) => {
  return (
    <SkeletonTheme baseColor="#13131d" highlightColor="#242435">
      <div className="slider-one rn-section-gapTop">
        <div className="container">
          <div className="row row-reverce-sm align-items-center">
            <div className="col-sm-6">
              <div className="slider-thumbnail mb--30">
                {collection?.icon && (
                  <Image
                    src={collection.icon}
                    alt={"Slider Images"}
                    width={108}
                    height={108}
                  />
                )}

                {!collection?.icon && (
                  <Skeleton circle height={108} width={108} />
                )}
              </div>
            </div>

            <div>
              {collection?.name && (
                <h4 className="title">{collection?.name}</h4>
              )}

              {!collection?.name && <Skeleton width={200} count={1} />}
            </div>

            <div className="mb--20">
              {collection.description && <p>{collection.description}</p>}
              {!collection.description && <Skeleton width={200} count={2} />}
            </div>

            {collection?.links?.length > 0 && (
              <div>
                {collection.links.map((link) => (
                  <Anchor className="mr--10" path={link.url}>
                    {link.name}
                  </Anchor>
                ))}
              </div>
            )}

            {!collection?.links?.length && <Skeleton width={200} count={1} />}
          </div>
        </div>
      </div>
    </SkeletonTheme>
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
