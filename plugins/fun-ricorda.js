const reminders = [];

const handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply("Uso:\n.ricorda 16:23 messaggio");
  }

  const args = text.split(" ");
  const time = args.shift();
  const message = args.join(" ");

  if (!time || !message) {
    return m.reply("Formato corretto:\n.ricorda 16:23 messaggio");
  }

  const [hour, minute] = time.split(":").map(Number);

  if (isNaN(hour) || isNaN(minute)) {
    return m.reply("Orario non valido. Usa formato HH:MM");
  }

  const now = new Date();
  const target = new Date();

  target.setHours(hour);
  target.setMinutes(minute);
  target.setSeconds(0);

  if (target < now) {
    target.setDate(target.getDate() + 1);
  }

  const delay = target - now;

  const data = {
    chat: m.chat,
    sender: m.sender,
    message
  };

  reminders.push(data);

  setTimeout(async () => {
    try {
      await conn.sendMessage(
        data.chat,
        {
          text: `⏰ *PROMEMORIA*\n@${data.sender.split("@")[0]} ${data.message}`,
          mentions: [data.sender]
        }
      );
    } catch (e) {
      console.log("Errore promemoria:", e);
    }
  }, delay);

  m.reply(`⏳ Promemoria impostato per le ${time}`);
};

handler.help = ['ricorda'];
handler.tags = ['utility'];
handler.command = /^ricorda$/i;

export default handler;