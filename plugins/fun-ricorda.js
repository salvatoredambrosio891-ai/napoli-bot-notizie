const handler = async (m, { conn, text }) => {

if (!text) {
return m.reply(`⏰ *PROMEMORIA*

Uso:
.ricorda 16:23 messaggio`)
}

const args = text.split(" ")
const time = args.shift()
const message = args.join(" ")

if (!time || !message) {
return m.reply("⚠️ Formato corretto:\n.ricorda HH:MM messaggio")
}

const [hour, minute] = time.split(":").map(Number)

if (isNaN(hour) || isNaN(minute)) {
return m.reply("⚠️ Orario non valido")
}

const now = new Date()
const target = new Date()

target.setHours(hour)
target.setMinutes(minute)
target.setSeconds(0)

if (target < now) target.setDate(target.getDate() + 1)

const delay = target - now

const tag = `@${m.sender.split("@")[0]}`

m.reply(`╭─⏰ *PROMEMORIA PROGRAMMATO*
│
├ 👤 Utente: ${tag}
├ 🕒 Orario: ${time}
├ 💬 Messaggio:
│ ${message}
│
╰ Promemoria salvato ✔️`)

setTimeout(async () => {

let msg = await conn.sendMessage(m.chat,{
text:`⏳ *PROMEMORIA IN ARRIVO...*`
})

for (let i = 5; i > 0; i--) {

await new Promise(r => setTimeout(r,1000))

await conn.sendMessage(m.chat,{
text:`⏳ *PROMEMORIA IN ARRIVO...*

⌛ ${i} secondi`,
edit: msg.key
})

}

await conn.sendMessage(m.chat,{
text:`╔═══ ⏰ PROMEMORIA ⏰ ═══╗

👤 ${tag}

💬 ${message}

🕒 Orario: ${time}

╚════════════════════╝`,
mentions:[m.sender]
})

}, delay - 5000)

}

handler.help = ['ricorda']
handler.tags = ['utility']
handler.command = /^ricorda$/i

export default handler