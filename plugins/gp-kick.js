async function handler(m, { isBotAdmin, conn }) {
  // 1. Controllo Admin Bot
  if (!isBotAdmin) {
    return await conn.sendMessage(m.chat, { text: 'ⓘ Devo essere admin per poter funzionare' }, { quoted: m });
  }

  // 2. LOGICA SELEZIONE UTENTE: 
  // Verifica prioritaria: menzione, poi risposta a messaggio
  let mention = m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted ? m.quoted.sender : null;

  if (!mention) {
    return await conn.sendMessage(m.chat, { text: 'ⓘ Rispondi a un messaggio o menziona la persona da rimuovere.' }, { quoted: m });
  }

  // 3. PROTEZIONE OWNER
  const ownerJids = global.owner ? global.owner.map(o => o[0] + '@s.whatsapp.net') : [];
  if (ownerJids.includes(mention)) {
    return await conn.sendMessage(m.chat, { text: 'ⓘ Non posso rimuovere un Owner.' }, { quoted: m });
  }

  // 4. CONTROLLI DI SICUREZZA
  if (mention === conn.user.jid) return await conn.sendMessage(m.chat, { text: 'ⓘ Non puoi rimuovere il bot' }, { quoted: m });
  if (mention === m.sender) return await conn.sendMessage(m.chat, { text: 'ⓘ Non puoi rimuovere te stesso' }, { quoted: m });

  const groupMetadata = await conn.groupMetadata(m.chat);
  const participant = groupMetadata.participants.find(u => u.id === mention);
  
  if (participant?.admin === 'admin' || participant?.admin === 'superadmin') {
    return await conn.sendMessage(m.chat, { text: "ⓘ Non posso rimuovere un admin." }, { quoted: m });
  }

  // 5. ESECUZIONE
  try {
    await conn.groupParticipantsUpdate(m.chat, [mention], 'remove');
    await conn.sendMessage(m.chat, {
      text: `@${mention.split('@')[0]} è stato vaporizzato da questo gruppo.`,
      mentions: [mention]
    }, { quoted: m });
  } catch (e) {
    await conn.sendMessage(m.chat, { text: 'ⓘ Errore: non ho i permessi necessari o l\'utente è già uscito.' }, { quoted: m });
  }
}

// Definiamo i comandi qui
handler.command = /^(kick|avadachedavra|pannolini|puffo)$/i
handler.admin = true
handler.group = true

export default handler;
