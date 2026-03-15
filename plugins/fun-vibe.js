import fs from 'fs';

const KARMA_FILE = './karma.json';

// Carica il file karma
const loadKarma = () => {
    return fs.existsSync(KARMA_FILE) ? JSON.parse(fs.readFileSync(KARMA_FILE, 'utf8')) : {};
};

// Salvataggio
const saveKarma = (data) => {
    fs.writeFileSync(KARMA_FILE, JSON.stringify(data, null, 2));
};

let handler = async (m, { conn, text, command, mentionedJid }) => {
    let karma = loadKarma();
    const MY_SIGN = "𝛥𝐗𝐈𝚶𝐍 𝚩𝚯𝐓";

    // Comando .vibe @utente
    if (command === 'vibe') {
        let user = mentionedJid[0] || m.sender;
        let score = karma[user] || 0;
        let status = score >= 10 ? "🌟 Positivo/Produttivo" : (score <= -5 ? "⚠️ Tossico/Polemico" : "⚖️ Neutrale");
        
        return m.reply(`『 📊 』- *Vibe di @${user.split('@')[0]}*\n` +
                       `*Karma:* ${score}\n*Stato:* ${status}\n\n${MY_SIGN}`, null, { mentions: [user] });
    }

    // Comando .classifica
    if (command === 'classifica') {
        let sorted = Object.entries(karma).sort((a, b) => b[1] - a[1]).slice(0, 5);
        let txt = `『 🏆 』- *Top 5 Karma di ${MY_SIGN}*\n\n`;
        txt += sorted.map(([id, score], i) => `${i + 1}. @${id.split('@')[0]} : ${score}`).join('\n');
        return m.reply(txt, null, { mentions: sorted.map(a => a[0]) });
    }
};

handler.command = ['vibe', 'classifica'];
export default handler;

// -- LOGICA ANALISI MESSAGGI --
// Questo pezzo di codice va messo nel tuo file principale (es. index.js o event.js)
// che intercetta i messaggi in arrivo:
/*
conn.ev.on('messages.upsert', async ({ messages }) => {
    let m = messages[0];
    if (!m.message || m.key.fromMe) return;
    
    let text = m.message.conversation || m.message.extendedTextMessage?.text || "";
    let pos = ['grazie', 'bravo', 'ottimo', 'aiuto', 'bene', 'top', 'perfetto'];
    let neg = ['stupido', 'merda', 'idiota', 'zitto', 'odio'];
    
    let karma = loadKarma();
    if (!karma[m.sender]) karma[m.sender] = 0;
    
    pos.forEach(w => { if (text.toLowerCase().includes(w)) karma[m.sender]++; });
    neg.forEach(w => { if (text.toLowerCase().includes(w)) karma[m.sender]--; });
    
    saveKarma(karma);
});
*/
