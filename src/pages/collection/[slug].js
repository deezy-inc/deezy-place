/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import React, { useState, useEffect, useRef } from "react";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import Collection from "@containers/Collection";
import CollectionLive from "@containers/CollectionLive";
import CollectionAuction from "@containers/CollectionAuction";
import CollectionInfo from "@components/collection-info";
import { useRouter } from "next/router";
import { WalletContext } from "@context/wallet-context";
import { useWalletState, useHeaderHeight } from "@hooks";
import { getCollection } from "@services/nosft";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import clsx from "clsx";
import SectionTitle from "@components/section-title";
import Slider, { SliderItem } from "@ui/slider";
import OrdinalCard from "@components/collection-inscription";

const SliderOptions = {
  infinite: true,
  slidesToShow: 5,
  slidesToScroll: 1,
  autoplay: true,
  speed: 4000,
  responsive: [
    {
      breakpoint: 1399,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 992,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 1,
      },
    },
    {
      breakpoint: 576,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
};

const Inscription = () => {
  const walletState = useWalletState();
  const router = useRouter();
  const { slug } = router.query;

  const elementRef = useRef(null);
  const headerHeight = useHeaderHeight(elementRef);

  const [collection, setCollection] = useState({});
  const [displayCollections, setDisplayCollections] = useState(false);

  // Do not queue the rendering with the collections, otherwise it will take more to render the first piece (the collection info)
  setTimeout(() => {
    setDisplayCollections(true);
  }, 500);

  useEffect(() => {
    if (!slug) return;
    const fetchCollection = async () => {
      const collectionData = await getCollection(slug, true);

      const links = [];

      if (collectionData.website_link) {
        links.push({
          name: "Website",
          url: collectionData.website_link,
        });
      }

      if (collectionData.twitter_link) {
        links.push({
          name: "Twitter",
          url: collectionData.twitter_link,
        });
      }

      if (collectionData.discord_link) {
        links.push({
          name: "Discord",
          url: collectionData.discord_link,
        });
      }

      // collectionData.inscriptions = collectionInscriptions.slice(0, 50);
      collectionData.links = links;

      setCollection(collectionData);
    };

    fetchCollection();
  }, [slug]);

  return (
    <WalletContext.Provider value={walletState}>
      <Wrapper>
        <SEO
          pageTitle={`${collection?.name ? collection.name : ""} Collection`}
        />
        <Header ref={elementRef} />
        <main id="main-content" style={{ paddingTop: headerHeight }}>
          {collection && <CollectionInfo collection={collection} />}
          {collection && displayCollections && (
            <>
              {/* <CollectionAuction collection={collection} /> */}
              <CollectionLive collection={collection} />
              <Collection collection={collection} />
            </>
          )}
          {!displayCollections && (
            <SkeletonTheme baseColor="#13131d" highlightColor="#242435">
              <div
                id="your-collection"
                className={clsx("rn-product-area", "mt--50")}
              >
                <div className="container">
                  <div className="row mb--50 align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                      <SectionTitle
                        className="mb--0 live-title"
                        {...{ title: "Collection" }}
                      />
                    </div>
                    <div className="row g-5">
                      <Slider
                        options={SliderOptions}
                        className="slick-gutter-15"
                      >
                        {[...Array(5)].map((_, index) => (
                          <SliderItem key={index} className="ordinal-slide">
                            <OrdinalCard overlay />
                          </SliderItem>
                        ))}
                      </Slider>
                    </div>
                  </div>
                </div>
              </div>
            </SkeletonTheme>
          )}
        </main>

        <Footer />
      </Wrapper>
    </WalletContext.Provider>
  );
};

Inscription.propTypes = {};

export default Inscription;
