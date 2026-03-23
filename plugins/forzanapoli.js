// plugins/forzaNapoli.js
let handler = async (m, { conn }) => {
  try {
    let forzaNapoli = `
💙💙 *SEMPRE FORZA NAPOLI!* 💙💙
Il Napoli è il nostro cuore azzurro non si arrende Napoli lotta e vincerà! ⚽💙💪🎖🏆🥇.
`;

    return conn.sendMessage(m.chat, { text: forzaNapoli });

  } catch (e) {
    console.error(e);
    return conn.sendMessage(m.chat, { text: '❌ Errore nell\'invio del grido!' });
  }
};

handler.help = ['forzaNapoli'];
handler.tags = ['napoli'];
handler.command = /^(forzanapoli)$/i;

export default handler;