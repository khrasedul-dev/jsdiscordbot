import 'dotenv/config'
import DiscordBot, { Markup, Scene, SceneManager, session } from '../index.js'

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
    './tests/test.png',
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
