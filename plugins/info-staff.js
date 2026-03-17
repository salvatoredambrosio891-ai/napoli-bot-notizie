let handler = async (m, { conn, command, usedPrefix }) => {
    let staff = `
⋆｡˚✦『 𝐒𝐓𝐀𝐅𝐅 𝛥𝐗𝐈𝚶𝐍 𝚩𝚯𝐓 』✦˚｡⋆

╭───────────────╮
│ 🤖 Bot: ${global.nomebot}
│ 🆚 Versione: ${global.versione}
╰───────────────╯

╭─── 👑 *_CREATORE_* ───╮
│ ✦ Nome: Deadly
│ ✦ Ruolo: Creatore / Dev
│ ✦ Contatto: @212778494602
╰────────────────────╯

╭─── 🛡️ *_STAFF_* ───╮
│ ✦ Luxifer
│   ├ Ruolo: *Staffer*
│   └ Contatto: @212781816909
│
│ ✦ Bonzino
│   ├ Ruolo: *Staffer*
│   └ Contatto: @639350468907
╰────────────────────╯

╭─── 📌 INFO UTILI ───╮
│ ✦ GitHub: github.com/axion-bot
│ ✦ Supporto: @+393509594333
╰────────────────────╯

⋆｡˚✦ 𝛥𝐗𝐈𝚶𝐍 𝐁𝐎𝐓 ✦˚｡⋆`;

    await conn.reply(
        m.chat, 
        staff.trim(), 
        m, 
        { 
            contextInfo: {
                mentionedJid: ['212778494602@s.whatsapp.net', '212781816909@s.whatsapp.net', '639350468907@s.whatsapp.net']
            }
        }
    );

    await conn.sendMessage(m.chat, {
        contacts: {
            contacts: [
                {
                    vcard: `BEGIN:VCARD
VERSION:3.0
FN:Deadly
ORG:𝛥𝐗𝐈𝚶𝐍 𝚩𝚯𝐓 - Creatore
TEL;type=CELL;type=VOICE;waid=212778494602:212778494602
END:VCARD`
                },
                {
                    vcard: `BEGIN:VCARD
VERSION:3.0
FN:Luxifer
ORG:𝛥𝐗𝐈𝚶𝐍 𝚩𝚯𝐓 - Staffer
TEL;type=CELL;type=VOICE;waid=212781816909:+212781816909
END:VCARD`
                },
                {
                    vcard: `BEGIN:VCARD
VERSION:3.0
FN:Bonzino
ORG:𝛥𝐗𝐈𝚶𝐍 𝚩𝚯𝐓 - Staffer
TEL;type=CELL;type=VOICE;waid=639350468907:+639350468907
END:VCARD`
                }
            ]
        }
    }, { quoted: m });

    m.react('👑');
};

handler.help = ['staff'];
handler.tags = ['main'];
handler.command = ['staff', 'moderatori', 'collaboratori'];

export default handler;