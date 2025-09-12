// Context abstraction for DiscordBot
class Context {
  constructor(bot, event, senderId) {
    this.bot = bot;
    this.chat = { id: senderId };
    this.text = event.content;
    this.event = event;
    this.session = {};
    this.scene = null;

    // Discord-specific: attachments, embeds, etc.
    this.attachments = event.attachments || [];
    this.images = this.attachments.filter((a) => a.type === 'image');
    this.files = this.attachments.filter((a) => a.type === 'file');
  }

  // --- Basic Reply ---
  async reply(textOrPayload, buttons = null) {
    let payload;
    if (typeof textOrPayload === 'string') {
      payload = { content: textOrPayload };
    } else if (textOrPayload && textOrPayload.content) {
      payload = { ...textOrPayload };
    } else {
      payload = { content: String(textOrPayload) };
    }

    if (buttons) payload.components = Array.isArray(buttons) ? buttons : [buttons];
    return this.event.channel.send(payload);
  }

  // --- Reply with Photo ---
  async replyWithPhoto(urlOrBuffer, caption = '', buttons = null) {
    let fileData = urlOrBuffer;
    let fileName = 'photo.jpg';

    if (typeof urlOrBuffer === 'string' && urlOrBuffer.startsWith('http')) {
      const axios = (await import('axios')).default;
      const response = await axios.get(urlOrBuffer, { responseType: 'arraybuffer' });
      fileData = Buffer.from(response.data);
      const urlParts = urlOrBuffer.split('/');
      fileName = urlParts[urlParts.length - 1] || fileName;
    }

    const payload = {
      content: caption,
      files: [{ attachment: fileData, name: fileName }],
    };
    if (buttons) payload.components = Array.isArray(buttons) ? buttons : [buttons];
    return this.event.channel.send(payload);
  }

  // --- Reply with Document ---
  async replyWithDocument(urlOrBuffer, filename = 'file', caption = '', buttons = null) {
    let fileData = urlOrBuffer;
    if (typeof urlOrBuffer === 'string' && urlOrBuffer.startsWith('http')) {
      const axios = (await import('axios')).default;
      const response = await axios.get(urlOrBuffer, { responseType: 'arraybuffer' });
      fileData = Buffer.from(response.data);
    }

    const payload = {
      content: caption,
      files: [{ attachment: fileData, name: filename }],
    };
    if (buttons) payload.components = Array.isArray(buttons) ? buttons : [buttons];
    return this.event.channel.send(payload);
  }

  // --- Reply with PDF ---
  async replyWithPDF(urlOrBuffer, filename = 'file.pdf', caption = '', buttons = null) {
    let fileData = urlOrBuffer;
    if (typeof urlOrBuffer === 'string' && urlOrBuffer.startsWith('http')) {
      const axios = (await import('axios')).default;
      const response = await axios.get(urlOrBuffer, { responseType: 'arraybuffer' });
      fileData = Buffer.from(response.data);
    }

    const payload = {
      content: caption,
      files: [{ attachment: fileData, name: filename, description: 'PDF file' }],
    };
    if (buttons) payload.components = Array.isArray(buttons) ? buttons : [buttons];
    return this.event.channel.send(payload);
  }

  // --- Kick Member ---
  async kickMember(target, reason = 'Kicked by bot') {
    let member = null;
    if (target && typeof target.kick === 'function') {
      member = target;
    } else if (typeof target === 'string' && this.event.guild) {
      try {
        member = await this.event.guild.members.fetch(target);
      } catch {}
    }
    if (member && typeof member.kick === 'function') {
      try {
        await member.kick(reason);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  // --- Ban Member ---
  async banMember(target, reason = 'Banned by bot') {
    let member = null;
    if (target && typeof target.ban === 'function') {
      member = target;
    } else if (typeof target === 'string' && this.event.guild) {
      try {
        member = await this.event.guild.members.fetch(target);
      } catch {}
    }
    if (member && typeof member.ban === 'function') {
      try {
        await member.ban({ reason });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  // --- Delete Message ---
  async deleteMessage(target) {
    let message = target || this.event.message;
    if (typeof message === 'string' && this.event.channel) {
      try {
        message = await this.event.channel.messages.fetch(message);
      } catch {}
    }
    if (message && typeof message.delete === 'function') {
      try {
        await message.delete();
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export default Context;
