/**
 * Logger middleware for DiscordBot. Logs each event (stub).
 * @returns {function(Context, function):Promise<void>} Middleware function.
 */
export default function logger() {
  return async (ctx, next) => {
    // Add logging logic here if needed
    await next()
  }
}
