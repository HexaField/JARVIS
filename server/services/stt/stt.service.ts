import { AssetUploadType } from "@xrengine/common/src/interfaces/UploadAssetInterface"
import { Application, ServerMode } from "@xrengine/server-core/declarations"
import config from "@xrengine/server-core/src/appconfig"
import { UploadParams } from "@xrengine/server-core/src/media/upload-asset/upload-asset.service"
import { spawn } from 'child_process'
import express from 'express'
import multer from 'multer'

import axios from 'axios'
import path from 'path'

const multipartMiddleware = multer({ limits: { fieldSize: Infinity } })

declare module '@xrengine/common/declarations' {
  interface ServiceTypes {
    'speech-to-text': {
      create: ReturnType<typeof speechToTextRequest>
    }
  }
}

export const speechToTextRequest = (app: Application) => {
  return async (data: AssetUploadType, params: UploadParams) => {
    if (typeof data.args === 'string') data.args = JSON.parse(data.args)
    const files = params.files[0]

    const result = await axios.post<string>(
      `http://${config.server.hostname}:8080/stt`,
      files.buffer,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    return result.data
  }
}

export function SpeechToText(app: Application) {
  if (app.serverMode !== ServerMode.Analytics || config.db.forceRefresh) return

  const deepspeech = spawn('deepspeech-server', ['--config', 'config.yaml'], {
    cwd: path.resolve(__dirname, '../../../stt'),
    shell: true,
    stdio: 'inherit'
  })

  deepspeech.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  })

  app.use(
    'speech-to-text',
    multipartMiddleware.any(),
    (req: express.Request, res: express.Response, next: express.NextFunction) => {
      if (req?.feathers && req.method !== 'GET') {
        ; (req as any).feathers.files = (req as any).files.media ? (req as any).files.media : (req as any).files
      }
      next()
    },
    {
      create: speechToTextRequest(app)
    }
  )
}
