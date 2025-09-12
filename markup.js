import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

class Markup {
  static button(label, customId, style = 'PRIMARY') {
    const styleMap = {
      PRIMARY: ButtonStyle.Primary,
      SECONDARY: ButtonStyle.Secondary,
      SUCCESS: ButtonStyle.Success,
      DANGER: ButtonStyle.Danger,
      LINK: ButtonStyle.Link,
    }
    return new ButtonBuilder()
      .setCustomId(customId)
      .setLabel(label)
      .setStyle(styleMap[style] ?? ButtonStyle.Primary)
  }

  static keyboard(buttonRows = []) {
    // If no rows provided, return undefined so ctx.reply works without buttons
    if (!buttonRows.length) return undefined
    return buttonRows.map((row) => new ActionRowBuilder().addComponents(...row))
  }
}

export default Markup
