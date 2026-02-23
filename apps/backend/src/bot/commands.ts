import { Telegraf } from 'telegraf'

export function setupCommands(bot: Telegraf) {
  const MINI_APP_URL = process.env.FRONTEND_URL!

  bot.start(ctx => {
    ctx.reply('👥 Hard Squad\n\nТолько 3 задачи в день. Твой squad видит всё.\n\nОткрой: ' + MINI_APP_URL)
  })

  bot.command('squad', async ctx => {
    const userId = ctx.from.id
    // Простой текстовый статус — полный статус в Mini App
    ctx.reply(
      'Открой Hard Squad чтобы увидеть статус своего squad 👇',
      {
        reply_markup: {
          inline_keyboard: [[
            { text: 'Открыть', web_app: { url: MINI_APP_URL } },
          ]],
        },
      }
    )
  })
}
