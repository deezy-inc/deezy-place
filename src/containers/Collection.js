/* eslint-disable react/no-array-index-key */
import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import OrdinalFilter from "@components/ordinal-filter";
import OrdinalCard from "@components/collection-inscription";
import { collectionAuthor, applyFilters } from "@containers/helpers";

import "react-loading-skeleton/dist/skeleton.css";

const Collection = ({ className, space, collection }) => {
  const [filteredOwnedUtxos, setFilteredOwnedUtxos] = useState([]);

  const [activeSort, setActiveSort] = useState();
  const [sortAsc, setSortAsc] = useState(false);

  const [utxosType, setUtxosType] = useState("");

  useMemo(() => {
    const filteredUtxos = applyFilters({
      utxos: collection.inscriptions || [],
      activeSort,
      sortAsc,
      utxosType,
    });

    setFilteredOwnedUtxos(filteredUtxos);
  }, [collection?.inscriptions, activeSort, sortAsc, utxosType]);

  let { author: name, slug, icon } = collectionAuthor || {};
  if (name) {
    author = {
      name,
      slug,
      image: {
        src: icon,
      },
    };
  }

  return (
    <div
      id="your-collection"
      className={clsx(
        "rn-product-area",
        space === 1 && "rn-section-gapTop",
        className
      )}
    >
      <div className="container">
        <div className="row mb--50 align-items-center">
          <div className="col-lg-6 col-md-6 col-sm-6 col-12">
            <SectionTitle
              className="mb--0 live-title"
              {...{ title: "Collection" }}
            />
          </div>

          {collection?.inscriptions?.length > 0 && (
            <div className="col-lg-6 col-md-6 col-sm-6 col-12">
              <OrdinalFilter
                ownedUtxos={collection.inscriptions}
                setFilteredOwnedUtxos={setFilteredOwnedUtxos}
                setActiveSort={setActiveSort}
                setSortAsc={setSortAsc}
                activeSort={activeSort}
                sortAsc={sortAsc}
                setUtxosType={setUtxosType}
                utxosType={utxosType}
              />
            </div>
          )}
        </div>

        <div className="row g-5">
          {collection?.inscriptions?.length > 0 && (
            <>
              {filteredOwnedUtxos?.map((inscription) => (
                <div
                  key={inscription.id}
                  className="col-5 col-lg-4 col-md-6 col-sm-6 col-12"
                >
                  <OrdinalCard
                    overlay
                    inscription={{
                      ...inscription,
                      inscriptionId: inscription.id,
                    }}
                  />
                </div>
              ))}

              {filteredOwnedUtxos.length === 0 && (
                <div className="col-12">
                  <div className="text-center">
                    <h3>No results found</h3>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

Collection.propTypes = {
  className: PropTypes.string,
  space: PropTypes.oneOf([1, 2]),
  collection: PropTypes.any,
};

Collection.defaultProps = {
  space: 1,
  type: "live",
};

export default Collection;