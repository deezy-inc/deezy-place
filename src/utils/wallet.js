import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import { getAddress } from "sats-connect";

import { ethers } from "ethers";
import BIP32Factory from "bip32";
import { DEFAULT_DERIV_PATH, NETWORK } from "@lib/constants.config";
import { toXOnly } from "@utils/crypto";

bitcoin.initEccLib(ecc);

const bip32 = BIP32Factory(ecc);

// sign message with first sign transaction
export const TAPROOT_MESSAGE = (domain) =>
  // will switch to nosft.xyz once sends are implemented
  `Sign this message to generate your Bitcoin Taproot key. This key will be used for your ${domain} transactions.`;

// Used to prove ownership of address and associated ordinals
// https://github.com/LegReq/bip0322-signatures/blob/master/BIP0322_signing.ipynb

export const connectWallet = async ({ metamask, xverse }) => {
  const { ethereum } = window;
  let pubKey = "";
  let ordinalsAddress = "";
  let paymentAddress = "";

  if (ethereum && metamask) {
    let ethAddress = ethereum.selectedAddress;
    if (!ethAddress) {
      await ethereum.request({ method: "eth_requestAccounts" });
      ethAddress = ethereum.selectedAddress;
    }
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const toSign = `0x${Buffer.from(TAPROOT_MESSAGE(metamask)).toString(
      "hex"
    )}`;
    const signature = await provider.send("personal_sign", [
      toSign,
      ethAddress,
    ]);
    const seed = ethers.utils.arrayify(
      ethers.utils.keccak256(ethers.utils.arrayify(signature))
    );
    const root = bip32.fromSeed(Buffer.from(seed));
    const taprootChild = root.derivePath(DEFAULT_DERIV_PATH);
    const taprootAddress = bitcoin.payments.p2tr({
      internalPubkey: toXOnly(taprootChild.publicKey),
      network: NETWORK,
    });
    return {
      pubKey: taprootAddress.pubkey.toString("hex"),
      wallet: "metamask",
      ordinalsAddress: "",
      paymentAddress: "",
    };
  }
  if (xverse) {
    console.log("xverse", NETWORK);
    const getAddressOptions = {
      payload: {
        purposes: ["ordinals", "payment"],
        message: "Address for receiving Ordinals",
        network: {
          type: "Mainnet",
        },
      },
      onFinish: (response) => {
        console.log("[xverse]", response);
        const { publicKey, address: walletOrdinalAddress } =
          response.addresses.find((address) => address.purpose === "ordinals");
        pubKey = publicKey.toString("hex");
        const { address: walletPaymentAddress } = response.addresses.find(
          (address) => address.purpose === "payment"
        );
        paymentAddress = walletPaymentAddress;
        ordinalsAddress = walletOrdinalAddress;
      },
      onCancel: () => alert("Request canceled."),
    };

    await getAddress(getAddressOptions);
    return { pubKey, wallet: "xverse", ordinalsAddress, paymentAddress };
  }

  if (window.nostr && window.nostr.enable) {
    await window.nostr.enable();
  } else {
    alert(
      "Oops, it looks like you haven't set up your Nostr key yet or installed Metamask." +
        "Go to your Alby Account Settings and create or import a Nostr key."
    );
    return undefined;
  }
  pubKey = await window.nostr.getPublicKey();
  return {
    pubKey,
    wallet: "alby",
    ordinalsAddress: "",
    paymentAddress: "",
  };
};
