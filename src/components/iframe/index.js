import { useState } from "react";
import { TailSpin } from "react-loading-icons";
import PropTypes from "prop-types";

export const IframeWithLoader = ({ src, title, width, height, ...props }) => {
    const [loading, setLoading] = useState(true);

    const handleLoad = () => {
        setLoading(false);
    };

    let element = (
        <iframe
            src={src}
            title={title}
            width={width}
            height={height}
            onLoad={handleLoad}
            style={{ visibility: loading ? "hidden" : "visible" }}
            {...props}
        />
    );

    // We load the content directly if the inscription is an image
    if (src.includes("content")) {
        element = <img src={src} alt={src.split(/[\s/]+/).pop()} onLoad={handleLoad} />;
    }

    return (
        <div style={{ position: "relative", width, height }}>
            {loading && (
                <div
                    style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                    }}
                >
                    <div className="ordinal-loader">
                        <TailSpin stroke="#fec823" speed={0.75} />
                    </div>
                </div>
            )}
            {element}
        </div>
    );
};

IframeWithLoader.propTypes = {
    src: PropTypes.string,
    title: PropTypes.string,
    width: PropTypes.number,
    height: PropTypes.number,
    id: PropTypes.string,
    sandbox: PropTypes.string,
    loading: PropTypes.string,
};
