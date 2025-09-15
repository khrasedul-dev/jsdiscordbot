import Context from './context.js'
import Markup from './markup.js'
import { Scene, SceneManager } from './scenes.js'
import { session } from './session.js'
import { sessionStore as defaultSessionStore } from './sessionStore.js'

/**
 * Main DiscordBot framework class. Handles commands, actions, scenes, middlewares, and message events.
 * @class
 */

class DiscordBot {
  /**
   * Register a command handler.
   * @param {string|RegExp|Array} cmds - Command(s) to match.
   * @param {function(Context):Promise<void>} fn - Handler function.
   */
  command(cmds, fn) {
    const arr = Array.isArray(cmds) ? cmds : [cmds]
    this.on('command', async (ctx) => {
      if (!ctx.text) return
      for (const cmd of arr) {
        if (
          (typeof cmd === 'string' &&
            ctx.text.split(' ')[0] === cmd.replace(/^\//, '')) ||
          (cmd instanceof RegExp && cmd.test(ctx.text))
        ) {
          await fn(ctx)
          ctx.handled = true // automatically mark handled
          return
        }
      }
    })
  }

  /**
   * Create a new DiscordBot instance.
   * @param {object} options - Bot options.
   * @param {string} options.token - Discord bot token.
   * @param {object} [options.sessionStore] - Custom session store.
   * @param {function} [options.errorHandler] - Error handler.
   */
  constructor({ token, sessionStore, errorHandler = null } = {}) {
    if (!token) throw new Error('DiscordBot requires a bot token')
    this.token = token
    this.sessionStore = sessionStore || defaultSessionStore
    this.errorHandler = errorHandler
    this.handlers = {
      message: [],
      command: [],
      action: [],
      photo: [],
      document: [],
      other: [],
      new_member: [],
      remove_member: [],
      message_reaction_add: [],
      message_reaction_remove: [],
    }
    this.middlewares = []
    this.actions = {}
    this.client = null
  }

  /**
   * Register a middleware function.
   * @param {function(Context, function):Promise<void>} fn - Middleware function.
   */
  use(fn) {
    this.middlewares.push(fn)
  }

  /**
   * Set a global error handler.
   * @param {function(Error, Context):Promise<void>} fn - Error handler function.
   */
  catch(fn) {
    this.errorHandler = fn
  }

  /**
   * Register an event handler.
   * @param {string} event - Event name.
   * @param {function(Context):Promise<void>} fn - Handler function.
   */
  on(event, fn) {
    if (!this.handlers[event]) this.handlers[event] = []
    this.handlers[event].push(fn)
  }

  /**
   * Register a message pattern handler.
   * @param {string|RegExp|Array} patterns - Patterns to match.
   * @param {function(Context):Promise<void>} fn - Handler function.
   */
  hears(patterns, fn) {
    const arr = Array.isArray(patterns) ? patterns : [patterns]
    this.on('message', async (ctx) => {
      if (!ctx.text) return
      for (const pattern of arr) {
        if (
          (typeof pattern === 'string' && ctx.text === pattern) ||
          (pattern instanceof RegExp && pattern.test(ctx.text))
        ) {
          await fn(ctx)
          ctx.handled = true // automatically mark handled
          return
        }
      }
    })
  }

  /**
   * Send a message to a channel.
   * @param {string} chatId - Channel ID.
   * @param {object|string} payload - Message payload or text.
   * @returns {Promise<object|undefined>} Discord.js message response.
   */
  async sendMessage(chatId, payload) {
    if (!this.client) return
    const channel = this.client.channels?.cache.get(chatId)
    if (!channel) return

    if (typeof payload === 'string') {
      return channel.send(payload)
    } else if (payload.embeds || payload.files) {
      return channel.send(payload)
    } else {
      return channel.send({ content: 'Unsupported message format' })
    }
  }

  /**
   * Internal: Setup Discord button interactions.
   * @private
   */
  _setupInteractions() {
    if (!this.client) return
    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return
      const ctx = new Context(this, interaction, interaction.channelId)
      ctx.payload = interaction.customId

      for (const handler of this.handlers.action) {
        try {
          await handler(ctx)
        } catch (err) {
          if (this.errorHandler) this.errorHandler(err, ctx)
          else console.error('Action handler error:', err)
        }
      }

      try {
        await interaction.deferUpdate()
      } catch {}
    })
  }

