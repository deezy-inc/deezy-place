import { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import ShareModal from "@components/modals/share-modal";

const ShareDropdown = () => {
    const [showShareModal, setShowShareModal] = useState(false);
    const handleShareModal = () => {
        setShowShareModal((prev) => !prev);
    };

    return (
        <>
            <Dropdown className="share-btn share-btn-activation">
                <Dropdown.Toggle className="icon" variant="link" bsPrefix="p-0">
                    <svg
                        viewBox="0 0 14 4"
                        fill="none"
                        width="16"
                        height="16"
                        className="sc-bdnxRM sc-hKFxyN hOiKLt"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M3.5 2C3.5 2.82843 2.82843 3.5 2 3.5C1.17157 3.5 0.5 2.82843 0.5 2C0.5 1.17157 1.17157 0.5 2 0.5C2.82843 0.5 3.5 1.17157 3.5 2ZM8.5 2C8.5 2.82843 7.82843 3.5 7 3.5C6.17157 3.5 5.5 2.82843 5.5 2C5.5 1.17157 6.17157 0.5 7 0.5C7.82843 0.5 8.5 1.17157 8.5 2ZM11.999 3.5C12.8274 3.5 13.499 2.82843 13.499 2C13.499 1.17157 12.8274 0.5 11.999 0.5C11.1706 0.5 10.499 1.17157 10.499 2C10.499 2.82843 11.1706 3.5 11.999 3.5Z"
                            fill="currentColor"
                        />
                    </svg>
                </Dropdown.Toggle>

                <Dropdown.Menu className="share-btn-setting" align="end">
                    <button
                        type="button"
                        className="btn-setting-text share-text"
                        onClick={handleShareModal}
                    >
                        Share
                    </button>
                </Dropdown.Menu>
            </Dropdown>
            <ShareModal show={showShareModal} handleModal={handleShareModal} />
        </>
    );
};

export default ShareDropdown;
