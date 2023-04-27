// import { Nosft } from "nosft-core-ajs";
const nosftt = require("nosft-core-ajs");

console.log(nosftt);
// consol
const Nosft = () => ({
    wallet: {
        connectWallet: () => {
            console.log("connectWallet");
        },
    },
    address: {
        getAddressInfo: () => {
            console.log("getAddressInfo");
        },
        getAddressInscriptions: () => {
            console.log("getAddressInscriptions");
        },
    },
});
// Pass local config
const nosft = Nosft();

export default nosft;

const { connectWallet } = nosft.wallet;
const { getAddressInfo } = nosft.address;

export { getAddressInfo, connectWallet };
