process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { createRequire } from 'module';
import path, { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, rmSync, watch } from 'fs';
import yargs from 'yargs';
import { spawn } from 'child_process';
import lodash from 'lodash';
import chalk from 'chalk';
import { format } from 'util';
import pino from 'pino';
import { makeWASocket, protoType, serialize } from './lib/simple.js';
import { Low, JSONFile } from 'lowdb';
import NodeCache from 'node-cache';

const DisconnectReason = {
    connectionClosed: 428,
    connectionLost: 408,
    connectionReplaced: 440,
    timedOut: 408,
    loggedOut: 401,
    badSession: 500,
    restartRequired: 515,
    multideviceMismatch: 411,
    forbidden: 403,
    unavailableService: 503
};

const { useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser, makeInMemoryStore } = await import('@realvare/baileys');
const { chain } = lodash;
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

protoType();
serialize();

global.isLogoPrinted = false;
global.qrGenerated = false;
global.connectionMessagesPrinted = {};
global.authFile = 'session'; 
let methodCodeQR = process.argv.includes("qr");
let methodCode = process.argv.includes("code");
let phoneNumber = global.botNumberCode;

global.__filename = function filename(pathURL = import.meta.url, rmPrefix = platform !== 'win32') {
    return rmPrefix ? /file:\/\/\//.test(pathURL) ? fileURLToPath(pathURL) : pathURL : pathToFileURL(pathURL).toString();
};

global.__dirname = function dirname(pathURL) {
    return path.dirname(global.__filename(pathURL, true));
};

global.__require = function require(dir = import.meta.url) {
    return createRequire(dir);
};

global.API = (name, path = '/', query = {}, apikeyqueryname) => (name in global.APIs ? global.APIs[name] : name) + path + (query || apikeyqueryname ? '?' + new URLSearchParams(Object.entries({ ...query, ...(apikeyqueryname ? { [apikeyqueryname]: global.APIKeys[name in global.APIs ? global.APIs[name] : name] } : {}) })) : '');
global.timestamp = { start: new Date };
const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.prefix = new RegExp('^[' + (opts['prefix'] || '*/!#$%+£¢€¥^°=¶∆×÷π√✓©®&.\\-.@').replace(/[|\\{}()[\]^$+*.\-\^]/g, '\\$&') + ']');
global.db = new Low(new JSONFile('database.json'));
global.DATABASE = global.db;

global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) {
        return new Promise((resolve) => {
            const interval = setInterval(() => {
                if (!global.db.READ) {
                    clearInterval(interval);
                    resolve(global.db.data == null ? global.loadDatabase() : global.db.data);
                }
            }, 1000);
        });
    }
    if (global.db.data !== null) return;
    global.db.READ = true;
    await global.db.read().catch(console.error);
    global.db.READ = null;
    global.db.data = {
        users: {},
        chats: {},
        settings: {},
        ...(global.db.data || {}),
    };
    global.db.chain = chain(global.db.data);
};
loadDatabase();

const { state, saveCreds } = await useMultiFileAuthState(global.authFile);
const msgRetryCounterCache = new NodeCache();

const question = (t) => {
    process.stdout.write(t);
    return new Promise((resolve) => {
        process.stdin.once('data', (data) => {
            resolve(data.toString().trim());
        });
    });
};

let opzione;
if (!methodCodeQR && !methodCode && !fs.existsSync(`./${global.authFile}/creds.json`)) {
    do {
        const primary = chalk.hex('#00F5FF');
        const secondary = chalk.hex('#008B8B');
        const accent = chalk.hex('#39FF14');
        const muted = chalk.hex('#95A5A6');
        const error = chalk.hex('#FF4742');
        const white = chalk.white.bold;

        const header = primary('╔════════════════════════════════════════════════╗');
        const footer = primary('╚════════════════════════════════════════════════╝');
        const title = white('      𝛥𝐗𝐈𝚶𝐍 𝚩𝚯𝐓 — PUBLIC DEPLOYMENT');
        const divider = secondary('   ──────────────────────────────────────────');

        opzione = await question(`
${header}
${title}
${divider}

  ${primary('⌬ [01]')} ${white('AUTENTICAZIONE TRAMITE QR CODE')}
  ${primary('⌬ [02]')} ${white('AUTENTICAZIONE TRAMITE PAIRING CODE')}

${divider}
  ${secondary('»')} ${muted('Assicurati di avere una connessione stabile.')}
  ${secondary('»')} ${muted('Il codice scadrà dopo pochi minuti.')}
  ${secondary('»')} ${primary.italic('Powered by Axion Ecosystem • v2.6.0')}
${footer}
${accent.bold('\n ❯ SELEZIONA MODALITÀ: ')}`);

        if (!/^[1-2]$/.test(opzione)) {
            console.log(error('\n  ✖ ERRORE: Inserisci 1 o 2\n'));
        }
    } while ((opzione !== '1' && opzione !== '2'));
}

const logger = pino({ level: 'silent' });
global.store = makeInMemoryStore({ logger });
global.jidCache = new NodeCache({ stdTTL: 600, useClones: false });
global.groupCache = new NodeCache({ stdTTL: 300, useClones: false });

