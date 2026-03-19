// plugin restart.js by Bonzino

import fs from 'fs'
import path from 'path'

const RESTART_FILE = path.resolve('./tmp/restart-state.json')
const sleep = ms => new Promise(r => setTimeout(r, ms))

async function editMessage(conn, chatId, key, text, mentions = []) {
  await conn.relayMessage(
    chatId,
    {
      protocolMessage: {
        key,
        type: 14,
        editedMessage: {
          extendedTextMessage: {
            text,
            contextInfo: mentions.length ? { mentionedJid: mentions } : {}
          }
        }
      }
    },
    {}
  )
}

let handler = async (m, { conn, isOwner }) => {
  if (!isOwner) return m.reply('Solo il proprietario può usare questo comando.')

  let errors = 0

  try {
    fs.mkdirSync(path.dirname(RESTART_FILE), { recursive: true })

    const sent = await conn.sendMessage(
      m.chat,
      {
        text: '» Riavvio del bot...\n[░░░░░░░░░░]',
        mentions: [m.sender]
      },
      { quoted: m }
    )

    const key = sent?.key
    if (!key) throw new Error('Messaggio animazione non inviato correttamente')

    const frames = [
      '» Riavvio del bot...\n[█░░░░░░░░░]',
      '» Riavvio del bot...\n[██░░░░░░░░]',
      '» Riavvio del bot...\n[███░░░░░░░]',
      '» Riavvio del bot...\n[████░░░░░░]',
      '» Riavvio del bot...\n[█████░░░░░]',
      '» Riavvio del bot...\n[██████░░░░]',
      '» Riavvio del bot...\n[███████░░░]',
      '» Riavvio del bot...\n[████████░░]',
      '» Riavvio del bot...\n[█████████░]',
      '» Riavvio del bot...\n[██████████]'
    ]

    for (const frame of frames) {
      await sleep(180)
      await editMessage(conn, m.chat, key, frame, [m.sender])
    }

    const payload = {
      chat: m.chat,
      sender: m.sender,
      startedAt: Date.now(),
      errors
    }

    fs.writeFileSync(RESTART_FILE, JSON.stringify(payload, null, 2))

    process.exit(0)
  } catch (e) {
    errors++

    try {
      fs.mkdirSync(path.dirname(RESTART_FILE), { recursive: true })
      fs.writeFileSync(RESTART_FILE, JSON.stringify({
        chat: m.chat,
        sender: m.sender,
        startedAt: Date.now(),
        errors,
        lastError: String(e?.message || e)
      }, null, 2))
    } catch {}

    return m.reply(`» Riavvio fallito\n🧾 Errori: ${errors}`)
  }
}

handler.help = ['restart']
handler.tags = ['owner']
handler.command = ['restart','riavvia']
handler.owner = true

export default handler
