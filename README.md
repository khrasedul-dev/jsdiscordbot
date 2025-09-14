A **Telegraf-inspired framework** for building **Discord bots** with modern **scene** and **session** management.

## 💖 Support My Work

If you enjoy my projects and want to support me, you can donate using **crypto** 🚀

---

### 🌍 Wallet Addresses

| Coin | Network | Address |
|------|---------|---------|
| 🟠 **Bitcoin (BTC)** | Bitcoin | `1PouA4hPvM4sgg26RbbevBuG3JVF2yGiTt` |
| 🔵 **Ethereum (ETH)** | ERC20 | `0x35e743344347b02e0071e8ec2a9850ec4fc879f2` |
| 🟢 **Tether (USDT)** | TRC20 | `TWUbLudtqA65r6tFXrhBigVxgH22GikMct` |
| 🟢 **Tether (USDT)** | ERC20 | `0x35e743344347b02e0071e8ec2a9850ec4fc879f2` |

---

### 🔗 Quick Donate Links

[![Donate Bitcoin](https://img.shields.io/badge/Bitcoin-Donate-orange?logo=bitcoin&style=for-the-badge)](bitcoin:1PouA4hPvM4sgg26RbbevBuG3JVF2yGiTt)
[![Donate Ethereum](https://img.shields.io/badge/Ethereum-Donate-blue?logo=ethereum&style=for-the-badge)](ethereum:0x35e743344347b02e0071e8ec2a9850ec4fc879f2)
[![Donate USDT](https://img.shields.io/badge/USDT-Donate-green?logo=tether&style=for-the-badge)](https://tronscan.org/#/address/TWUbLudtqA65r6tFXrhBigVxgH22GikMct)

---

✨ Thank you for your support — it really means a lot! 🙏


## Features

- Step-by-step **scene system** (Wizard-like)
- In-memory and file-based **session storage**
- **Middleware-based architecture**
- Simple API for **commands**, **actions**, and **media**
- Persistent sessions (optional)
- Clean, modern codebase
- Discord.js v14+ compatible

## Installation

```bash
npm install jsdiscordbot
```

## API

### DiscordBot

- `command(cmd, fn)` — Register a command handler (exact, regex, or array)
- `action(payload, fn)` — Register a button/action handler (exact, regex, or array)
- `hears(pattern, fn)` — Register a message handler (exact, regex, or array)
- `use(middleware)` — Add middleware
- `launch()` — Start the bot

### Scene System

- `Scene(name, steps[])` — Create a scene
- `SceneManager()` — Manage and register scenes
- `scenes.register(scene)` — Register a scene
- `scenes.middleware()` — Scene middleware
- `scenes.enter('sceneName')` — Enter a scene

### Session Middleware

- `session({ type: 'file' })` — Use file-based session (default is in-memory)

### Markup (Buttons, Keyboards, Media)

Import Markup:

```js
import { Markup } from 'jsdiscordbot'
```

#### Buttons/Keyboard

```js
await ctx.reply(
  'Choose an option:',
  Markup.keyboard([
    [
      Markup.button('Yes', 'YES', 'PRIMARY'),
      Markup.button('No', 'NO', 'DANGER'),
    ],
  ])
)
```

#### Media Replies

```js
await ctx.replyWithPhoto('https://example.com/photo.jpg', 'Photo!', Markup.keyboard(...))
await ctx.replyWithDocument('https://example.com/file.pdf', 'Document!', Markup.keyboard(...))
```

#### Handling Actions

```js
bot.action('YES', (ctx) => ctx.reply('You clicked Yes!'))
bot.action(/LIKE|DISLIKE/, (ctx) => ctx.reply('You clicked Like or Dislike!'))
bot.action(['A', 'B'], (ctx) => ctx.reply('You clicked A or B!'))
```

### Chat Invite Link

Create a Discord chat invite link for the current channel (like TelegrafJS):

```js
// Create an invite link for up to 10 users (link expires after 10 uses)
const inviteUrl = await ctx.chatInviteLink({ maxUses: 10 })
await ctx.reply(`Invite link: ${inviteUrl}`)
```

**Options:**

- `maxUses`: Maximum number of users who can join with the link (default: 1)
- `maxAge`: Link expiration time in seconds (default: 3600)
- `temporary`: Grant temporary membership (default: false)
- `unique`: Create a unique invite (default: true)
- `reason`: Reason for invite creation

After the specified number of users join, the link becomes invalid automatically.

## Example: Registration Scene

```js
const registrationScene = new Scene('registration', [
  async (ctx) => {
    await ctx.reply('Welcome to registration! What is your first name?')
  },
  async (ctx) => {
    if (!ctx.text) {
      await ctx.reply('Please enter your first name.')
      return false
    }
    ctx.session.firstName = ctx.text
    await ctx.reply('What is your last name?')
  },
  async (ctx) => {
    if (!ctx.text) {
      await ctx.reply('Please enter your last name.')
      return false
    }
    ctx.session.lastName = ctx.text
    await ctx.reply('What is your email address?')
  },
  async (ctx) => {
    if (!ctx.text || !/\S+@\S+\.\S+/.test(ctx.text)) {
      await ctx.reply('Please enter a valid email address.')
      return false
    }
    ctx.session.email = ctx.text
    await ctx.reply(
      `Registration complete!\nFirst Name: ${ctx.session.firstName}\nLast Name: ${ctx.session.lastName}\nEmail: ${ctx.session.email}`
    )
    await registrationScene.leave(ctx)
  },
])

const scenes = new SceneManager()
scenes.register(registrationScene)
bot.use(session())
bot.use(scenes.middleware())
bot.command('/register', async (ctx) => {
  await registrationScene.enter(ctx)
})
```

## Event System

Handle all incoming messages and button actions:

```js
bot.on('message', async (ctx) => {
  console.log('Received message:', ctx.text)
})

bot.on('action', async (ctx) => {
  console.log('Button clicked:', ctx.payload)
})
```

## Example: Simple Bot

```js
import 'dotenv/config'
import DiscordBot, { Markup, Scene, SceneManager, session } from 'jsdiscordbot'

const testPhotoUrl = 'https://www.w3schools.com/w3images/lights.jpg'
const testDocUrl =
  'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
const testAudioUrl =
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
const testVideoUrl = 'https://www.w3schools.com/html/mov_bbb.mp4'

const bot = new DiscordBot({
  token: process.env.DISCORD_BOT_TOKEN,
})

bot.catch(async (err, ctx) => {
  console.error('Global error:', err)
  if (ctx && ctx.reply) {
    await ctx.reply('An error occurred: ' + err.message)
  }
})

const registrationScene = new Scene('registration', [
  async (ctx) => {
    await ctx.reply('Welcome to registration! What is your first name?')
  },
  async (ctx) => {
    if (!ctx.text) return false
    ctx.session.firstName = ctx.text
    await ctx.reply('What is your last name?')
  },
  async (ctx) => {
    if (!ctx.text) {
      await ctx.reply('Please enter your last name.')
      return false
    }
    ctx.session.lastName = ctx.text
    await ctx.reply('What is your email address?')
  },
  async (ctx) => {
    if (!ctx.text || !/\S+@\S+\.\S+/.test(ctx.text)) {
      await ctx.reply('Please enter a valid email address.')
      return false
    }
    ctx.session.email = ctx.text
    await ctx.reply(
      `Registration complete!\nFirst Name: ${ctx.session.firstName}\nLast Name: ${ctx.session.lastName}\nEmail: ${ctx.session.email}`
    )
    await registrationScene.leave(ctx)
  },
])

const sceneManager = new SceneManager()
sceneManager.register(registrationScene)
bot.use(session())
bot.use(sceneManager.middleware())

bot.hears(['register', '/register'], async (ctx) => {
  await registrationScene.enter(ctx)
})

bot.command('/photo', async (ctx) => {
  await ctx.replyWithPhoto(
    testPhotoUrl,
    'Here is a photo with buttons!',
    Markup.keyboard([
      [
        Markup.button('Like', 'LIKE', 'PRIMARY'),
        Markup.button('Dislike', 'DISLIKE', 'DANGER'),
      ],
    ])
  )
})

bot.command('/document', async (ctx) => {
  await ctx.replyWithDocument(
    testDocUrl,
    'dummy.pdf',
    'Here is a document with buttons!',
    Markup.keyboard([[Markup.button('Download', 'DOWNLOAD', 'SUCCESS')]])
  )
})

bot.command('/pdf', async (ctx) => {
  await ctx.replyWithPDF(
    testDocUrl,
    'dummy.pdf',
    'Here is a PDF with buttons!',
    Markup.keyboard([[Markup.button('Open PDF', 'OPEN_PDF', 'PRIMARY')]])
  )
})

bot.command('/audio', async (ctx) => {
  await ctx.replyWithDocument(
    testAudioUrl,
    'test-audio.mp3',
    'Here is an audio file with buttons!',
    Markup.keyboard([[Markup.button('Play', 'PLAY_AUDIO', 'SUCCESS')]])
  )
})

bot.command('/video', async (ctx) => {
  await ctx.replyWithDocument(
    testVideoUrl,
    'test-video.mp4',
    'Here is a video file with buttons!',
    Markup.keyboard([[Markup.button('Play', 'PLAY_VIDEO', 'PRIMARY')]])
  )
})

bot.command('/kick', async (ctx) => {
  const args = ctx.text?.split(' ')
  const userId = args && args[1]
  if (!userId) {
    await ctx.reply('Usage: /kick <userId>')
    return
  }
  const success = await ctx.kickMember(userId, 'Kicked by bot command')
  if (success) {
    await ctx.reply(`User ${userId} was kicked.`)
  } else {
    await ctx.reply(`Failed to kick user ${userId}.`)
  }
})

bot.command('/ban', async (ctx) => {
  const args = ctx.text?.split(' ')
  const userId = args && args[1]
  if (!userId) {
    await ctx.reply('Usage: /ban <userId>')
    return
  }
  const success = await ctx.banMember(userId, 'Banned by bot command')
  if (success) {
    await ctx.reply(`User ${userId} was banned.`)
  } else {
    await ctx.reply(`Failed to ban user ${userId}.`)
  }
})

bot.hears(['hello', 'hi'], async (ctx) => {
  await ctx.reply('Hello! How can I assist you today?')
})

bot.command('/keyboard', async (ctx) => {
  await ctx.reply(
    'Choose an option:',
    Markup.keyboard([
      [
        Markup.button('Yes', 'YES', 'PRIMARY'),
        Markup.button('No', 'NO', 'DANGER'),
      ],
    ])
  )
})

bot.action('YES', async (ctx) => {
  if (ctx.event && typeof ctx.event.reply === 'function') {
    await ctx.event.reply({ content: 'You clicked Yes!', ephemeral: true })
  } else {
    await ctx.reply('You clicked Yes!')
  }
  await ctx.deleteMessage()
})

bot.action('NO', async (ctx) => {
  if (ctx.event && typeof ctx.event.reply === 'function') {
    await ctx.event.reply({ content: 'You clicked No!', ephemeral: true })
  } else {
    await ctx.reply('You clicked No!')
  }
  await ctx.deleteMessage()
})

bot.on('new_member', async (ctx) => {
  await ctx.reply(`Welcome <@${ctx.event.id}> to the server!`)
})

bot.on('remove_member', async (ctx) => {
  await ctx.reply(`Goodbye <@${ctx.event.id}>!`)
})

bot.on('message_reaction_add', async (ctx) => {
  await ctx.reply(`Reaction added by <@${ctx.event.id}>!`)
})

bot.on('message_reaction_remove', async (ctx) => {
  await ctx.reply(`Reaction removed by <@${ctx.event.id}>!`)
})

// --- Exact string match ---
bot.hears('ping', async (ctx) => {
  await ctx.reply('pong (exact string match)')
})

bot.command('echo', async (ctx) => {
  await ctx.reply('Echo command triggered (exact string match)')
})

bot.action('EXACT_ACTION', async (ctx) => {
  if (ctx.event && typeof ctx.event.reply === 'function') {
    await ctx.event.reply({ content: 'Exact action matched!', ephemeral: true })
  } else {
    await ctx.reply('Exact action matched!')
  }
})

// --- Regex match ---
bot.hears(/\d{4}/, async (ctx) => {
  await ctx.reply('Matched a 4-digit number (regex)')
})

bot.command(/test.*/, async (ctx) => {
  await ctx.reply('Test command triggered (regex)')
})

bot.action(/REGEX_.*/, async (ctx) => {
  if (ctx.event && typeof ctx.event.reply === 'function') {
    await ctx.event.reply({ content: 'Regex action matched!', ephemeral: true })
  } else {
    await ctx.reply('Regex action matched!')
  }
})

// --- Array match ---
bot.hears(['foo', 'bar'], async (ctx) => {
  await ctx.reply('Matched foo or bar (array)')
})

bot.command(['multi1', 'multi2'], async (ctx) => {
  await ctx.reply('Multi command triggered (array)')
})

bot.action(['ACTION1', 'ACTION2'], async (ctx) => {
  if (ctx.event && typeof ctx.event.reply === 'function') {
    await ctx.event.reply({ content: 'Array action matched!', ephemeral: true })
  } else {
    await ctx.reply('Array action matched!')
  }
})

bot.on('message', async (ctx) => {
  console.log(`Received message: ${ctx.text}`)
})

bot.launch()
```

## Custom Express Hosting

You can host DiscordBot with your own Express app :

```js
import express from 'express'
import DiscordBot from 'jsdiscordbot'

const bot = new DiscordBot({
  /* ...config... */
})

const app = express()
app.use(express.json())

// Mount Messenger webhook route
app.use('/webhook', bot.app)

// Start your own server
app.listen(3000, () => {
  console.log('Custom Express server running on port 3000')
})
```

Do not use `bot.launch()` if you want full control over your Express server.

## License

MIT

## Author

KH Rasedul — [rasedul.dev@gmail.com](mailto:rasedul.dev@gmail.com)
