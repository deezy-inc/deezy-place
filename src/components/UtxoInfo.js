import React from 'react'
import { TailSpin } from 'react-loading-icons'
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import { cloudfrontUrl } from '../utils';

export default function UtxoInfo({ utxosReady, ownedUtxos, setShowUtxoModal, setCurrentUtxo, inscriptionUtxosByUtxo }) {
  if (!utxosReady) return (<>
    <br /><br />
    <TailSpin stroke="#000000" speed={.75} />
    <br /><br />
  </>)
  return (<div>
    {
      ownedUtxos.length === 0 ?
        <>
          <div>
            This address doesn't own anything yet..
            <br /><br />
            Consider minting an <a href="https://astralbabes.ai" target="_blank">astral babe</a>
          </div>
        </>
        :
        <>
          <br />
          <Container className="d-flex flex-wrap">
            {ownedUtxos.map(it => {
              return (
                <Card className="my-2 mx-2 hover-pointer gallery-item">
                  <Card.Body className="d-flex flex-column" onClick={() => {
                    setCurrentUtxo(it)
                    setShowUtxoModal(true)
                  }}>
                    {
                      !inscriptionUtxosByUtxo[`${it.txid}:${it.vout}`] ?
                        <>
                          <br /><br />
                          <TailSpin stroke="#000000" speed={.75} />
                          <br /><br />
                        </>
                        :
                        <>
                          <img
                            alt=""
                            src={it.status.confirmed ? ordinalsImageUrl(inscriptionUtxosByUtxo[`${it.txid}:${it.vout}`]) : cloudfrontUrl(it)}
                            style={{ width: "200px" }}
                            className="mb-3"
                          />
                        </>
                    }
                  </Card.Body>
                </Card>
              )
            })}
          </Container>
        </>
    }
  </div>)
}
