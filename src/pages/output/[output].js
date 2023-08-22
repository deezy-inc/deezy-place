/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import React, { useRef, useEffect } from "react";
import Wrapper from "@layout/wrapper";
import Header from "@layout/header";
import Footer from "@layout/footer";
import SEO from "@components/seo";
import ProductDetailsArea from "@containers/product-details";
import { useRouter } from "next/router";
import { WalletContext } from "@context/wallet-context";
import { useWalletState, useHeaderHeight } from "@hooks";
import "react-loading-skeleton/dist/skeleton.css";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import useOutput from "src/hooks/use-output";

const OutputPage = () => {
  const walletState = useWalletState();
  const router = useRouter();
  const { output } = router.query;

  const elementRef = useRef(null);
  const headerHeight = useHeaderHeight(elementRef);
  const { value: uninscribedSats, loading } = useOutput(output);
  const onAction = async () => {};

  return (
    <WalletContext.Provider value={walletState}>
      <Wrapper>
        <SEO pageTitle="Uninscribed Sats" />
        <Header ref={elementRef} />
        <main
          id="main-content"
          style={{ paddingTop: headerHeight }}
          className="d-flex align-items-center justify-content-center"
        >
          {uninscribedSats && (
            <ProductDetailsArea
              uninscribedSats={uninscribedSats}
              bids={[]}
              isBidsLoading={false}
              bidsDisabled
              sellDisabled
              buyDisabled
              auctionDisabled
              onAction={onAction}
            />
          )}

          {(loading || !uninscribedSats) && (
            <div className="inscription-area container">
              <SkeletonTheme baseColor="#13131d" highlightColor="#242435">
                <Skeleton count={20} />
              </SkeletonTheme>
            </div>
          )}
        </main>

        <Footer />
      </Wrapper>
    </WalletContext.Provider>
  );
};

OutputPage.propTypes = {};

export default OutputPage;
