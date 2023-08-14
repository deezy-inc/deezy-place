import { useEffect, useState } from "react";

const BidsLoadingButton = () => {
  const [dots, setDots] = useState("");

  useEffect(() => {
    // Start an interval to update the number of dots
    const interval = setInterval(() => {
      if (dots.length < 3) {
        setDots((prevDots) => prevDots + ".");
      } else {
        setDots(""); // Reset back to empty string to start over
      }
    }, 300);

    // Cleanup the interval when the component unmounts
    return () => clearInterval(interval);
  }, [dots]);

  return (
    <button className="pd-react-area btn-transparent" type="button">
      <div className="action">
        <span>Searching for Bids{dots}</span>
      </div>
    </button>
  );
};

export default BidsLoadingButton;
