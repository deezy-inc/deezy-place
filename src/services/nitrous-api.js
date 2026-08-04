const axios = require("axios");

const NITROUS_BASE_API_URL = "ordinals-api-lb.deezy.io";

function mapInscription(obj) {
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

    return {
      ...inscriptionData,
      inscription: mapInscription(inscriptionData),
    };
  } catch (error) {
    console.error(error);
  }
}

module.exports = { getInscription };
