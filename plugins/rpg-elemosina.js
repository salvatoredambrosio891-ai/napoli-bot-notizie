let handler = async (m, { conn }) => {
    let user = m.sender
    if (!global.db.data.users[user]) global.db.data.users[user] = {}
    let u = global.db.data.users[user]
    if (!u.euro) u.euro = 0
    if (!u.xp) u.xp = 0
    if (!u.level) u.level = 1

    // Mini-storia elemosina
    const scenarios = [
        {txt:"👵 Una vecchietta ti vede e sorride. Cosa fai?", options:["Chiedi gentilmente","Ignori"], bonus:[randomNum(5,15),0]},
        {txt:"🧔 Un uomo ti guarda sospettoso. Cosa fai?", options:["Racconti la tua storia","Fingi di nulla"], bonus:[randomNum(5,20),0]},
        {txt:"👦 Un bambino ti offre delle monete. Cosa fai?", options:["Accetti con gratitudine","Rifiuti"], bonus:[randomNum(2,10),0]},
        {txt:"💼 Una persona ti dà una banconota grande ma vuole un favore. Accetti?", options:["Accetto","Rifiuto"], bonus:[randomNum(15,30),0]},
    ]

    // scegli 2 scenari casuali
    let chosen = shuffle(scenarios).slice(0,2)
    let total = 0

    await conn.sendMessage(m.chat,{ text:"🙏 Ti metti a chiedere l'elemosina..." }, { quoted:m })

    for (let ev of chosen){
        // crea i bottoni
        let buttons = ev.options.map((o,i)=>({buttonId:`beg_choice_${i}`, buttonText:{displayText:o}, type:1}))

        await conn.sendMessage(m.chat,{
            text: ev.txt,
            buttons,
            headerType:1
        })

        // attesa scelta utente
        let choice = await new Promise(resolve => {
            let handlerChoice = async (msg) => {
                if(msg.sender !== user) return
                let id = parseInt(msg.text.replace(/\D/g,'')) || 0
                resolve(id)
                conn.removeListener('message', handlerChoice)
            }
            conn.on('message', handlerChoice)
        })

        let bonus = ev.bonus[choice] || 0
        total += bonus

        await conn.sendMessage(m.chat,{ text:`Hai scelto: *${ev.options[choice]}*.\nHai guadagnato ${bonus} €` })
    }

    u.euro += total
    let xpGain = randomNum(1,5)
    u.xp += xpGain

    let lvlUp = false
    if(u.xp >= u.level*50){
        u.level += 1
        u.xp = 0
        lvlUp = true
    }

    await conn.sendMessage(m.chat,{ text:
        `💰 Totale elemosina ricevuta: ${total} €\n` +
        `💶 Saldo attuale: ${u.euro} €\n` +
        `🏅 Livello: ${u.level} (XP: ${u.xp}/${u.level*50})` +
        (lvlUp ? `\n🎉 Complimenti! Sei salito di livello!` : '')
    })
}

handler.command = /^beg|elemosina$/i
export default handler

// Funzioni helper
function randomNum(min,max){ return Math.floor(Math.random()*(max-min+1))+min }
function shuffle(arr){ return arr.sort(()=>0.5-Math.random()) }