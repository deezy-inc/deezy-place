export const collectionAuthor = [
    {
        name: "Danny Deezy",
        slug: "/deezy",
        image: {
            src: "/images/logo/nos-ft-logo.png",
        },
    },
];

const filterAscDate = (arr) => arr.sort((a, b) => a.status.block_time - b.status.block_time);
const filterDescDate = (arr) => arr.sort((a, b) => b.status.block_time - a.status.block_time);
const filterAscValue = (arr) => arr.sort((a, b) => a.value - b.value);
const filterDescValue = (arr) => arr.sort((a, b) => b.value - a.value);
const filterAscNum = (arr) => arr.sort((a, b) => a.num - b.num);
const filterDescNum = (arr) => arr.sort((a, b) => b.num - a.num);

export const applyFilters = ({ utxos, activeSort, sortAsc }) => {
    let filtered = utxos;
    if (activeSort === "value") {
        filtered = sortAsc ? filterAscValue(filtered) : filterDescValue(filtered);
    } else if (activeSort === "num") {
        filtered = sortAsc ? filterAscNum(filtered) : filterDescNum(filtered);
    } else {
        filtered = sortAsc ? filterAscDate(filtered) : filterDescDate(filtered);
    }
    return filtered;
};
