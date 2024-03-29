import {
  DEFAULT_UTXO_TYPES,
  HIDE_TEXT_UTXO_OPTION,
  OTHER_UTXO_OPTION,
} from "@lib/constants.config";
import { matchSorter } from "match-sorter";

export const collectionAuthor = [
  {
    name: "Danny Deezy",
    slug: "/deezy",
    image: {
      src: "/images/logo/nos-ft-logo.png",
    },
  },
];

const isTextInscription = (utxo) => {
  return /(text\/plain|application\/json)/.test(utxo?.content_type);
};

const filterAscDate = (arr) => arr.sort((a, b) => a.created_at - b.created_at);
const filterDescDate = (arr) => arr.sort((a, b) => b.created_at - a.created_at);
const filterAscValue = (arr) => arr.sort((a, b) => a.value - b.value);
const filterDescValue = (arr) => arr.sort((a, b) => b.value - a.value);
const filterAscNum = (arr) => arr.sort((a, b) => a.num - b.num);
const filterDescNum = (arr) => arr.sort((a, b) => b.num - a.num);

const sortWithInscriptionId = (utxos, sortFunction) => {
  const withInscriptionId = [];
  const withoutInscriptionId = [];

  utxos.forEach((utxo) => {
    if (utxo.inscriptionId) {
      withInscriptionId.push(utxo);
    } else {
      withoutInscriptionId.push(utxo);
    }
  });

  return [
    ...sortFunction(withInscriptionId),
    ...sortFunction(withoutInscriptionId),
  ];
};

export const applyFilters = ({
  utxos,
  activeSort,
  sortAsc,
  utxosType,
  showOnlyOrdinals,
  searchQuery,
}) => {
  let filtered = [...utxos];
  if (utxosType) {
    if (utxosType === OTHER_UTXO_OPTION) {
      filtered = filtered.filter(
        (utxo) => !DEFAULT_UTXO_TYPES.includes(utxo.content_type),
      );
    } else if (utxosType === HIDE_TEXT_UTXO_OPTION) {
      filtered = filtered.filter((utxo) => !isTextInscription(utxo));
    } else {
      filtered = filtered.filter((utxo) => utxo.content_type === utxosType);
    }
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    filtered = matchSorter(filtered, searchQuery, {
      keys: [
        "inscriptionId",
        "key",
        "txid",
        "vout",
        "value",
        "num",
        "status.block_time",
        "status.block_height",
        "status.confirmed",
      ],
    });
  }

  if (showOnlyOrdinals) {
    filtered = filtered.filter((utxo) => utxo.inscriptionId);
  }

  if (activeSort === "value") {
    filtered = sortAsc
      ? sortWithInscriptionId(filtered, filterAscValue)
      : sortWithInscriptionId(filtered, filterDescValue);
  } else if (activeSort === "num") {
    filtered = sortAsc
      ? sortWithInscriptionId(filtered, filterAscNum)
      : sortWithInscriptionId(filtered, filterDescNum);
  } else {
    filtered = sortAsc
      ? sortWithInscriptionId(filtered, filterAscDate)
      : sortWithInscriptionId(filtered, filterDescDate);
  }

  return filtered;
};
