/* eslint-disable no-restricted-syntax, no-await-in-loop, no-continue */
import PropTypes from "prop-types";
import Image from "next/image";
import Button from "@ui/button";
import "react-toastify/dist/ReactToastify.css";

const WalletDropdown = ({ onConnect }) => (
    <div className="rn-dropdown">
        <div className="rn-product-inner">
            <ul className="product-list">
                <li className="single-product-list">
                    <div className="content">
                        <Button
                            color="primary-alta"
                            className="connectBtn"
                            size="small"
                            onClick={() => onConnect(false)}
                        >
                            <Image width={25} height={25} src="/images/logo/alby-sticker.svg" />
                            Connect with Alby
                        </Button>
                    </div>
                </li>
                <li className="single-product-list">
                    <div className="content">
                        <Button
                            color="primary-alta"
                            className="connectBtn"
                            size="small"
                            onClick={() => onConnect("nosft.xyz")}
                        >
                            <Image width={25} height={25} src="/images/logo/MetaMask_Fox.png" />
                            Connect with Metamask
                        </Button>
                    </div>
                </li>
            </ul>
        </div>
    </div>
);

WalletDropdown.propTypes = {
    onConnect: PropTypes.func.isRequired,
};

export default WalletDropdown;
