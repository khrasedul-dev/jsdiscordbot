import Context from './context.js'
import Markup from './markup.js'
import { Scene, SceneManager } from './scenes.js'
import { session } from './session.js'
import { sessionStore as defaultSessionStore } from './sessionStore.js'

class DiscordBot {
  command(cmds, fn) {
    const arr = Array.isArray(cmds) ? cmds : [cmds]
    this.on('command', async (ctx) => {
      if (ctx.text) {
        for (const cmd of arr) {
          if (
            typeof cmd === 'string' &&
            ctx.text.split(' ')[0] === cmd.replace(/^\//, '')
          ) {
            await fn(ctx)
            return
          } else if (cmd instanceof RegExp && cmd.test(ctx.text)) {
            await fn(ctx)
            return
          }
        }
      }
    })
  }
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

  use(fn) {
    this.middlewares.push(fn)
  }

  catch(fn) {
    this.errorHandler = fn
  }

  on(event, fn) {
    if (!this.handlers[event]) this.handlers[event] = []
    this.handlers[event].push(fn)
  }

  hears(patterns, fn) {
    const arr = Array.isArray(patterns) ? patterns : [patterns]
    this.on('message', async (ctx) => {
      if (ctx.text) {
        for (const pattern of arr) {
          if (typeof pattern === 'string' && ctx.text === pattern) {
            await fn(ctx)
            return
          } else if (pattern instanceof RegExp && pattern.test(ctx.text)) {
            await fn(ctx)
            return
          }
        }
      }
    })
  }

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
        await interaction.deferUpdate() // Prevent "This interaction failed"
      } catch {
        // ignore errors from already-acknowledged interactions
      }
    })
  }
  // Register a button action handler (Telegraf-style)
  action(actionIdOrArray, fn) {
    const arr = Array.isArray(actionIdOrArray)
      ? actionIdOrArray
      : [actionIdOrArray]
    this.on('action', async (ctx) => {
      for (const pattern of arr) {
        if (typeof pattern === 'string' && ctx.payload === pattern) {
          await fn(ctx)
          return
        } else if (pattern instanceof RegExp && pattern.test(ctx.payload)) {
          await fn(ctx)
          return
        }
      }
    })
  }

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

    // Message event
    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return
      const ctx = new Context(this, message, message.channelId)
      ctx.session = (await this.sessionStore.get(message.author.id)) || {}
      for (const mw of this.middlewares) {
        try {
          await mw(ctx, async () => {})
        } catch (err) {
          if (this.errorHandler) this.errorHandler(err, ctx)
          else console.error('Middleware error:', err)
        }
      }
      for (const handler of this.handlers.message) {
        try {
          await handler(ctx)
        } catch (err) {
          if (this.errorHandler) this.errorHandler(err, ctx)
          else console.error('Message handler error:', err)
        }
      }
      if (message.content.startsWith('/') || message.content.startsWith('!')) {
        ctx.text = message.content.slice(1)
        for (const handler of this.handlers.command) {
          try {
            await handler(ctx)
          } catch (err) {
            if (this.errorHandler) this.errorHandler(err, ctx)
            else console.error('Command handler error:', err)
          }
        }
      }
      await this.sessionStore.set(message.author.id, ctx.session)
    })

    // Interaction event (buttons, select menus, etc.)
    this._setupInteractions()

    // Member join event
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

    // Member leave event
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

    // Reaction add event
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

    // Reaction remove event
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

    // Add more events as needed (voice, typing, etc.)

    await this.client.login(this.token)
    console.log('🚀 DiscordBot is running and connected to Discord!')
  }
}

export default DiscordBot
export { Markup, Scene, SceneManager, session }
