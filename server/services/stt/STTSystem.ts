import { World } from "@xrengine/engine/src/ecs/classes/World"
import { Consumer, Producer  } from 'mediasoup/node/lib/types'
import { ffmpeg } from "./ffmpeg"

export default async function SSTSystem(world: World) {


  let connected = false
  let accumulator = 0

  const execute = () => {
    if (!world._mediaHostId) return

    accumulator += world.deltaSeconds
    if (accumulator < 1)
      return

    accumulator = 0

    // console.log(world.mediaNetwork.peers)
    const peers = Array.from(world.mediaNetwork.peers.values())
    const producers = peers.map((peer) => world.mediaNetwork.producers.find((p) => peer?.media?.['cam-audio']?.producerId === p.id)).filter(a => !!a)
    const audioProducers = producers.filter(
      (c: any) => c.appData.mediaTag === 'cam-audio'
    ) as Producer[]
    for (const producer of audioProducers) {
      if (!connected) {
        connected = true
        ffmpeg(producer)
      }
    }
  }

  const cleanup = async () => {

  }

  const subsystems = []

  return { execute, cleanup, subsystems }
}