// eslint-disable-next-line
const { Nosft } = require("nosft-core-ajs");
// Pass local config
const nosft = Nosft();

export default nosft;

const { connectWallet } = nosft.wallet;
const { getAddressInfo } = nosft.address;

export { getAddressInfo, connectWallet };
