import { performance } from "perf_hooks"

const S = v => String(v || '')
const tag = (jid = '') => '@' + S(jid).split('@')[0].split(':')[0]

function boldUnicode(s = '') {
  let o = ''
  for (const ch of s) {
    const c = ch.codePointAt(0)
    if (c >= 0x41 && c <= 0x5a) o += String.fromCodePoint(0x1D400 + (c - 0x41))
    else if (c >= 0x61 && c <= 0x7a) o += String.fromCodePoint(0x1D41A + (c - 0x61))
    else if (c >= 0x30 && c <= 0x39) o += String.fromCodePoint(0x1D7CE + (c - 0x30))
    else o += ch
  }
  return o
}

const buildContextMsg = (title) => ({
  key: { participants: '0@s.whatsapp.net', fromMe: false, id: 'CTX' },
  message: { locationMessage: { name: boldUnicode(title) } },
  participant: '0@s.whatsapp.net'
})

function resolveTarget(m) {
  const ctx = m.message?.extendedTextMessage?.contextInfo || {}
  if (Array.isArray(m.mentionedJid) && m.mentionedJid.length) return m.mentionedJid[0]
  if (Array.isArray(ctx.mentionedJid) && ctx.mentionedJid.length) return ctx.mentionedJid[0]
  if (m.quoted?.sender) return m.quoted.sender
  if (m.quoted?.participant) return m.quoted.participant
  if (ctx.participant) return ctx.participant
  return null
}

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
            contextInfo: mentions && mentions.length ? { mentionedJid: mentions } : {}
          }
        }
      }
    },
    {}
  )
}

let handler = async (m, { conn }) => {
  try {
    const chat = m.chat || m.key?.remoteJid
    if (!chat) return

    const sender = S(
      m.sender ||
      m.key?.participant ||
      m.participant ||
      (m.key?.fromMe ? conn?.user?.id : m.key?.remoteJid) ||
      ''
    )

    let target = resolveTarget(m)

    if (!target && String(chat).endsWith('@g.us')) {
      try {
        const md = await conn.groupMetadata(chat).catch(() => null)
        const pool = (md?.participants || []).map(p => p.id || p.jid).filter(Boolean)
        if (pool.length) target = pool[Math.floor(Math.random() * pool.length)]
      } catch {}
    }

    if (!target) {
      const q = buildContextMsg('*ditalino*')
      await conn.sendMessage(chat, {
        text: `${boldUnicode('*⚠️ Devi menzionare qualcuno o rispondere a un messaggio!*')}\n\n${boldUnicode('Esempio:')}\n\n${boldUnicode('.ditalino @utente')}`
      }, { quoted: q })
      return
    }

    const qAnim = buildContextMsg('*ditalino*')
    const seq = [
      boldUnicode('🤟🏻 Ora faccio un ditalino a quella troia di ') + tag(target) + boldUnicode('...'),
      boldUnicode('🤟🏻🤤 Le sto sfondando la figa...'),
      boldUnicode('🤟🏻🥵 Sento come gode la troia...'),
      boldUnicode('"😍 Ohhsy continua, ahh, ahh"'),
      boldUnicode('"😍 Non fermarti!, ahh, ahh"'),
      boldUnicode('🤟🏻🤤 Ci siamo quasi...'),
      boldUnicode('🤟🏻🤤 La troia sta per venire...'),
      boldUnicode('"😍😍 AHHH!!, AHHH!!"'),
      boldUnicode('😎 La troia è venuta..'),
      boldUnicode('💦 Attenzione alla cascata!')
    ]

    const start = performance.now()
    const sent = await conn.sendMessage(chat, { text: `*${seq[0]}*`, mentions: [target] }, { quoted: qAnim })
    const key = sent?.key
    if (!key) return

    await new Promise(r => setTimeout(r, 1500))
    for (let i = 1; i < seq.length; i++) {
      await editMessage(conn, chat, key, `*${seq[i]}*`, [target])
      await new Promise(r => setTimeout(r, 1000))
    }

    const sec = ((performance.now() - start) / 1000).toFixed(2)
    const caption = `*${tag(sender)} ${boldUnicode('ha fatto venire')} ${tag(target)} ${boldUnicode(`in ${sec} secondi! 💦`)}*`

    await conn.sendMessage(
      chat,
      {
        text: caption,
        mentions: [sender, target]
      },
      { quoted: buildContextMsg('*ditalino*') }
    )

  } catch (e) {
    console.error('ditalino error:', e)
  }
}

handler.help = ['ditalino @utente (o reply)']
handler.tags = ['fun']
handler.command = ['ditalino', 'dtrd']
handler.group = true

export default handler
