/**
 * Represents a multi-step scene for user flows (e.g. registration).
 * @class
 */
class Scene {
  /**
   * Create a new Scene.
   * @param {string} name - Scene name.
   * @param {Array<function(Context):Promise<void>>} steps - Array of step handler functions.
   */
  constructor(name, steps) {
    this.name = name
    this.steps = steps
  }
  /**
   * Enter the scene and start at step 0.
   * @param {Context} ctx - Bot context.
   * @returns {Promise<void>}
   */
  async enter(ctx) {
    ctx.session.__scene = this.name
    ctx.session.step = 0
    ctx.scene = this
    await this.handle(ctx)
  }
  /**
   * Leave the scene and clear session data.
   * @param {Context} ctx - Bot context.
   * @returns {Promise<void>}
   */
  async leave(ctx) {
    Object.keys(ctx.session).forEach((k) => {
      delete ctx.session[k]
    })
    ctx.scene = null
    ctx._sceneStopped = true
  }
  /**
   * Handle the current scene step.
   * @param {Context} ctx - Bot context.
   * @returns {Promise<void>}
   */
  async handle(ctx) {
    let step = typeof ctx.session.step === 'number' ? ctx.session.step : 0
    if (step < this.steps.length) {
      const prevStep = step
      const result = await this.steps[step](ctx)
      // Mark as handled if a scene step was processed
      ctx.handled = true
      if (ctx.session.step === prevStep && ctx.text && result !== false) {
        ctx.session.step++
      }
    } else {
      await this.leave(ctx)
      ctx.handled = true
    }
  }
}

/**
 * Manages registered scenes and provides scene middleware.
 * @class
 */
class SceneManager {
  /**
   * Create a new SceneManager.
   */
  constructor() {
    this.scenes = {}
  }
  /**
   * Register a scene.
   * @param {Scene} scene - Scene instance to register.
   */
  register(scene) {
    this.scenes[scene.name] = scene
  }
  /**
   * Get scene middleware for use in bot.
   * @returns {function(Context, function):Promise<void>} Middleware function.
   */
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

/**
 * Scene and SceneManager for multi-step user flows.
 * @type {Scene}
 */
export { Scene, SceneManager }
