import { useEffect, useState } from "react";

const BidsLoadingButton = () => {
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotCount((prevCount) => (prevCount < 3 ? prevCount + 1 : 0));
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return (
    <button className="pd-react-area btn-transparent" type="button">
      <div className="action">
        <span>Searching for Bids</span>
        <span style={{ visibility: dotCount >= 1 ? "visible" : "hidden" }}>
          .
        </span>
        <span style={{ visibility: dotCount >= 2 ? "visible" : "hidden" }}>
          .
        </span>
        <span style={{ visibility: dotCount >= 3 ? "visible" : "hidden" }}>
          .
        </span>
      </div>
    </button>
  );
};

export default BidsLoadingButton;
