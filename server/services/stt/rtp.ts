import { Engine } from "@xrengine/engine/src/ecs/classes/Engine"
import { localConfig } from "@xrengine/server-core/src/config"
import { WebRtcTransportParams } from "@xrengine/server-core/src/types/WebRtcTransportParams"
import { SocketWebRTCServerNetwork } from "../../../../../../instanceserver/src/SocketWebRTCServerNetwork"
import {
  Consumer,
  DataConsumer,
  DataConsumerOptions,
  DataProducer,
  DataProducerOptions,
  Producer,
  Router,
  RtpCodecCapability,
  Transport,
  WebRtcTransport
} from 'mediasoup/node/lib/types'
import config from "@xrengine/server-core/src/appconfig"
import { getPort } from "./port"

export const publishProducerRtpStream = async (producer: Producer) => {
  // console.log('publishProducerRtpStream', producer, producer.appData)

  const network = Engine.instance.currentWorld.mediaNetwork as SocketWebRTCServerNetwork
  const routerList = network.routers[`${producer.appData.channelType}:${producer.appData.channelId}`]

  const dumps = await Promise.all(routerList.map(async (item) => await item.dump()))
  const sortedDumps = dumps.sort((a, b) => a.transportIds.length - b.transportIds.length)
  const router = routerList.find((item) => item.id === sortedDumps[0].id)!

  if (!router) {
    throw new Error('Failed to find a router to create a transport on')
  }

  const rtpTransport = await router.createPlainTransport({
    listenIp: { ip: '0.0.0.0', announcedIp: config.server.hostname }, // TODO: Change announcedIp to your external IP or domain name
    rtcpMux: true,
    comedia: false
  })

  // Set the receiver RTP ports
  const remoteRtpPort = await getPort()

  // Connect the mediasoup RTP transport to the ports used by GStreamer
  await rtpTransport.connect({
    ip: '127.0.0.1',
    port: remoteRtpPort
  })

  const codecs = [] as RtpCodecCapability[];
  // Codec passed to the RTP Consumer must match the codec in the Mediasoup router rtpCapabilities
  const routerCodec = router.rtpCapabilities.codecs!.find(
    codec => codec.kind === producer.kind
  );
  codecs.push(routerCodec!);

  const rtpCapabilities = {
    codecs,
    rtcpFeedback: []
  };

  // Start the consumer paused
  // Once the gstreamer process is ready to consume resume and send a keyframe
  const rtpConsumer = await rtpTransport.consume({
    producerId: producer.id,
    rtpCapabilities,
    paused: true
  });

  rtpConsumer.resume()

  return {
    remoteRtpPort,
    localRtcpPort: rtpTransport.rtcpTuple ? rtpTransport.rtcpTuple.localPort : undefined,
    rtpCapabilities,
    rtpParameters: rtpConsumer.rtpParameters
  };
};