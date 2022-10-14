import { Params } from "@feathersjs/feathers/lib"
import { Engine } from "@xrengine/engine/src/ecs/classes/Engine"
import { initSystems } from "@xrengine/engine/src/ecs/functions/SystemFunctions"
import { SystemUpdateType } from "@xrengine/engine/src/ecs/functions/SystemUpdateType"
import { Application, ServerMode } from "@xrengine/server-core/declarations"
import config from "@xrengine/server-core/src/appconfig"

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
  if (app.serverMode !== ServerMode.Analytics || config.db.forceRefresh) return

  app.use('jarvis-request', {
    get: jarvisRequest(app)
  })

  await initSystems(Engine.instance.currentWorld, [
    {
      uuid: 'JARVIS',
      type: SystemUpdateType.FIXED,
      systemLoader: () => import('./JARVIS')
    }
  ])
}

export default [JARVIS]