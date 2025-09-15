// DiscordBot simple file-based session store
import fs from 'fs'
const SESSION_FILE = 'sessions.json'

/**
 * Read all sessions from the session file.
 * @returns {object} Sessions object.
 */
function readSessions() {
  if (!fs.existsSync(SESSION_FILE)) return {}
  return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'))
}

/**
 * Write all sessions to the session file.
 * @param {object} sessions - Sessions object.
 */
function writeSessions(sessions) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2))
}

/**
 * File-based session store for DiscordBot.
 * @type {{ get: function(string):Promise<object>, set: function(string, object):Promise<void> }}
 */
export const sessionStore = {
  /**
   * Get session data for a user.
   * @param {string} id - User ID.
   * @returns {Promise<object>} Session object.
   */
  async get(id) {
    const sessions = readSessions()
    return sessions[id] || {}
  },
  /**
   * Set session data for a user.
   * @param {string} id - User ID.
   * @param {object} session - Session object.
   * @returns {Promise<void>}
   */
  async set(id, session) {
    const sessions = readSessions()
    sessions[id] = session
    writeSessions(sessions)
  },
}
