let handler = async (m, { conn }) => {

let user = m.sender
if (!global.db.data.users[user]) global.db.data.users[user] = {}
let u = global.db.data.users[user]

if (!u.euro) u.euro = 0
if (!u.xp) u.xp = 0
if (!u.level) u.level = 1

const scenarios = [
{
txt:"👵 Una vecchietta ti vede e sorride.\n\n1️⃣ Chiedi gentilmente\n2️⃣ Ignori",
bonus:[randomNum(5,15),0]
},
{
txt:"🧔 Un uomo ti guarda sospettoso.\n\n1️⃣ Racconti la tua storia\n2️⃣ Fingi di nulla",
bonus:[randomNum(5,20),0]
},
{
txt:"👦 Un bambino ti offre delle monete.\n\n1️⃣ Accetti con gratitudine\n2️⃣ Rifiuti",
bonus:[randomNum(2,10),0]
},
{
txt:"💼 Una persona ti offre una banconota grande.\n\n1️⃣ Accetto\n2️⃣ Rifiuto",
bonus:[randomNum(15,30),0]
}
]

let ev = scenarios[Math.floor(Math.random()*scenarios.length)]

await conn.reply(m.chat,
`🙏 *ELEMSOINA*

${ev.txt}

Rispondi con *1* o *2*`,
m)

global.begChoice = global.begChoice || {}
global.begChoice[user] = ev

}

handler.command = /^beg|elemosina$/i
export default handler

// risposta scelta
export async function before(m,{ conn }){

let user = m.sender
if(!global.begChoice) return
if(!global.begChoice[user]) return

if(!/^[12]$/.test(m.text)) return

let ev = global.begChoice[user]
let choice = Number(m.text)-1
let bonus = ev.bonus[choice]

let u = global.db.data.users[user]

u.euro += bonus
let xpGain = randomNum(1,5)
u.xp += xpGain

let lvlUp = false
if(u.xp >= u.level*50){
u.level++
u.xp = 0
lvlUp = true
}

await conn.reply(m.chat,
`💰 Hai guadagnato *${bonus}€*

💶 Saldo: ${u.euro}€
🏅 Livello: ${u.level}
⭐ XP: ${u.xp}/${u.level*50}
${lvlUp ? "\n🎉 *LEVEL UP!*" : ""}`,
m)

delete global.begChoice[user]
}

// funzioni
function randomNum(min,max){
return Math.floor(Math.random()*(max-min+1))+min
}