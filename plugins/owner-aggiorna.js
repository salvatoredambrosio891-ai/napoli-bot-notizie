import { execSync } from 'child_process'

let handler = async (m, { conn }) => {
  try {

    await conn.reply(m.chat, '🔄 Controllo aggiornamenti...', m)

    let update = execSync(
      'git fetch origin && git reset --hard origin/main && git pull',
      { encoding: 'utf-8' }
    )

    await conn.reply(
      m.chat,
      `✅ Aggiornamento completato!\n\n${update}`,
      m
    )

    await m.react('✅')

  } catch (err) {

    await conn.reply(
      m.chat,
      `❌ Errore durante aggiornamento:\n\n${err.message}`,
      m
    )

    await m.react('❌')
  }
}

handler.help = ['aggiorna']
handler.tags = ['owner']
handler.command = ['aggiorna', 'update', 'aggiornabot']
handler.owner = true

export default handler