// Plugin aggiorna by 𝕯𝖊ⱥ𝖉𝖑𝐲 e Bonzino
import { execSync } from 'child_process'

let handler = async (m, { conn }) => {
  try {
    await conn.reply(m.chat, '*🔄 𝐂𝐨𝐧𝐭𝐫𝐨𝐥𝐥𝐨 𝐚𝐠𝐠𝐢𝐨𝐫𝐧𝐚𝐦𝐞𝐧𝐭𝐢...*', m)

    execSync('git fetch origin', { encoding: 'utf-8' })

    const diffStat = execSync('git diff --stat HEAD origin/main', {
      encoding: 'utf-8'
    })

    const diffStatus = execSync('git diff --name-status HEAD origin/main', {
      encoding: 'utf-8'
    })

    const statMap = {}
    diffStat
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.includes('|'))
      .forEach(line => {
        const [file, changesRaw] = line.split('|').map(s => s.trim())
        const plus = (changesRaw.match(/\+/g) || []).length
        const minus = (changesRaw.match(/-/g) || []).length
        statMap[file] = { plus, minus }
      })

    const updatedFiles = diffStatus
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => {
        const parts = line.split('\t')
        const status = parts[0]
        const oldPath = parts[1]
        const newPath = parts[2]

        if (status.startsWith('R')) {
          const stats = statMap[newPath] || statMap[oldPath] || { plus: 0, minus: 0 }
          return `🔁 ${oldPath} → ${newPath} (+${stats.plus}/-${stats.minus})`
        }

        if (status === 'A') {
          const stats = statMap[oldPath] || { plus: 0, minus: 0 }
          return `🟢 ${oldPath} (+${stats.plus}/-${stats.minus})`
        }

        if (status === 'D') {
          const stats = statMap[oldPath] || { plus: 0, minus: 0 }
          return `🔴 ${oldPath} (+${stats.plus}/-${stats.minus})`
        }

        const stats = statMap[oldPath] || { plus: 0, minus: 0 }
        return `📄 ${oldPath} (+${stats.plus}/-${stats.minus})`
      })

    const update = execSync('git reset --hard origin/main && git pull', {
      encoding: 'utf-8'
    })

    let resultMsg = '*✅ 𝐀𝐠𝐠𝐢𝐨𝐫𝐧𝐚𝐦𝐞𝐧𝐭𝐨 𝐜𝐨𝐦𝐩𝐥𝐞𝐭𝐚𝐭𝐨!*'

    if (updatedFiles.length > 0) {
      resultMsg += `\n\n📦 *𝐅𝐢𝐥𝐞 𝐚𝐠𝐠𝐢𝐨𝐫𝐧𝐚𝐭𝐢:* ${updatedFiles.length}\n\n${updatedFiles.join('\n')}`
    } else {
      resultMsg += '\n\nℹ️ *𝐍𝐞𝐬𝐬𝐮𝐧 𝐟𝐢𝐥𝐞 𝐝𝐚 𝐚𝐠𝐠𝐢𝐨𝐫𝐧𝐚𝐫𝐞*'
    }

    await conn.reply(m.chat, resultMsg, m)
    await m.react('✅')

  } catch (err) {
    await conn.reply(
      m.chat,
      `*❌ 𝐄𝐫𝐫𝐨𝐫𝐞 𝐝𝐮𝐫𝐚𝐧𝐭𝐞 𝐚𝐠𝐠𝐢𝐨𝐫𝐧𝐚𝐦𝐞𝐧𝐭𝐨:*\n\n${err.message}`,
      m
    )
    await m.react('❌')
  }
}

handler.help = ['aggiorna']
handler.tags = ['owner']
handler.command = /^(aggiorna|update|aggiornabot)$/i
handler.owner = true

export default handler
