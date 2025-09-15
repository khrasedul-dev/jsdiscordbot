/**
 * Context abstraction for DiscordBot. Provides message, event, session, and reply helpers.
 * @class
 */
class Context {
  /**
   * Create a new Context instance.
   * @param {DiscordBot} bot - The bot instance.
   * @param {object} event - Discord event/message object.
   * @param {string} senderId - Sender's Discord user ID.
   */
  constructor(bot, event, senderId) {
    this.bot = bot
    this.chat = { id: senderId }
    this.text = event.content
    this.event = event
    this.session = {}
    this.scene = null

    // Discord-specific: attachments, embeds, etc.
    this.attachments = event.attachments || []
    this.images = this.attachments.filter((a) => a.type === 'image')
    this.files = this.attachments.filter((a) => a.type === 'file')
  }

  // --- Basic Reply ---
  /**
   * Reply to the current event/message.
   * @param {string|object} textOrPayload - Message text or Discord.js payload object.
   * @param {Array|object|null} [buttons=null] - Button(s) to attach.
   * @returns {Promise<object>} Discord.js message response.
   */
  async reply(textOrPayload, buttons = null) {
    let payload
    if (typeof textOrPayload === 'string') {
      payload = { content: textOrPayload }
    } else if (textOrPayload && textOrPayload.content) {
      payload = { ...textOrPayload }
    } else {
      payload = { content: String(textOrPayload) }
    }

    if (buttons)
      payload.components = Array.isArray(buttons) ? buttons : [buttons]
    return this.event.channel.send(payload)
  }

  // --- Reply with Photo ---
  /**
   * Reply with a photo attachment.
   * @param {string|Buffer} urlOrBuffer - URL or Buffer for the photo.
   * @param {string} [caption=''] - Caption text.
   * @param {Array|object|null} [buttons=null] - Button(s) to attach.
   * @returns {Promise<object>} Discord.js message response.
   */
  async replyWithPhoto(urlOrBuffer, caption = '', buttons = null) {
    let fileData = urlOrBuffer
    let fileName = 'photo.jpg'

    if (typeof urlOrBuffer === 'string' && urlOrBuffer.startsWith('http')) {
      const axios = (await import('axios')).default
      const response = await axios.get(urlOrBuffer, {
        responseType: 'arraybuffer',
      })
      fileData = Buffer.from(response.data)
      const urlParts = urlOrBuffer.split('/')
      fileName = urlParts[urlParts.length - 1] || fileName
    }

    const payload = {
      content: caption,
      files: [{ attachment: fileData, name: fileName }],
    }
    if (buttons)
      payload.components = Array.isArray(buttons) ? buttons : [buttons]
    return this.event.channel.send(payload)
  }

  // --- Reply with Document ---
  /**
   * Reply with a document attachment.
   * @param {string|Buffer} urlOrBuffer - URL or Buffer for the document.
   * @param {string} [filename='file'] - Filename for the document.
   * @param {string} [caption=''] - Caption text.
   * @param {Array|object|null} [buttons=null] - Button(s) to attach.
   * @returns {Promise<object>} Discord.js message response.
   */
  async replyWithDocument(
    urlOrBuffer,
    filename = 'file',
    caption = '',
    buttons = null
  ) {
    let fileData = urlOrBuffer
    if (typeof urlOrBuffer === 'string' && urlOrBuffer.startsWith('http')) {
      const axios = (await import('axios')).default
      const response = await axios.get(urlOrBuffer, {
        responseType: 'arraybuffer',
      })
      fileData = Buffer.from(response.data)
    }

    const payload = {
      content: caption,
      files: [{ attachment: fileData, name: filename }],
    }
    if (buttons)
      payload.components = Array.isArray(buttons) ? buttons : [buttons]
    return this.event.channel.send(payload)
  }

  // --- Reply with PDF ---
  /**
   * Reply with a PDF attachment.
   * @param {string|Buffer} urlOrBuffer - URL or Buffer for the PDF.
   * @param {string} [filename='file.pdf'] - Filename for the PDF.
   * @param {string} [caption=''] - Caption text.
   * @param {Array|object|null} [buttons=null] - Button(s) to attach.
   * @returns {Promise<object>} Discord.js message response.
   */
  async replyWithPDF(
    urlOrBuffer,
    filename = 'file.pdf',
    caption = '',
    buttons = null
  ) {
    let fileData = urlOrBuffer
    if (typeof urlOrBuffer === 'string' && urlOrBuffer.startsWith('http')) {
      const axios = (await import('axios')).default
      const response = await axios.get(urlOrBuffer, {
        responseType: 'arraybuffer',
      })
      fileData = Buffer.from(response.data)
    }

    const payload = {
      content: caption,
      files: [
        { attachment: fileData, name: filename, description: 'PDF file' },
      ],
    }
    if (buttons)
      payload.components = Array.isArray(buttons) ? buttons : [buttons]
    return this.event.channel.send(payload)
  }

  // --- Kick Member ---
  /**
   * Kick a member from the server.
   * @param {string|object} target - User ID or GuildMember object.
   * @param {string} [reason='Kicked by bot'] - Reason for kick.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async kickMember(target, reason = 'Kicked by bot') {
    let member = null
    if (target && typeof target.kick === 'function') {
      member = target
    } else if (typeof target === 'string' && this.event.guild) {
      try {
        member = await this.event.guild.members.fetch(target)
      } catch {}
    }
    if (member && typeof member.kick === 'function') {
      try {
        await member.kick(reason)
        return true
      } catch {
        return false
      }
    }
    return false
  }

  // --- Ban Member ---
  /**
   * Ban a member from the server.
   * @param {string|object} target - User ID or GuildMember object.
   * @param {string} [reason='Banned by bot'] - Reason for ban.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async banMember(target, reason = 'Banned by bot') {
    let member = null
    if (target && typeof target.ban === 'function') {
      member = target
    } else if (typeof target === 'string' && this.event.guild) {
      try {
        member = await this.event.guild.members.fetch(target)
      } catch {}
    }
    if (member && typeof member.ban === 'function') {
      try {
        await member.ban({ reason })
        return true
      } catch {
        return false
      }
    }
    return false
  }

  // --- Delete Message ---
  /**
   * Delete a message.
   * @param {string|object} [target] - Message ID or Discord.js Message object.
   * @returns {Promise<boolean>} True if successful, false otherwise.
   */
  async deleteMessage(target) {
    let message = target || this.event.message
    if (typeof message === 'string' && this.event.channel) {
      try {
        message = await this.event.channel.messages.fetch(message)
      } catch {}
    }
    if (message && typeof message.delete === 'function') {
      try {
        await message.delete()
        return true
      } catch {
        return false
      }
    }
    return false
  }

  // --- Chat Invite Link (TelegrafJS style) ---
  /**
   * Create a chat invite link for the current channel.
   * @param {object} [options={}] - Invite options (maxAge, maxUses, etc).
   * @returns {Promise<string>} Invite URL.
   */
  async chatInviteLink(options = {}) {
    if (
      !this.event.channel ||
      typeof this.event.channel.createInvite !== 'function'
    ) {
      throw new Error(
        'Channel does not support invites or bot lacks permission'
      )
    }
    const invite = await this.event.channel.createInvite({
      maxAge: options.maxAge ?? 3600,
      maxUses: options.maxUses ?? 1,
      temporary: options.temporary ?? false,
      unique: options.unique ?? true,
      reason: options.reason ?? 'Created by bot',
    })
    return invite.url
  }
}

/**
 * Context abstraction for DiscordBot events and replies.
 * @type {Context}
 */
export default Context
