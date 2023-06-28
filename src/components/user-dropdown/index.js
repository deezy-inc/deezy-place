import Image from "next/image";
import Anchor from "@ui/anchor";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import SessionStorage, { SessionsStorageKeys } from "@services/session-storage";
import { useMemo } from "react";
import { useWallet } from "@context/wallet-context";

const UserDropdown = () => {
  const {
    walletName,
    nostrPaymentsAddress,
    nostrOrdinalsAddress,
    onDisconnectHandler: onDisconnect,
  } = useWallet();

  const urlLogo = useMemo(() => {
    if (walletName === "xverse") return "/images/logo/xverse.png";
    const domain = SessionStorage.get(SessionsStorageKeys.DOMAIN);
    switch (domain) {
      case "nosft.xyz":
        return "/images/logo/metamask.png";
      case "ordswap.io":
        return "/images/logo/ordswap.svg";
      case "generative.xyz":
        return "/images/logo/generative.png";
      case "unisat.io":
        return "/images/logo/unisat.png";
      default:
        return "/images/logo/alby.png";
    }
  }, [walletName]);

  const copyOrdinalsAddressToClipboard = () => {
    navigator.clipboard.writeText(nostrOrdinalsAddress);
    toast("Receive Address copied to clipboard!");
  };

  const onWalletClick = () => {
    router.push("/wallet");
  };

  const copyPaymentAddressToClipboard = () => {
    navigator.clipboard.writeText(nostrPaymentsAddress);
    toast("Receive Address copied to clipboard!");
  };

  return (
    <div className="icon-box">
      <Anchor path="#">
        <Image src={urlLogo} alt="Images" width={38} height={38} />
      </Anchor>
      <div className="rn-dropdown">
        <div className="rn-product-inner">
          <ul className="product-list">
            <li className="single-product-list">
              <div className="content">
                <h6 className="title">Receive Address</h6>
                <>
                  {/* Add copy to clipboard button */}
                  {walletName !== "xverse" ? (
                    <>
                      <span className="text">
                        You can safely receive ordinal inscriptions and regular
                        bitcoin to this address
                      </span>
                      <div className="d-flex">
                        <span className="theme-color">
                          {nostrOrdinalsAddress}
                        </span>{" "}
                        <span className="icon">
                          <button
                            type="button"
                            className="btn-close"
                            aria-label="Copy receive address to clipboard"
                            onClick={copyOrdinalsAddressToClipboard}
                          >
                            <i className="feather-copy" />
                          </button>
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text">
                        You can safely receive ordinals inscriptions to this
                        address
                      </span>
                      <div className="d-flex">
                        <span className="theme-color">
                          {nostrOrdinalsAddress}
                        </span>{" "}
                        <span className="icon">
                          <button
                            type="button"
                            className="btn-close"
                            aria-label="Copy ordinals address to clipboard"
                            onClick={copyOrdinalsAddressToClipboard}
                          >
                            <i className="feather-copy" />
                          </button>
                        </span>
                      </div>
                      <br />
                      <span className="text">
                        But regular bitcoin to this address
                      </span>
                      <div className="d-flex">
                        <span>{nostrPaymentsAddress}</span>{" "}
                        <span className="icon">
                          <button
                            type="button"
                            className="btn-close"
                            aria-label="Copy payment address to clipboard"
                            onClick={copyPaymentAddressToClipboard}
                          >
                            <i className="feather-copy" />
                          </button>
                        </span>
                      </div>
                    </>
                  )}
                </>
              </div>
              <div className="button" />
            </li>
            {/* <li className="single-product-list">
                        <div className="content">
                            <h6 className="title">
                                Public Key
                                <span className="icon">
                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Copy receive address to clipboard"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                pubKey
                                            );
                                            toast(
                                                "Public key copied to clipboard!"
                                            );
                                        }}
                                    >
                                        <i className="feather-copy" />
                                    </button>
                                </span>
                            </h6>
                            <span className="text">{pubKey}</span>
                        </div>
                        <div className="button" />
                    </li> */}
          </ul>
        </div>

        <ul className="list-inner">
          <li>
            <button type="button" onClick={onWalletClick}>
              Wallet
            </button>
          </li>
        </ul>

        <ul className="list-inner">
          <li>
            <button type="button" onClick={onDisconnect}>
              Disconnect Wallet
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
};

UserDropdown.propTypes = {};

export default UserDropdown;
