import { useEffect, useState } from "react";
import { fetchBitcoinPrice } from "@services/nosft";

const useBitcoinPrice = ({ nostrOrdinalsAddress }) => {
  const [bitcoinPrice, setBitcoinPrice] = useState("-");

  useEffect(() => {
    const getPrice = async () => {
      const btcPrice = await fetchBitcoinPrice();
      setBitcoinPrice(btcPrice);
    };

    getPrice();
  }, [nostrOrdinalsAddress]);

  return { bitcoinPrice };
};

export default useBitcoinPrice;