const makeDecodeJid = (jidCache) => {
    return (jid) => {
        if (!jid) return jid;
        const cached = jidCache.get(jid);
        if (cached) return cached;
        let decoded = /:\d+@/gi.test(jid) ? jidNormalizedUser(jid) : jid;
        jidCache.set(jid, decoded);
        return decoded;
    };
};

const connectionOptions = {
    logger,
    browser: Browsers.macOS('Safari'),
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    decodeJid: makeDecodeJid(global.jidCache),
    printQRInTerminal: opzione === '1' || methodCodeQR,
    msgRetryCounterCache,
};

global.conn = makeWASocket(connectionOptions);
global.store.bind(global.conn.ev);

if (!fs.existsSync(`./${global.authFile}/creds.json`) && (opzione === '2' || methodCode)) {
    if (!conn.authState.creds.registered) {
        let addNumber = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';
        if (!addNumber) {
            phoneNumber = await question(chalk.bold.hex('#00F5FF')(`\n ⚡ INSERISCI IL NUMERO (es: +393471234567)\n ❯ `));
            addNumber = phoneNumber.replace(/\D/g, '');
        }
        setTimeout(async () => {
            let codeBot = await conn.requestPairingCode(addNumber, 'AXIONBOT');
            console.log(chalk.bold.white.bgHex('#008B8B')(' 🔑 CODICE DI ABBINAMENTO: '), chalk.bold.hex('#39FF14')(codeBot?.match(/.{1,4}/g)?.join("-") || codeBot));
        }, 3000);
    }
}

async function connectionUpdate(update) {
    const { connection, lastDisconnect, isNewLogin, qr } = update;
    global.stopped = connection;
    
    if (isNewLogin) conn.isInit = true;
    if (global.db.data == null) await global.loadDatabase();

    if (qr && (opzione === '1' || methodCodeQR) && !global.qrGenerated) {
        console.log(chalk.bold.hex('#00F5FF')(`\n 🌀 SCANSIONA IL CODICE QR — SCADE TRA 45 SECONDI 🌀`));
        global.qrGenerated = true;
    }

    if (connection === 'open') {
        global.qrGenerated = false;
        global.connectionMessagesPrinted = {};
        if (!global.isLogoPrinted) {
            const techGradient = ['#00F5FF', '#00E5EE', '#00CED1', '#20B2AA', '#39FF14', '#2ECC71', '#39FF14', '#20B2AA'];
            const axionbot = [
                `   █████╗ ██╗  ██╗██╗ ██████╗ ███╗   ██╗    ██████╗  ██████╗ ████████╗`,
                `  ██╔══██╗╚██╗██╔╝██║██╔═══██╗████╗  ██║    ██╔══██╗██╔═══██╗╚══██╔══╝`,
                `  ███████║ ╚███╔╝ ██║██║   ██║██╔██╗ ██║    ██████╔╝██║   ██║   ██║   `,
                `  ██╔══██║ ██╔██╗ ██║██║   ██║██║╚██╗██║    ██╔══██╗██║   ██║   ██║   `,
                `  ██║  ██║██╔╝ ██╗██║╚██████╔╝██║ ╚████║    ██████╔╝╚██████╔╝   ██║   `,
                `  ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝    ╚═════╝  ╚═════╝    ╚═╝   `,
                `                                                                      `,
                `                   [ SYSTEM ONLINE - AXION BOT ]                   `
            ];
            axionbot.forEach((line, i) => {
                console.log(chalk.hex(techGradient[i] || '#00F5FF').bold(line));
            });
            global.isLogoPrinted = true;
        }
    }

    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
        if (reason === DisconnectReason.badSession) {
            console.log(chalk.bold.hex('#FF4742')(`\n ⚠️ [ERROR] Sessione corrotta. Elimina la cartella ${global.authFile} e riavvia.`));
        } else if (reason === DisconnectReason.loggedOut) {
            console.log(chalk.bold.hex('#FF4742')(`\n ⚠️ [LOGOUT] Disconnesso. Riavvia per un nuovo login.`));
            if (fs.existsSync(global.authFile)) fs.rmSync(global.authFile, { recursive: true });
            process.exit(1);
        } else {
            console.log(chalk.hex('#00F5FF')(`\n 🔄 [RECONNECTING] Motivo: ${reason}. Riprovo...`));
            // Qui andrebbe la logica di riavvio se hai un handler dedicato
        }
    }
}

conn.ev.on('connection.update', connectionUpdate);
conn.ev.on('creds.update', saveCreds);

// Gestione database auto-save e pulizia temp
setInterval(async () => {
    if (global.db.data) await global.db.write();
    const tmpDir = join(__dirname, 'temp');
    if (existsSync(tmpDir) && opts['autocleartmp']) {
        readdirSync(tmpDir).forEach(file => {
            const fPath = join(tmpDir, file);
            if (statSync(fPath).isFile() && (Date.now() - statSync(fPath).mtimeMs) > 120000) {
                unlinkSync(fPath);
            }
        });
    }
}, 30000);

process.on('uncaughtException', console.error);

// Watcher Main File
const mainWatcher = watch(fileURLToPath(import.meta.url), () => {
  console.log(chalk.bgHex('#008B8B')(chalk.white.bold(" 📝 [SYSTEM] File Main Aggiornato ")));
});
