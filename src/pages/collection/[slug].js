/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import React, { useState, useEffect, useRef } from "react";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import Collection from "@containers/Collection";
import CollectionLive from "@containers/CollectionLive";
import CollectionInfo from "@components/collection-info";
import { useRouter } from "next/router";
import { WalletContext } from "@context/wallet-context";
import { useWalletState, useHeaderHeight } from "@hooks";
import { getCollection, getCollectionInscriptions } from "@services/nosft";

const Inscription = () => {
  const walletState = useWalletState();
  const router = useRouter();
  const { slug } = router.query;

  const elementRef = useRef(null);
  const headerHeight = useHeaderHeight(elementRef);

  const [collection, setCollection] = useState({});

  useEffect(() => {
    if (!slug) return;
    const fetchCollection = async () => {
      const collectionData = await getCollection(slug);

      const collectionInscriptions = await getCollectionInscriptions(slug);

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

      collectionData.inscriptions = collectionInscriptions;
      collectionData.links = links;

      setCollection(collectionData);
    };

    fetchCollection();
  }, [slug]);

  return (
    <WalletContext.Provider value={walletState}>
      <Wrapper>
        <SEO pageTitle={`${slug} collection`} />
        <Header ref={elementRef} />
        <main id="main-content" style={{ paddingTop: headerHeight }}>
          {collection && (
            <>
              <CollectionInfo collection={collection} />
              <CollectionLive collection={collection} />
              <Collection collection={collection} />
            </>
          )}
        </main>

        <Footer />
      </Wrapper>
    </WalletContext.Provider>
  );
};

Inscription.propTypes = {};

export default Inscription;
