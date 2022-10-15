
import { spawn } from 'child_process'
import { Readable } from 'stream'
import { publishProducerRtpStream } from './rtp'
import { Consumer, Producer } from 'mediasoup/node/lib/types'
import axios from 'axios'
import fs from 'fs'
import config from '@xrengine/server-core/src/appconfig'

const ffmpegCommands = [
  '-loglevel',
  'debug',
  '-protocol_whitelist',
  'pipe,udp,rtp',
  '-fflags',
  '+genpts',
  '-f',
  '-bitexact',
  'wav',
  '-acodec', 'pcm_s16le', '-ar', '22050', '-ac', '1',
  '-i',
  'pipe:0'
]

const ffmpegAudioCommands = [
  '-map',
  '0:a:0',
  // '-strict', // libvorbis is experimental
  // '-2',
  '-c:a',
  'pcm_s24le'
]

const ffmpegVideoCommands = [
  '-map',
  '0:v:0',
  '-c:v',
  'copy'
]

export const ffmpeg = async (producer: Producer) => {

  const recordInfo = {
    audio: await publishProducerRtpStream(producer),
    video: null!
  }

  const sdpString = createSdpText(recordInfo);
  console.log(sdpString)
  const sdpStream = convertStringToStream(sdpString);
  console.log(sdpStream)

  const outDir = `${__dirname}/${Date.now().toString()}.wav`
  console.log(outDir)

  return new Promise<void>((resolve, reject) => {

    const ffmpeg = spawn('ffmpeg', ffmpegCommands.concat(ffmpegAudioCommands, [outDir]))

    if (ffmpeg.stderr) {
      ffmpeg.stderr.setEncoding('utf-8');

      ffmpeg.stderr.on('data', data =>
        console.log('ffmpeg::process::data [data:%o]', data)
      );
    }

    // if (ffmpeg.stdout) {
    //   ffmpeg.stdout.setEncoding('utf-8');

    //   ffmpeg.stdout.on('data', data =>
    //     console.log('ffmpeg::process::data [data:%o]', data)
    //   );
    // }

    ffmpeg.on('message', message =>
      console.log('ffmpeg::process::message [message:%o]', message)
    );

    ffmpeg.on('error', error => {
      console.error('ffmpeg::process::error [error:%o]', error)
      reject()
    });

    ffmpeg.once('close', () => {
      console.log('ffmpeg::process::close')
      resolve()
    });

    sdpStream.on('error', error =>
      console.error('sdpStream::error [error:%o]', error)
    );

    // Pipe sdp stream to the ffmpeg process
    sdpStream.resume();
    sdpStream.pipe(ffmpeg.stdin);

    setTimeout(async () => {
      console.log('ending')
      sdpStream.unpipe(ffmpeg.stdin)
      ffmpeg.kill()
      sdpStream.destroy()

      const result = await axios.post<string>(
        `http://${config.server.hostname}:8080/stt`,
        fs.createReadStream(outDir),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      )

      console.log(result)
    }, 5000)


  })
}

const createSdpText = (rtpParameters) => {
  const { video, audio } = rtpParameters;

  // Video codec info
  // const videoCodecInfo = getCodecInfoFromRtpParameters('video', video.rtpParameters);

  // Audio codec info
  const audioCodecInfo = getCodecInfoFromRtpParameters('audio', audio.rtpParameters);

  /**
   * 
  m=video ${video.remoteRtpPort} RTP/AVP ${videoCodecInfo.payloadType} 
  a=rtpmap:${videoCodecInfo.payloadType} ${videoCodecInfo.codecName}/${videoCodecInfo.clockRate}
  a=sendonly
   */
  return `v=0
  o=- 0 0 IN IP4 127.0.0.1
  s=FFmpeg
  c=IN IP4 127.0.0.1
  t=0 0
  m=audio ${audio.remoteRtpPort} RTP/AVP ${audioCodecInfo.payloadType} 
  a=rtpmap:${audioCodecInfo.payloadType} ${audioCodecInfo.codecName}/${audioCodecInfo.clockRate}/${audioCodecInfo.channels}
  a=sendonly
  `;
};

const convertStringToStream = (stringToConvert) => {
  const stream = new Readable();
  stream._read = () => { };
  stream.push(stringToConvert);
  stream.push(null);

  return stream;
};

// Gets codec information from rtpParameters
const getCodecInfoFromRtpParameters = (kind, rtpParameters) => {
  return {
    payloadType: rtpParameters.codecs[0].payloadType,
    codecName: rtpParameters.codecs[0].mimeType.replace(`${kind}/`, ''),
    clockRate: rtpParameters.codecs[0].clockRate,
    channels: kind === 'audio' ? rtpParameters.codecs[0].channels : undefined
  };
};