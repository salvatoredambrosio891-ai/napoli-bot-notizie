const handler = async (m, { conn }) => {

  if (!m.isGroup) {
    return m.reply('❌ Questo comando funziona solo nei gruppi.');
  }

  // Chi invia deve essere admin del gruppo
  const metadata = await conn.groupMetadata(m.chat);
  const senderJid = m.sender;
  const senderIsAdmin = metadata.participants.find(p => p.jid === senderJid)?.admin;

  if (!senderIsAdmin) {
    return m.reply('❌ Solo un admin del gruppo può reimpostare il link.');
  }

  // Il bot deve essere admin
  const botJid = conn.user.id.split(':')[0] + '@s.whatsapp.net';
  const botIsAdmin = metadata.participants.find(p => p.jid === botJid)?.admin;

  if (!botIsAdmin) {
    return m.reply('❌ Devo essere admin per reimpostare il link del gruppo.');
  }

  try {
    // Revoca link attuale
    await conn.groupRevokeInvite(m.chat);

    // Genera nuovo codice
    const newCode = await conn.groupInviteCode(m.chat);
    const newLink = `https://chat.whatsapp.com/${newCode}`;

    await conn.sendMessage(m.chat, {
      text: `👑 *LINK REIMPOSTATO*\n\n🔄 Il vecchio link è stato revocato.\n\n🔗 Nuovo link:\n${newLink}`
    });

  } catch (error) {
    console.error(error);
    m.reply('❌ Errore durante la reimpostazione del link.');
  }
};

handler.command = ['reimpostalink'];
handler.group = true; 
handler.admin = true;

export default handler;