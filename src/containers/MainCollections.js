/* eslint-disable react/no-array-index-key */

import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";

import { getCollection } from "@services/nosft";

import "react-loading-skeleton/dist/skeleton.css";

import CollectionCard from "@components/collection-card";

const mainCollections = [
  "astral-babes",
  "astralchads",
  "bitcoin-frogs",
  "bitcoinpunks",
];

const MainCollections = ({ className, space }) => {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const fetchCollections = async () => {
      // get all collections using promise.all
      const promises = mainCollections.map((collection) =>
        getCollection(collection)
      );
      const collections = await Promise.all(promises);

      setCollections(collections);
    };
    fetchCollections();
  }, []);

  const renderCards = () => {
    if (!collections.length) return null;

    return (
      <div className="row">
        {collections.map((collection) => (
          <div
            className="col-lg-3 col-md-6 col-sm-6 col-12 mb--20"
            key={collection.slug}
          >
            <CollectionCard collection={collection} />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={clsx(space === 1 && "rn-section-gapTop", className)}>
      <div className="container">
        <div className="row mb--20">
          <div className="col-lg-6 col-md-6 col-sm-6 col-12 mt_mobile--15">
            <SectionTitle className="mb--0" {...{ title: "Top Collections" }} />
          </div>
        </div>

        <div className="row">
          <div className="col-lg-12">{renderCards()}</div>
        </div>
      </div>
    </div>
  );
};

MainCollections.propTypes = {
  className: PropTypes.string,
  space: PropTypes.oneOf([1, 2]),
};

MainCollections.defaultProps = {
  space: 1,
};

export default MainCollections;
