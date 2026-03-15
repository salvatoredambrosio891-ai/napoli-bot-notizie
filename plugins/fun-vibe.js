const userMessages = {}

const handler = async (m, { conn, text }) => {

  let target =
    m.mentionedJid?.[0] ||
    m.quoted?.sender ||
    m.sender

  let msgs = userMessages[target] || []

  if (m.sender === target && m.text) msgs.push(m.text)

  if (msgs.length === 0) {
    return m.reply("Non ho abbastanza messaggi da analizzare per questo utente.")
  }

  // Liste aggiornate
  const negativeWords = [
    "stupido","idiota","zitto","boh","bah","ridicolo","ma stai",
    "cretino","scemo","insensato","inutile","fallito"
  ]
  const aggressiveWords = [
    "cazzo","merda","fanculo","stronzo","idiota","vaffanculo",
    "bastardo","figlio di puttana","porco","troia","coglione","asshole"
  ]
  const positiveWords = [
    "grazie","ok","perfetto","bella","bravo","grande","top","lol",
    "ottimo","fantastico","bellissimo","eccellente"
  ]
  const jokeWords = ["😂","🤣","ahah","lol","xd","lmao","rofl"]

  let stats = { positivo:0, neutro:0, polemico:0, scherzoso:0, aggressivo:0 }
  let karma = 0

  msgs.forEach(msg => {
    let t = msg.toLowerCase()
    if (aggressiveWords.some(w => t.includes(w))) { stats.aggressivo++; karma -= 3 }
    else if (negativeWords.some(w => t.includes(w))) { stats.polemico++; karma -= 2 }
    else if (positiveWords.some(w => t.includes(w))) { stats.positivo++; karma += 2 }
    else if (jokeWords.some(w => t.includes(w))) { stats.scherzoso++; karma += 1 }
    else { stats.neutro++ }
  })

  karma = Math.max(-10, Math.min(10, karma))

  let vibe = "😐 Neutrale"
  if (karma >= 5) vibe = "✨ Positiva"
  if (karma <= -5) vibe = "⚠️ Polemica"

  let tag = `@${target.split("@")[0]}`

  await conn.sendMessage(m.chat,{
    text:`╭───〔 📊 VIBE ANALYSIS 〕───╮

👤 Utente: ${tag}

🧠 Vibe: *${vibe}*
⭐ Karma: *${karma}/10*

📊 Statistiche messaggi
• Positivi: ${stats.positivo}
• Neutri: ${stats.neutro}
• Polemici: ${stats.polemico}
• Aggressivi: ${stats.aggressivo}
• Scherzosi: ${stats.scherzoso}

💡 Suggerimento:
${karma <= -5 ? "L'utente potrebbe creare tensione." : "Conversazione normale."}

╰──────────────────────────╯`,
    mentions: [target]
  })

}

handler.help = ['vibe']
handler.tags = ['fun']
handler.command = /^vibe$/i

export default handler

export function before(m) {
  if (!m.text) return
  if (!userMessages[m.sender]) userMessages[m.sender] = []
  userMessages[m.sender].push(m.text)
  if (userMessages[m.sender].length > 50) userMessages[m.sender].shift()
}