  /**
   * Register an action (button) handler.
   * @param {string|RegExp|Array} actionIdOrArray - Action(s) to match.
   * @param {function(Context):Promise<void>} fn - Handler function.
   */
  action(actionIdOrArray, fn) {
    const arr = Array.isArray(actionIdOrArray)
      ? actionIdOrArray
      : [actionIdOrArray]
    this.on('action', async (ctx) => {
      for (const pattern of arr) {
        if (
          (typeof pattern === 'string' && ctx.payload === pattern) ||
          (pattern instanceof RegExp && pattern.test(ctx.payload))
        ) {
          await fn(ctx)
          ctx.handled = true // automatically mark handled
          return
        }
      }
    })
  }

  /**
   * Launch the bot and connect to Discord.
   * @returns {Promise<void>}
   */
  async launch() {
    if (!this.client) {
      const { Client, GatewayIntentBits } = await import('discord.js')
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildMembers,
          GatewayIntentBits.GuildMessageReactions,
        ],
      })
    }

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return

      const ctx = new Context(this, message, message.channelId)
      ctx.session = (await this.sessionStore.get(message.author.id)) || {}
      ctx.handled = false

      // Run middlewares
      for (const mw of this.middlewares) {
        try {
          await mw(ctx, async () => {})
        } catch (err) {
          if (this.errorHandler) this.errorHandler(err, ctx)
          else console.error('Middleware error:', err)
        }
      }

      // Run command handlers first if message starts with / or !
      if (message.content.startsWith('/') || message.content.startsWith('!')) {
        ctx.text = message.content.slice(1)
        for (const handler of this.handlers.command) {
          if (ctx.handled) break
          try {
            await handler(ctx)
          } catch (err) {
            if (this.errorHandler) this.errorHandler(err, ctx)
            else console.error('Command handler error:', err)
          }
        }
      }

      // Run message handlers only if not handled
      let messageHandled = false
      if (!ctx.handled) {
        for (const handler of this.handlers.message) {
          if (ctx.handled) break
          try {
            await handler(ctx)
            messageHandled = true
          } catch (err) {
            if (this.errorHandler) this.errorHandler(err, ctx)
            else console.error('Message handler error:', err)
          }
        }
      }

      // Default reply if not handled and not in a scene
      if (!ctx.handled && !ctx.session.__scene && ctx.text) {
        return
      }

      await this.sessionStore.set(message.author.id, ctx.session)
    })

    // Setup interactions
    this._setupInteractions()

    // Member join
    this.client.on('guildMemberAdd', async (member) => {
      for (const handler of this.handlers.new_member || []) {
        try {
          await handler(new Context(this, member, member.id))
        } catch (err) {
          if (this.errorHandler) this.errorHandler(err)
          else console.error('new_member error:', err)
        }
      }
    })

    // Member leave
    this.client.on('guildMemberRemove', async (member) => {
      for (const handler of this.handlers.remove_member || []) {
        try {
          await handler(new Context(this, member, member.id))
        } catch (err) {
          if (this.errorHandler) this.errorHandler(err)
          else console.error('remove_member error:', err)
        }
      }
    })

    // Reaction add
    this.client.on('messageReactionAdd', async (reaction, user) => {
      for (const handler of this.handlers.message_reaction_add || []) {
        try {
          await handler(new Context(this, reaction, user.id))
        } catch (err) {
          if (this.errorHandler) this.errorHandler(err)
          else console.error('message_reaction_add error:', err)
        }
      }
    })

    // Reaction remove
    this.client.on('messageReactionRemove', async (reaction, user) => {
      for (const handler of this.handlers.message_reaction_remove || []) {
        try {
          await handler(new Context(this, reaction, user.id))
        } catch (err) {
          if (this.errorHandler) this.errorHandler(err)
          else console.error('message_reaction_remove error:', err)
        }
      }
    })

    await this.client.login(this.token)
    console.log('🚀 DiscordBot is running and connected to Discord!')
  }
}

/**
 * Main DiscordBot framework class.
 * @type {DiscordBot}
 */
export default DiscordBot
/**
 * Markup utility for Discord message components.
 * @type {Markup}
 */
export { Markup, Scene, SceneManager, session }
