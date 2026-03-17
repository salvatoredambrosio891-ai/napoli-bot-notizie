import { execSync } from 'child_process'

let handler = async (m, { conn }) => {
  try {
    await conn.reply(m.chat, '🔄 Controllo aggiornamenti...', m)

    // --- mostro modifiche locali ---
    let status = execSync('git status --short', { encoding: 'utf-8' })
    let changes = status ? `📌 Modifiche locali:\n${status}` : '✅ Nessuna modifica locale'

    // --- mostro commit che verranno applicati dal pull ---
    let commits = execSync('git log HEAD..origin/main --oneline', { encoding: 'utf-8' })
    let pending = commits ? `📝 Commit in arrivo:\n${commits}` : '✅ Nessun commit da applicare'

    let preMsg = `${changes}\n\n${pending}`
    await conn.reply(m.chat, preMsg, m)

    // --- eseguo pull ---
    let update = execSync('git fetch origin && git reset --hard origin/main && git pull', { encoding: 'utf-8' })

    await conn.reply(m.chat, `✅ Aggiornamento completato!\n\n${update}`, m)
    await m.react('✅')

  } catch (err) {
    await conn.reply(m.chat, `❌ Errore durante aggiornamento:\n\n${err.message}`, m)
    await m.react('❌')
  }
}

handler.help = ['aggiorna']
handler.tags = ['owner']
handler.command = ['aggiorna', 'update', 'aggiornabot']
handler.owner = true

export default handler