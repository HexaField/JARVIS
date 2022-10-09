import { ProjectEventHooks } from '@xrengine/projects/ProjectConfigInterface'
import { Application } from '@xrengine/server-core/declarations'
import { activateRoute } from '@xrengine/server-core/src/route/route/route.service'

const config = {
  onInstall: async (app: Application) => {
    await activateRoute(app.service('route'))({ project: 'JARVIS', route: '/jarvis', activate: true })
  }
} as ProjectEventHooks

export default config
