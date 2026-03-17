let games = {}; 

let handler = async (m, { conn, usedPrefix, command, text }) => {
    const chatId = m.chat;

    const getPhoneNumber = (jid) => {
        if (!jid) return '';
        const user = jid.split('@')[0];
        return user.replace(/\D/g, '');
    };

    // ===== START (.tris) =====
    if (command === 'tris') {
        let mention = m.mentionedJid && m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : (m.quoted ? m.quoted.sender : null);

        if (!mention) 
            return conn.sendMessage(chatId, { 
                text: `⚠️ Devi menzionare qualcuno!\nEsempio: ${usedPrefix}tris @utente` 
            }, { quoted: m });

        const myNumber = getPhoneNumber(m.sender);
        const theirNumber = getPhoneNumber(mention);

        if (myNumber === theirNumber)
            return conn.sendMessage(chatId, { 
                text: '❌ Non puoi giocare contro te stesso!' 
            }, { quoted: m });

        if (games[chatId])
            return conn.sendMessage(chatId, { 
                text: '❌ C\'è già una partita in corso!' 
            }, { quoted: m });

        games[chatId] = {
            board: [['A1','A2','A3'],['B1','B2','B3'],['C1','C2','C3']],
            players: [myNumber, theirNumber],
            jids: [m.sender, mention],
            turn: 0,
            timer: null,
            symbols: ['❌', '⭕']
        };

        await sendBoard(chatId, conn, games[chatId], 
`🎮 ═══『 TRIS ONLINE 』═══ 🎮

👤 Giocatore 1: @${games[chatId].jids[0].split('@')[0]} ❌  
👤 Giocatore 2: @${games[chatId].jids[1].split('@')[0]} ⭕  

━━━━━━━━━━━━━━━━━━
▶️ Turno attuale:
➤ @${games[chatId].jids[0].split('@')[0]} (❌)

📝 Scrivi: ${usedPrefix}putris A1
⏳ Tempo: 2 minuti`
        );

        startTurnTimer(chatId, conn);
    }

    // ===== MOVE (.putris) =====
    else if (command === 'putris') {
        const game = games[chatId];
        if (!game) return conn.sendMessage(chatId, { 
            text: '❌ Nessuna partita attiva. Usa .tris' 
        }, { quoted: m });

        const myNumber = getPhoneNumber(m.sender);
        const currentNumber = game.players[game.turn];

        if (myNumber !== currentNumber) {
            const currentPlayerJid = game.jids[game.turn];
            return conn.sendMessage(chatId, { 
                text: `🚫 TURNO ERRATO!\n\nTocca a @${currentPlayerJid.split('@')[0]}\nSimbolo: ${game.symbols[game.turn]}`,
                mentions: [currentPlayerJid]
            }, { quoted: m });
        }

        const move = text.trim().toUpperCase();
        const map = { A: 0, B: 1, C: 2 };
        const row = map[move[0]];
        const col = parseInt(move[1]) - 1;

        if (row === undefined || isNaN(col) || col < 0 || col > 2)
            return conn.sendMessage(chatId, { 
                text: `⚠️ MOSSA NON VALIDA!

Esempi:
${usedPrefix}putris A1
${usedPrefix}putris B2
${usedPrefix}putris C3`
            }, { quoted: m });

        if (['❌','⭕'].includes(game.board[row][col]))
            return conn.sendMessage(chatId, { 
                text: '❌ Casella già occupata!' 
            }, { quoted: m });

        game.board[row][col] = game.symbols[game.turn];

        if (checkWinner(game.board)) {
            clearTimeout(game.timer);
            await sendBoard(chatId, conn, game, 
`🏆 VITTORIA!

🥇 @${m.sender.split('@')[0]}
Simbolo: ${game.symbols[game.turn]}`
            );
            delete games[chatId];
        } 

        else if (game.board.flat().every(cell => ['❌','⭕'].includes(cell))) {
            clearTimeout(game.timer);
            await sendBoard(chatId, conn, game, 
`🤝 PAREGGIO!

Nessun vincitore 😶`
            );
            delete games[chatId];
        } 

        else {
            game.turn = 1 - game.turn;
            const nextPlayerJid = game.jids[game.turn];
            const nextSymbol = game.symbols[game.turn];

            await sendBoard(chatId, conn, game, 
`✅ Mossa effettuata!

▶️ Tocca a:
@${nextPlayerJid.split('@')[0]}
Simbolo: ${nextSymbol}

📝 ${usedPrefix}putris [casella]`
            );

            startTurnTimer(chatId, conn);
        }
    }

    // ===== END =====
    else if (command === 'endtris') {
        if (games[chatId]) {
            clearTimeout(games[chatId].timer);
            const players = games[chatId].jids;
            delete games[chatId];
            await conn.sendMessage(chatId, { 
                text: '🛑 Partita annullata.',
                mentions: players
            });
        } else {
            await conn.sendMessage(chatId, { 
                text: '❌ Nessuna partita attiva.' 
            });
        }
    }

    // ===== HELP =====
    else if (command === 'trishelp') {
        await conn.sendMessage(chatId, {
            text: `🎮 GUIDA TRIS

Comandi:
${usedPrefix}tris @utente
${usedPrefix}putris A1
${usedPrefix}endtris

Obiettivo:
Fare 3 simboli in fila!

Tempo turno: 2 minuti`
        }, { quoted: m });
    }
};

// ===== BOARD =====
async function sendBoard(chatId, conn, game, msg = '') {
    const s = (cell) => {
        if (cell === '❌' || cell === '⭕') return cell;
        return '⬜';
    };

    const boardStr = 
`      1️⃣   2️⃣   3️⃣
   ┌────┬────┬────┐
A  │ ${s(game.board[0][0])} │ ${s(game.board[0][1])} │ ${s(game.board[0][2])} │
   ├────┼────┼────┤
B  │ ${s(game.board[1][0])} │ ${s(game.board[1][1])} │ ${s(game.board[1][2])} │
   ├────┼────┼────┤
C  │ ${s(game.board[2][0])} │ ${s(game.board[2][1])} │ ${s(game.board[2][2])} │
   └────┴────┴────┘`;

    await conn.sendMessage(chatId, { 
        text: `${boardStr}\n\n${msg}`,
        mentions: game.jids
    });
}

// ===== TIMER =====
function startTurnTimer(chatId, conn) {
    const game = games[chatId];
    if (!game) return;

    if (game.timer) clearTimeout(game.timer);

    game.timer = setTimeout(async () => {
        if (games[chatId]) {
            await conn.sendMessage(chatId, { 
                text: `⏱️ Tempo scaduto!\nPartita chiusa.`,
                mentions: game.jids
            });
            delete games[chatId];
        }
    }, 120000);
}

// ===== WIN CHECK =====
function checkWinner(board) {
    for (let i = 0; i < 3; i++) {
        if (board[i][0] === board[i][1] && board[i][1] === board[i][2]) return true;
        if (board[0][i] === board[1][i] && board[1][i] === board[2][i]) return true;
    }

    if (board[0][0] === board[1][1] && board[1][1] === board[2][2]) return true;
    if (board[0][2] === board[1][1] && board[1][1] === board[2][0]) return true;

    return false;
}

handler.command = /^(tris|putris|endtris|trishelp)$/i;
handler.help = ['tris', 'putris', 'endtris'];
handler.tags = ['game'];
handler.description = 'Gioco del Tris multiplayer';

export default handler;