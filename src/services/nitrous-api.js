const axios = require("axios");

function mapInscription(obj) {
  console.log("[obj]", obj);
  return {
    content_length: String(obj.contentLength),
    content_type: obj.contentType,
    created: obj.created ? Number(obj.created) : 0,
    genesis_fee: String(obj.genesisFee),
    genesis_height: String(obj.genesisHeight),
    id: String(obj.id),
    num: String(obj.num),
    owner: obj.owner,
    sats: String(obj.sats),
    output: obj.output,
    offset: String(obj.offset),
    inscriptionId: obj.inscriptionId,
    vout: Number(obj.vout),
    txid: obj.txid,
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
      `https://9nukpegt2c.execute-api.us-east-1.amazonaws.com/inscription/${inscriptionId}`,
    );
    const inscriptionData = await response.data;

    const _auction = inscriptionData.auctions?.find(
      (a) => a.status === "RUNNING" || a.status === "PENDING",
    );

    return {
      ...inscriptionData,
      inscription: mapInscription(inscriptionData.inscription),
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
