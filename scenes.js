// DiscordBot Scene and SceneManager
class Scene {
  constructor(name, steps) {
    this.name = name
    this.steps = steps
  }
  async enter(ctx) {
    ctx.session.__scene = this.name
    ctx.session.step = 0
    ctx.scene = this
    await this.handle(ctx)
  }
  async leave(ctx) {
    Object.keys(ctx.session).forEach((k) => {
      delete ctx.session[k]
    })
    ctx.scene = null
    ctx._sceneStopped = true
  }
  async handle(ctx) {
    let step = typeof ctx.session.step === 'number' ? ctx.session.step : 0
    if (step < this.steps.length) {
      const prevStep = step
      const result = await this.steps[step](ctx)
      if (ctx.session.step === prevStep && ctx.text && result !== false) {
        ctx.session.step++
      }
    } else {
      await this.leave(ctx)
    }
  }
}

class SceneManager {
  constructor() {
    this.scenes = {}
  }
  register(scene) {
    this.scenes[scene.name] = scene
  }
  middleware() {
    return async (ctx, next) => {
      const sceneName = ctx.session?.__scene
      let handled = false
      if (sceneName && this.scenes[sceneName] && !ctx._sceneStopped) {
        await this.scenes[sceneName].handle(ctx)
        handled = true
      }
      if (!handled) await next()
    }
  }
}

export { Scene, SceneManager }
