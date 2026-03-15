global.begSession = global.begSession || {}

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

let handler = async (m,{conn,command})=>{

const user = m.sender

if(!global.db.data.users[user])
global.db.data.users[user] = {euro:0,xp:0,level:1}

const u = global.db.data.users[user]

if(command === "elemosina" || command === "beg"){

let ev = scenarios[Math.floor(Math.random()*scenarios.length)]

global.begSession[user] = {
step:"choice",
event:ev
}

let txt = `🙏 *ELEMOSINA*\n\n`
txt += `${ev.txt}\n\n`
txt += `💰 Soldi: ${u.euro}€\n`
txt += `_Scrivi 1 o 2_`

return conn.reply(m.chat,txt,m)

}

}

/* ===== RISPOSTA ===== */

handler.before = async (m,{conn})=>{

const user = m.sender
const input = m.text?.trim()

if(!global.begSession[user]) return

const session = global.begSession[user]
const u = global.db.data.users[user]

if(session.step === "choice" && /^[12]$/.test(input)){

let ev = session.event
let choice = input-1
let bonus = ev.bonus[choice]

u.euro += bonus

let xpGain = randomNum(1,5)
u.xp += xpGain

let lvlUp = false

if(u.xp >= u.level*50){
u.level++
u.xp = 0
lvlUp = true
}

delete global.begSession[user]

let msg = `💰 Hai ricevuto *${bonus}€*\n\n`
msg += `💶 Soldi totali: ${u.euro}€\n`
msg += `🏅 Livello: ${u.level}\n`
msg += `⭐ XP: ${u.xp}/${u.level*50}`

if(lvlUp) msg += `\n\n🎉 *LEVEL UP!*`

return conn.reply(m.chat,msg,m)

}

}

handler.command = /^(beg|elemosina)$/i

export default handler

function randomNum(min,max){
return Math.floor(Math.random()*(max-min+1))+min
}