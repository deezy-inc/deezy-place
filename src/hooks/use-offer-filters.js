import { HIDE_TEXT_UTXO_OPTION } from "@lib/constants.config";
import { useState } from "react";

export default function useOfferFilters(type) {
  const [activeSort, setActiveSort] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [utxosType, setUtxosType] = useState(
    type === "bidding" ? "" : HIDE_TEXT_UTXO_OPTION,
  );

  return {
    activeSort,
    setActiveSort,
    sortAsc,
    setSortAsc,
    searchQuery,
    setSearchQuery,
    utxosType,
    setUtxosType,
  };
}
