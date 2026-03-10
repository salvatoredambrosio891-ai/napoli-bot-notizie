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

const __dirname = global.__dirname(import.meta.url);
global.opts = new Object(yargs(process.argv.slice(2)).exitProcess(false).parse());
global.db = new Low(new JSONFile('database.json'));

global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return;
    await global.db.read().catch(console.error);
    global.db.data = { users: {}, chats: {}, settings: {}, ...(global.db.data || {}) };
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
    console.clear();
    const primary = chalk.hex('#00F5FF');
    console.log(primary(`
╔════════════════════════════════════════════════╗
      𝛥𝐗𝐈𝚶𝐍 𝚩𝚯𝐓 — PUBLIC DEPLOYMENT
   ──────────────────────────────────────────

   ⌬ [01] AUTENTICAZIONE TRAMITE QR CODE
   ⌬ [02] AUTENTICAZIONE TRAMITE PAIRING CODE

   ──────────────────────────────────────────
╚════════════════════════════════════════════════╝`));
    opzione = await question(chalk.hex('#39FF14').bold('\n ❯ SELEZIONA MODALITÀ (1 o 2): '));
}

const logger = pino({ level: 'silent' });
global.store = makeInMemoryStore({ logger });
global.jidCache = new NodeCache({ stdTTL: 600, useClones: false });

const makeDecodeJid = (cache) => (jid) => {
    if (!jid) return jid;
    const cached = cache.get(jid);
    if (cached) return cached;
    let decoded = /:\d+@/gi.test(jid) ? jidNormalizedUser(jid) : jid;
    cache.set(jid, decoded);
    return decoded;
};

const connectionOptions = {
    logger,
    browser: Browsers.ubuntu('Chrome'), 
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

// --- LOGICA PAIRING CODE ---
if (!fs.existsSync(`./${global.authFile}/creds.json`) && (opzione === '2' || methodCode)) {
    if (!conn.authState.creds.registered) {
        let addNumber = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : '';
        if (!addNumber) {
            console.log(chalk.hex('#00F5FF')('\n ⚡ INSERISCI IL NUMERO (es: 393471234567)'));
            let num = await question(chalk.hex('#00F5FF')(' ❯ '));
            addNumber = num.replace(/\D/g, '');
        }
        
        setTimeout(async () => {
            try {
                let codeBot = await conn.requestPairingCode(addNumber);
                codeBot = codeBot?.match(/.{1,4}/g)?.join("-") || codeBot;
                console.log(chalk.bold.white.bgHex('#008B8B')('\n 🔑 CODICE DI ABBINAMENTO: '), chalk.bold.hex('#39FF14')(codeBot), '\n');
            } catch (e) {
                console.error(chalk.red('Errore pairing:'), e);
            }
        }, 3000);
    }
}

async function connectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;
    
    if (qr && (opzione === '1' || methodCodeQR) && !global.qrGenerated) {
        console.log(chalk.bold.hex('#00F5FF')('\n 🌀 SCANSIONA IL QR CODE 🌀'));
        global.qrGenerated = true;
    }

    if (connection === 'open') {
        global.qrGenerated = false;
        console.clear();
        const logo = [
            ' █████╗ ██╗  ██╗██╗ ██████╗ ███╗   ██╗',
            '██╔══██╗╚██╗██╔╝██║██╔═══██╗████╗  ██║',
            '███████║ ╚███╔╝ ██║██║   ██║██╔██╗ ██║',
            '██╔══██║ ██╔██╗ ██║██║   ██║██║╚██╗██║',
            '██║  ██║██╔╝ ██╗██║╚██████╔╝██║ ╚████║',
            '╚═╝  ╚═╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝'
        ];
        logo.forEach(line => console.log(chalk.hex('#00F5FF').bold(line)));
        console.log(chalk.hex('#39FF14').bold('\n ✅ AXION BOT ONLINE - Connesso correttamente\n'));
        global.isLogoPrinted = true;
    }

    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.output?.payload?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
            if (fs.existsSync(global.authFile)) fs.rmSync(global.authFile, { recursive: true });
            process.exit(1);
        } else {
            console.log(chalk.hex('#FF4742')(`\n 🔄 Riconnessione... (${reason})`));
        }
    }
}

conn.ev.on('connection.update', connectionUpdate);
conn.ev.on('creds.update', saveCreds);

process.on('uncaughtException', (err) => {
    console.error('ERRORE:', err);
});

// Watcher Main File
const mainWatcher = watch(fileURLToPath(import.meta.url), () => {
  console.log(chalk.bgHex('#008B8B')(chalk.white.bold(" 📝 [SYSTEM] File Main Aggiornato ")));
});
