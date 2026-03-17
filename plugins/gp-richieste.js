const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

let richiestaInAttesa = {}

var handler = async (m, { conn, isAdmin, isBotAdmin, args, usedPrefix, command }) => {
  if (!m.isGroup) return
  const groupId = m.chat

  if (!isBotAdmin) return m.reply("❌ Devo essere admin per gestire richieste.")
  if (!isAdmin) return m.reply("❌ Solo admin possono usare questo comando.")

  const pending = await conn.groupRequestParticipantsList(groupId)

  // risposta manuale numero
  if (richiestaInAttesa[m.sender]) {
    const input = (m.text || '').trim()
    delete richiestaInAttesa[m.sender]

    if (!/^\d+$/.test(input))
      return m.reply("❌ Invia un numero valido.")

    const numero = parseInt(input)
    const daAccettare = pending.slice(0, numero)

    await toggleApproval(conn, groupId, false)
    await delay(2000)
    await toggleApproval(conn, groupId, true)

    return m.reply(`✅ Ho accettato *${daAccettare.length} richieste*.`)
  }

  if (!pending.length)
    return m.reply("✅ Non ci sono richieste in sospeso.")

  // menu
  if (!args[0]) {
    return conn.sendMessage(groupId,{
      text:`📨 Richieste in sospeso: *${pending.length}*\n\nScegli cosa fare:`,
      footer:'Gestione richieste gruppo',
      buttons:[
        {buttonId:`${usedPrefix}${command} accetta`,buttonText:{displayText:"✅ Accetta tutte"},type:1},
        {buttonId:`${usedPrefix}${command} rifiuta`,buttonText:{displayText:"❌ Rifiuta tutte"},type:1},
        {buttonId:`${usedPrefix}${command} accetta39`,buttonText:{displayText:"🇮🇹 Accetta +39"},type:1},
        {buttonId:`${usedPrefix}${command} gestisci`,buttonText:{displayText:"📥 Gestisci numero"},type:1}
      ],
      headerType:1
    },{quoted:m})
  }

  // accetta tutte
  if (args[0] === 'accetta') {

    await toggleApproval(conn, groupId, false)
    await delay(2000)
    await toggleApproval(conn, groupId, true)

    return m.reply(`✅ Ho accettato *${pending.length} richieste*.`)
  }

  // rifiuta tutte
  if (args[0] === 'rifiuta') {

    const jidList = pending.map(p => p.jid)

    await conn.groupRequestParticipantsUpdate(groupId, jidList, 'reject')

    return m.reply(`❌ Rifiutate *${jidList.length} richieste*.`)
  }

  // accetta +39
  if (args[0] === 'accetta39') {

    const italiani = pending.filter(p => p.jid.startsWith('39'))

    await toggleApproval(conn, groupId, false)
    await delay(2000)
    await toggleApproval(conn, groupId, true)

    return m.reply(`✅ Accettate *${italiani.length} richieste con prefisso +39*.`)
  }

  // gestione numero
  if (args[0] === 'gestisci') {

    richiestaInAttesa[m.sender] = true

    return conn.sendMessage(groupId,{
      text:`🔮 Quante richieste vuoi accettare?\n\nScrivi un numero in chat.`,
      footer:'Gestione richieste',
      buttons:[
        {buttonId:`${usedPrefix}${command} accettane 10`,buttonText:{displayText:"10"},type:1},
        {buttonId:`${usedPrefix}${command} accettane 20`,buttonText:{displayText:"20"},type:1},
        {buttonId:`${usedPrefix}${command} accettane 50`,buttonText:{displayText:"50"},type:1},
        {buttonId:`${usedPrefix}${command} accettane 100`,buttonText:{displayText:"100"},type:1}
      ],
      headerType:1
    },{quoted:m})
  }

  if (args[0] === 'accettane') {

    const numero = parseInt(args[1])
    if (isNaN(numero)) return m.reply("❌ Numero non valido.")

    const daAccettare = pending.slice(0, numero)

    await toggleApproval(conn, groupId, false)
    await delay(2000)
    await toggleApproval(conn, groupId, true)

    return m.reply(`✅ Ho accettato *${daAccettare.length} richieste*.`)
  }

}

// funzione toggle approvazione
async function toggleApproval(conn, chat, stato) {

  await conn.query({
    tag:'iq',
    attrs:{
      to:chat,
      type:'set',
      xmlns:'w:g2'
    },
    content:[{
      tag:'membership_approval_mode',
      attrs:{},
      content:[{
        tag:'group_join',
        attrs:{ state: stato ? 'on' : 'off' }
      }]
    }]
  })

}

handler.command = ['richieste']
handler.tags = ['gruppo']
handler.help = ['richieste']

handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler