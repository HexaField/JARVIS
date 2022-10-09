import type { ProjectConfigInterface } from '@xrengine/projects/ProjectConfigInterface'

const config: ProjectConfigInterface = {
  onEvent: './projectEventHooks.ts',
  thumbnail: '/static/etherealengine.png',
  routes: {
    '/jarvis': { component: () => import('./client/index'), props: { exact: true } }
  },
  services: './server/services/services.ts',
  databaseSeed: undefined
}

export default config
