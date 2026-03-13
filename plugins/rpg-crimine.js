let handler = async (m, { conn }) => {
    let user = m.sender
    if (!global.db.data.users[user]) global.db.data.users[user] = {}
    let u = global.db.data.users[user]
    if (!u.euro) u.euro = 0

    // Tipi di crimine
    const crimes = [
        {
            name: "Rapina in banca 🏦",
            successRate: 0.4,
            reward: [300, 700],
            storiesSuccess: [
                "Hai svaligiato la banca con destrezza e sei fuggito senza problemi!",
                "La cassaforte non ti ha fermato, sei uscito con i soldi in mano!"
            ],
            storiesFail: [
                "La polizia ti ha beccato mentre tentavi la rapina!",
                "Allarme attivato! Devi scappare a mani vuote!"
            ]
        },
        {
            name: "Truffa al casinò 🎰",
            successRate: 0.5,
            reward: [200, 500],
            storiesSuccess: [
                "Hai ingannato il banco e hai vinto una bella somma!",
                "La tua strategia al tavolo ha funzionato perfettamente!"
            ],
            storiesFail: [
                "Il croupier ti ha scoperto e sei stato buttato fuori!",
                "La fortuna non era dalla tua parte questa volta!"
            ]
        },
        {
            name: "Furto in casa 🏠",
            successRate: 0.6,
            reward: [100, 300],
            storiesSuccess: [
                "Hai trovato un bottino nascosto e sei uscito senza problemi!",
                "La casa era vuota e il colpo è andato liscio!"
            ],
            storiesFail: [
                "Il proprietario ti ha sorpreso, scappa a mani vuote!",
                "Hai fatto rumore e sei stato scoperto!"
            ]
        },
        {
            name: "Scippo in strada 🚶‍♂️💨",
            successRate: 0.7,
            reward: [50, 150],
            storiesSuccess: [
                "Hai sfilato il portafoglio senza che nessuno ti vedesse!",
                "Un colpo veloce e sei già lontano!"
            ],
            storiesFail: [
                "Ti hanno visto e inseguito, perdi parte del bottino!",
                "Hai lasciato il portafoglio cadere mentre scappavi!"
            ]
        }
    ]

    // Selezione casuale del crimine
    const crime = crimes[Math.floor(Math.random() * crimes.length)]
    const success = Math.random() < crime.successRate
    const amount = Math.floor(Math.random() * (crime.reward[1] - crime.reward[0] + 1)) + crime.reward[0]

    // Bottoni interattivi
    const buttons = [
        { buttonId: '.crimine', buttonText: { displayText: '🔁 Riprova' }, type: 1 },
        { buttonId: '.wallet', buttonText: { displayText: '💶 Mostra saldo' }, type: 1 }
    ]

    if (success) {
        u.euro += amount
        const story = crime.storiesSuccess[Math.floor(Math.random() * crime.storiesSuccess.length)]
        await conn.sendMessage(m.chat, {
            text: `🕶️ ${crime.name} riuscito!\n${story}\nGuadagni: ${amount} €\nTotale: ${u.euro} €`,
            buttons,
            headerType: 1
        }, { quoted: m })
    } else {
        const loss = Math.floor(amount / 2)
        u.euro -= loss
        if (u.euro < 0) u.euro = 0
        const story = crime.storiesFail[Math.floor(Math.random() * crime.storiesFail.length)]
        await conn.sendMessage(m.chat, {
            text: `🚔 ${crime.name} fallito!\n${story}\nPerdi: ${loss} €\nTotale: ${u.euro} €`,
            buttons,
            headerType: 1
        }, { quoted: m })
    }
}

handler.command = /^crimine$/i
export default handler