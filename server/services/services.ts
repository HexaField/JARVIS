import { Params } from "@feathersjs/feathers/lib"
import { Engine } from "@xrengine/engine/src/ecs/classes/Engine"
import { initSystems, SystemModuleType } from "@xrengine/engine/src/ecs/functions/SystemFunctions"
import { SystemUpdateType } from "@xrengine/engine/src/ecs/functions/SystemUpdateType"
import { Application, ServerMode } from "@xrengine/server-core/declarations"
import config from "@xrengine/server-core/src/appconfig"
import JARVISSystem from "./JARVIS"
import { SpeechToText } from "./stt/stt.service"
import STTSystem from "./stt/STTSystem"

declare module '@xrengine/common/declarations' {
  interface ServiceTypes {
    'jarvis-request': {
      get: ReturnType<typeof jarvisRequest>
    }
  }
}

type JarvisRequest = {
  
}

export const jarvisRequest = (app: Application) => {
  return async function (args: JarvisRequest, params?: Params) {

  }
}

async function JARVIS (app: Application) {
  if (config.db.forceRefresh) return

  console.log('JARVIS', process.env.JARVIS)
  if (process.env.JARVIS !== 'true') return
  app.use('jarvis-request', {
    get: jarvisRequest(app)
  })
  
  const systems = [] as SystemModuleType<any>[]

  systems.push(
    {
      uuid: 'JARVIS',
      type: SystemUpdateType.FIXED,
      systemLoader: () => Promise.resolve({ default: JARVISSystem })
    }
  )

  if (app.serverMode === ServerMode.Instance) {
    systems.push(
      {
        uuid: 'JARVIS',
        type: SystemUpdateType.FIXED,
        systemLoader: () => Promise.resolve({ default: STTSystem })
      }
    )
  }

  await initSystems(Engine.instance.currentWorld, systems)

  SpeechToText(app)
}

export default [JARVIS]