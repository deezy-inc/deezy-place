/* eslint-disable react/no-array-index-key */

import { useState, useEffect, useRef, useMemo } from "react";
import PropTypes from "prop-types";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import { deepClone } from "@utils/methods";
import Slider, { SliderItem } from "@ui/slider";
import {
  getInscription,
  isTextInscription,
  shouldReplaceInscription,
  isSpent,
  getCollection,
} from "@services/nosft";

import "react-loading-skeleton/dist/skeleton.css";
import { nostrPool } from "@utils/nostr-relay";
import {
  MAX_FETCH_LIMIT,
  MAX_LIMIT_ONSALE,
  MAX_ONSALE,
  MIN_ONSALE,
  ONSALE_BATCH_SIZE,
} from "@lib/constants.config";
import { Subject } from "rxjs";
import { scan } from "rxjs/operators";
import OrdinalCard from "@components/ordinal-card";
import Anchor from "@ui/anchor";
import CollectionCard from "@components/collection-card";

const mainCollections = [
  "astral-babes",
  "astralchads",
  "bitcoin-frogs",
  "bitcoin-wizards",
];

const MainCollections = ({ className, space }) => {
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    const fetchCollections = async () => {
      for (const collection of mainCollections) {
        const data = await getCollection(collection);

        setCollections((prev) => [...prev, data]);
      }
    };
    fetchCollections();
  }, []);

  const renderCards = () => {
    if (!collections.length) return null;

    console.log(collections);
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
