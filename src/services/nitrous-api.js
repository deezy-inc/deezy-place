const axios = require("axios");

const NITROUS_BASE_API_URL = "ordinals-api-lb.deezy.io";

function mapInscription(obj) {
  console.log("[obj]", obj);
  const [txid, vout, offset] = obj.satpoint.split(':')
  return {
    content_length: String(obj.content_length),
    content_type: obj.content_type,
    created: obj.created ? Number(obj.timestamp) : 0,
    genesis_fee: String(obj.fee),
    genesis_height: String(obj.height),
    id: String(obj.id),
    num: String(obj.number),
    owner: obj.address,
    sats: String(obj.value),
    output: `${txid}:${vout}`,
    offset: offset,
    inscriptionId: obj.id,
    vout: Number(vout),
    txid: txid,
    value: obj.value,
  };
}

function mapNostrEvent(obj) {
  return {
    inscriptionId: obj.inscriptionId,
    content: obj.content,
    created_at: Number(obj.eventCreatedAt),
    id: obj.id,
    kind: obj.kind,
    pubkey: obj.pubkey,
    sig: obj.sig,
    tags: obj.tags,
    value: Number(obj.value),
  };
}

function mapBidEvent(obj) {
  return {
    price: Number(obj.price),
    bidOwner: obj.bidOwner,
    ordinalOwner: obj.ordinalOwner,
    output: obj.output,
    created_at: Number(obj.bidCreatedAt),
    nostr: mapNostrEvent(obj.nostr),
  };
}

function mapAuction(obj) {
  if (!obj) {
    return;
  }

  return {
    initialPrice: Number(obj.initialPrice),
    inscriptionId: obj.inscriptionId,
    secondsBetweenEachDecrease: Number(obj.secondsBetweenEachDecrease),
    collection: obj.collection,
    status: obj.status,
    decreaseAmount: Number(obj.decreaseAmount),
    btcAddress: obj.btcAddress,
    currentPrice: Number(obj.currentPrice),
    startTime: Number(obj.startTime),
    scheduledISODate: obj.scheduledISODate,
    output: obj.output,
    reservePrice: Number(obj.reservePrice),
    id: obj.id,
    metadata: obj.metadata,
  };
}

async function getInscription(inscriptionId) {
  try {
    const response = await axios.get(
      `https://${NITROUS_BASE_API_URL}/inscription/${inscriptionId}`, {
        headers: {
          accept: 'application/json'
        }
      }
    );
    const inscriptionData = await response.data;

    // Note: auctions are disabled
    const _auction = inscriptionData.auctions?.find(
      (a) => a.status === "RUNNING" || a.status === "PENDING",
    );

    return {
      ...inscriptionData,
      inscription: mapInscription(inscriptionData),
      // Note: sellEvents and bids are disabled
      nostr: inscriptionData.sellEvents?.[0]
        ? mapNostrEvent(inscriptionData.sellEvents?.[0])
        : undefined,
      bids: inscriptionData.bids?.map(mapBidEvent),
      auction: mapAuction(_auction),
    };
  } catch (error) {
    console.error(error);
  }
}

module.exports = { getInscription };
