import fetch from 'node-fetch';
import { promises as fs } from 'fs';
import { join } from 'path';

const apis = {
    sra: 'https://some-random-api.com/canvas/',
};

const effetti = {
    wasted: { api: 'sra', path: 'overlay/wasted' },
    bisex: { api: 'sra', path: 'misc/bisexual' },
    comunista: { api: 'sra', path: 'overlay/comrade' },
    simpcard: { api: 'sra', path: 'misc/simpcard' },
};

let handler = async (m, { conn, usedPrefix, command }) => {
    const effect = command.toLowerCase();
    const config = effetti[effect];

    if (!config) return m.reply('🤕 Effetto non trovato o non supportato.');

    let who = m.quoted ? m.quoted.sender : m.mentionedJid?.[0] ? m.mentionedJid[0] : m.sender;
    if (!who) {
        return m.reply(`⭔ \`Tagga qualcuno o rispondi a un messaggio\`\n\n*Esempio:* ${usedPrefix + command} @user`);
    }

    try {
        const pp = await conn.profilePictureUrl(who, 'image').catch(() => null);
        if (!pp) {
            const notification = who === m.sender ? 
                'Non hai una foto profilo 🤕' : 
                `@${who.split('@')[0]} non ha una foto profilo 🤕`;
            return m.reply(notification, null, { mentions: [who] });
        }

        const url = new URL(config.path, apis[config.api]);
        url.searchParams.set('avatar', pp);

        const res = await fetch(url.toString());
        if (!res.ok) throw `Errore API [${res.status}]`;

        const buffer = Buffer.from(await res.arrayBuffer());
        if (!buffer || buffer.length < 100) throw 'Risposta API non valida o file corrotto.';

        await conn.sendMessage(m.chat, { image: buffer, caption: '', mentions: [who] }, { quoted: m });

    } catch (e) {
        console.error('Errore effettiimmagine:', e);
        m.reply(e.toString().includes('API') ? e : '❌ Errore durante l\'applicazione dell\'effetto.');
    }
};

handler.help = ['wasted', 'bisex', 'comunista', 'simpcard'];
handler.tags = ['giochi'];
handler.command = /^(wasted|bisex|comunista|simpcard)$/i;

export default handler;