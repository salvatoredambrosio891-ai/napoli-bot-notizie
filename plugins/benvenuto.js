import { WAMessageStubType } from '@realvare/baileys'

let handler = m => m

handler.before = async function (m, { conn, groupMetadata }) {
  if (!m.isGroup || !m.messageStubType) return false

  const chat = global.db?.data?.chats?.[m.chat]
  if (!chat || (!chat.welcome && !chat.goodbye)) return false

  const isAdd = m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_ADD
  const isRemove =
    m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_REMOVE ||
    m.messageStubType === WAMessageStubType.GROUP_PARTICIPANT_LEAVE

  if (!isAdd && !isRemove) return false

  const who = m.messageStubParameters?.[0]
  if (!who) return false

  const jid = conn.decodeJid(who)
  const cleanUserId = jid.split('@')[0]
  const groupName = groupMetadata?.subject || 'Gruppo'

  let text

  if (isRemove && chat.goodbye) {
    text = `
@${cleanUserId} 𝐡𝐚 𝐚𝐛𝐛𝐚𝐧𝐝𝐨𝐧𝐚𝐭𝐨 𝐢𝐥 𝐠𝐫𝐮𝐩𝐩𝐨
`
  }

  if (isAdd && chat.welcome) {
    text = `
@${cleanUserId} 𝐁𝐞𝐧𝐯𝐞𝐧𝐮𝐭𝐨 𝐬𝐮 ${groupName}
`
  }

  if (!text) return false

  await conn.sendMessage(
    m.chat,
    {
      text: text.trim(),
      mentions: [jid]
    },
    { quoted: m }
  )

  return true
}

export default handler