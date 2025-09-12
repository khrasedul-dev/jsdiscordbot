// DiscordBot logger middleware
export default function logger() {
  return async (ctx, next) => {
    await next()
  }
}
