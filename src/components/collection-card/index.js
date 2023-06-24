/* eslint-disable react/forbid-prop-types */
import { useContext } from "react";
import dynamic from "next/dynamic";
import PropTypes from "prop-types";

import clsx from "clsx";
import Anchor from "@ui/anchor";
import Image from "next/image";
import ClientAvatar from "@ui/client-avatar";
import ProductBid from "@components/product-bid";
import { useWallet } from "@context/wallet-context";
import { ImageType } from "@utils/types";
import { shortenStr, MEMPOOL_API_URL } from "@services/nosft";
import { InscriptionPreview } from "@components/inscription-preview";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";

const CollectionCard = ({ overlay, collection }) => {
  return (
    <SkeletonTheme baseColor="#13131d" highlightColor="#242435">
      <Anchor className="logo-dark" path={`/collection/${collection.slug}`}>
        <div className={clsx("product-style-one", !overlay && "no-overlay")}>
          <div>
            <Image
              src={collection.icon}
              alt={"Slider Images"}
              height={450}
              width={450}
              priority
            />
          </div>
        </div>
      </Anchor>
    </SkeletonTheme>
  );
};

CollectionCard.propTypes = {
  collection: PropTypes.shape({
    name: PropTypes.string.isRequired,
    slug: PropTypes.string.isRequired,
    icon: PropTypes.string,
    description: PropTypes.string,
  }),
};

CollectionCard.defaultProps = {
  overlay: false,
};

export default CollectionCard;
