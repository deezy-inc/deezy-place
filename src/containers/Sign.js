/* eslint-disable react/no-array-index-key */

import { useState, useContext, useEffect } from "react";
import PropTypes from "prop-types";
import ConnectWallet from "@components/modals/connect-wallet";
import WalletContext from "@context/wallet-context";
import InputGroup from "react-bootstrap/InputGroup";
import Form from "react-bootstrap/Form";
import Button from "@ui/button";
import SectionTitle from "@components/section-title";
import clsx from "clsx";
import { signBip322MessageSimple } from "@utils/bip322";
import { toast } from "react-toastify";

const Sign = ({ onConnectHandler, className, space }) => {
    const { nostrPublicKey, nostrAddress, ethProvider } = useContext(WalletContext);
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [signedMessage, setSignedMessage] = useState(null);
    const [message, setMessage] = useState(null);

    const sign = async () => {
        if (!message) {
            return;
        }

        try {
            const signed = await signBip322MessageSimple(message);
            setSignedMessage(signed);

            toast.info(`Message uccessfully signed and copied to clipboard.`);
            navigator.clipboard.writeText(signed);
        } catch (e) {
            toast.error(e.message);
        }
    };

    useEffect(() => {
        if (nostrPublicKey && message && !signedMessage) {
            sign();
        }
    }, [nostrPublicKey]);

    const handleShowConnectModal = async () => {
        setShowConnectModal((prev) => !prev);
    };

    const messageOnChange = (evt) => {
        setMessage(evt.target.value);

        setSignedMessage(null);
    };

    const submit = async () => {
        if (!nostrPublicKey) {
            handleShowConnectModal();
            return;
        }

        await sign();
    };

    return (
        <div id="sign-message" className={clsx("rn-product-area", space === 1 && "rn-section-gapTop", className)}>
            <div className="container">
                <div className="row mb--50 align-items-center">
                    <div className="col-lg-6 col-md-6 col-sm-6 col-12">
                        <SectionTitle className="mb--0" {...{ title: `Sign Message` }} />
                    </div>
                </div>

                <div className="form">
                    <InputGroup>
                        <Form.Label>Sign your message with Bip322</Form.Label>
                        <Form.Control
                            defaultValue={message}
                            onChange={messageOnChange}
                            placeholder="Enter your message to sign"
                            aria-label="Enter your message to sign"
                            aria-describedby="basic-addon2"
                            autoFocus
                            rows={10}
                            as="textarea"
                        />
                    </InputGroup>

                    {signedMessage && (
                        <InputGroup className="show-animated">
                            <Form.Label>
                                Signature
                                <span className="icon">
                                    <button
                                        type="button"
                                        className="btn-close"
                                        aria-label="Copy signed message to clipboard"
                                        onClick={() => {
                                            navigator.clipboard.writeText(signedMessage);
                                            toast("Signature copied to clipboard!");
                                        }}
                                    >
                                        <i className="feather-copy" />
                                    </button>
                                </span>
                            </Form.Label>
                            <Form.Control
                                defaultValue={signedMessage}
                                placeholder="Signed msessage will appear here."
                                aria-label="Signed message will appear here."
                                aria-describedby="basic-addon2"
                                rows={3}
                                disabled
                                as="textarea"
                            />
                        </InputGroup>
                    )}

                    <div className="form-action">
                        <Button size="medium" onClick={submit} disabled={!message}>
                            Sign
                        </Button>
                    </div>
                </div>

                {!nostrPublicKey && (
                    <ConnectWallet
                        show={showConnectModal}
                        onConnect={onConnectHandler}
                        handleModal={handleShowConnectModal}
                        ethProvider={ethProvider}
                    />
                )}
            </div>
        </div>
    );
};

Sign.propTypes = {
    onConnectHandler: PropTypes.func,
    className: PropTypes.string,
    space: PropTypes.oneOf([1, 2]),
};

Sign.defaultProps = {
    space: 1,
};

export default Sign;
