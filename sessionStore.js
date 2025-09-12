// DiscordBot simple file-based session store
import fs from 'fs'
const SESSION_FILE = 'sessions.json'

function readSessions() {
  if (!fs.existsSync(SESSION_FILE)) return {}
  return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'))
}

function writeSessions(sessions) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(sessions, null, 2))
}

export const sessionStore = {
  async get(id) {
    const sessions = readSessions()
    return sessions[id] || {}
  },
  async set(id, session) {
    const sessions = readSessions()
    sessions[id] = session
    writeSessions(sessions)
  },
}
