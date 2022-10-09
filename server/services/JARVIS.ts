import { World } from "@xrengine/engine/src/ecs/classes/World"

export default async function JARVIS(world: World) {
  console.log('JARVIS!')
  const execute = () => {

  }

  const cleanup = async () => {

  }

  const subsystems = [
    () => import('./speech2text/Speech2TextSystem')
  ]

  return { execute, cleanup, subsystems }
}