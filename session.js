// DiscordBot session middleware and stores
import fs from 'fs'

/**
 * In-memory session store for DiscordBot.
 * @class
 */
class MemorySessionStore {
  /**
   * Create a new MemorySessionStore.
   */
  constructor() {
    this.sessions = {}
  }
  /**
   * Get session data for a user.
   * @param {string} id - User ID.
   * @returns {Promise<object>} Session object.
   */
  async get(id) {
    return this.sessions[id] || {}
  }
  /**
   * Set session data for a user.
   * @param {string} id - User ID.
   * @param {object} session - Session object.
   * @returns {Promise<void>}
   */
  async set(id, session) {
    this.sessions[id] = session
  }
  /**
   * Clear session data for a user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  async clear(id) {
    delete this.sessions[id]
  }
}

/**
 * File-based session store for DiscordBot.
 * @class
 */
class FileSessionStore {
  /**
   * Create a new FileSessionStore.
   * @param {string} [filePath='sessions.json'] - Path to session file.
   */
  constructor(filePath = 'sessions.json') {
    this.filePath = filePath
    if (!fs.existsSync(this.filePath)) fs.writeFileSync(this.filePath, '{}')
  }
  _read() {
    return JSON.parse(fs.readFileSync(this.filePath, 'utf8'))
  }
  _write(sessions) {
    fs.writeFileSync(this.filePath, JSON.stringify(sessions, null, 2))
  }
  /**
   * Get session data for a user.
   * @param {string} id - User ID.
   * @returns {Promise<object>} Session object.
   */
  async get(id) {
    const sessions = this._read()
    return sessions[id] || {}
  }
  /**
   * Set session data for a user.
   * @param {string} id - User ID.
   * @param {object} session - Session object.
   * @returns {Promise<void>}
   */
  async set(id, session) {
    const sessions = this._read()
    sessions[id] = session
    this._write(sessions)
  }
  /**
   * Clear session data for a user.
   * @param {string} id - User ID.
   * @returns {Promise<void>}
   */
  async clear(id) {
    const sessions = this._read()
    delete sessions[id]
    this._write(sessions)
  }
}

/**
 * Session middleware for DiscordBot. Attaches session to context.
 * @param {object} [options] - Options for session store.
 * @param {string} [options.type='memory'] - Store type ('memory' or 'file').
 * @param {string} [options.filePath='sessions.json'] - Path to session file.
 * @returns {function(Context, function):Promise<void>} Middleware function.
 */
export function session(options = {}) {
  const { type = 'memory', filePath = 'sessions.json' } = options
  const store =
    type === 'file' ? new FileSessionStore(filePath) : new MemorySessionStore()
  return async (ctx, next) => {
    const chatId = ctx.chat?.id || ctx.from?.id || 'default'
    ctx.session = await store.get(chatId)
    await next()
    await store.set(chatId, ctx.session)
  }
}

/**
 * Session store classes for DiscordBot.
 * @type {FileSessionStore}
 */
export { FileSessionStore, MemorySessionStore }
