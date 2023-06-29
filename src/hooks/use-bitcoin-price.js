import { useState } from "react";
import { fetchBitcoinPrice } from "@services/nosft";

const useBitcoinPrice = ({ nostrPaymentsAddress }) => {
  const [bitcoinPrice, setBitcoinPrice] = useState("-");

  useEffect(() => {
    const getPrice = async () => {
      const btcPrice = await fetchBitcoinPrice();
      setBitcoinPrice(btcPrice);
    };

    getPrice();
  }, [nostrPaymentsAddress]);

  return { bitcoinPrice };
};

export default useBitcoinPrice;
