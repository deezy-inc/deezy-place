/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue, react/forbid-prop-types */
import React, { useRef, useMemo } from "react";
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
import useIsSpent from "src/hooks/use-is-spent";

const OutputPage = () => {
  const walletState = useWalletState();
  const router = useRouter();
  const { output } = router.query;

  const elementRef = useRef(null);
  const headerHeight = useHeaderHeight(elementRef);
  const { value: uninscribedSats, isLoading } = useOutput({ output });
  const { isSpent } = useIsSpent(output);
  const nostr = useMemo(
    () =>
      uninscribedSats
        ? {
            content: uninscribedSats?.content,
            created_at: uninscribedSats?.created_at,
            id: uninscribedSats?.id,
            kind: uninscribedSats?.kind,
            pubkey: uninscribedSats?.pubkey,
            sig: uninscribedSats?.sig,
            tags: uninscribedSats?.tags,
          }
        : null,
    [uninscribedSats],
  );
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
          {uninscribedSats && !isSpent && (
            <ProductDetailsArea
              isSpent={isSpent}
              uninscribedSats={uninscribedSats}
              bidsDisabled
              auctionDisabled
              bids={[]}
              nostr={nostr}
              isBidsLoading={false}
              onAction={onAction}
            />
          )}

          {isLoading ? (
            <div className="inscription-area container">
              <SkeletonTheme baseColor="#13131d" highlightColor="#242435">
                <Skeleton count={20} />
              </SkeletonTheme>
            </div>
          ) : null}

          {isSpent ? (
            <div className="inscription-area container">
              <div className="row">
                <div className="col-12">
                  <div className="inscription-area__content">
                    <p className="inscription-area__title">
                      Uninscribed Sats not found or it has been spent
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </main>

        <Footer />
      </Wrapper>
    </WalletContext.Provider>
  );
};

OutputPage.propTypes = {};

export default OutputPage;
