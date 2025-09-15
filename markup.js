/**
 * Markup utility for creating Discord message components (buttons, keyboards).
 * @example
 * // Positional arguments:
 * Markup.button('Label', 'button', 'ID', 'PRIMARY')
 * Markup.button('Label', 'url', 'https://example.com')
 * // Object argument:
 * Markup.button({ label: 'Label', type: 'url', idOrUrl: 'https://example.com' })
 * Markup.button({ label: 'Label', idOrUrl: 'ID', style: 'SUCCESS' })
 */
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js'

/**
 * Utility class for building Discord message components.
 */
class Markup {
  // button(label, type, idOrUrl, style) or button({ label, type, idOrUrl, style })
  /**
   * Create a Discord button component.
   * @param {string|object} label - Button label or options object.
   * @param {string} [type='button'] - 'button' for normal, 'url' for link button.
   * @param {string} [idOrUrl] - Custom ID for button or URL for link button.
   * @param {string} [style='PRIMARY'] - Button style ('PRIMARY', 'SECONDARY', etc).
   * @returns {ButtonBuilder} Discord.js ButtonBuilder instance.
   */
  static button(...args) {
    let label, type, idOrUrl, style
    if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null) {
      // Object argument
      ;({ label, type = 'button', idOrUrl, style = 'PRIMARY' } = args[0])
    } else {
      // Positional arguments
      ;[label, type = 'button', idOrUrl, style = 'PRIMARY'] = args
    }
    const styleMap = {
      PRIMARY: ButtonStyle.Primary,
      SECONDARY: ButtonStyle.Secondary,
      SUCCESS: ButtonStyle.Success,
      DANGER: ButtonStyle.Danger,
      LINK: ButtonStyle.Link,
    }
    const button = new ButtonBuilder().setLabel(label)
    if (type === 'url') {
      button.setStyle(ButtonStyle.Link)
      button.setURL(idOrUrl)
    } else {
      button.setCustomId(idOrUrl)
      button.setStyle(styleMap[style] ?? ButtonStyle.Primary)
    }
    return button
  }

  /**
   * Create a Discord keyboard (array of button rows).
   * @param {Array<Array<ButtonBuilder>>} buttonRows - Array of button rows.
   * @returns {Array<ActionRowBuilder>|undefined} Array of ActionRowBuilder or undefined if no rows.
   */
  static keyboard(buttonRows = []) {
    // If no rows provided, return undefined so ctx.reply works without buttons
    if (!buttonRows.length) return undefined
    return buttonRows.map((row) => new ActionRowBuilder().addComponents(...row))
  }
}

/**
 * Markup utility for Discord message components.
 * @type {Markup}
 */
export default Markup
