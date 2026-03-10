process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '1';
import './config.js';
import { createRequire } from 'module';
import path, { join } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { platform } from 'process';
import fs, { readdirSync, statSync, unlinkSync, existsSync, mkdirSync, rmSync, watch } from 'fs';
import yargs from 'yargs';
import lodash from 'lodash';
import chalk from 'chalk';
import { format } from 'util';
import pino from 'pino';
import { makeWASocket, protoType, serialize } from './lib/simple.js';
import { Low, JSONFile } from 'lowdb';
import NodeCache from 'node-cache';

// Inizializzazione prototipi
protoType();
serialize();

const { useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, jidNormalizedUser, makeInMemoryStore } = await import('@realvare/baileys');
const { chain } = lodash;

// Setup variabili globali e percorsi
global.authFile = 'session';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

global.isLogoPrinted = false;
global.qrGenerated = false;

// Database setup
global.db = new Low(new JSONFile('database.json'));
global.loadDatabase = async function loadDatabase() {
    if (global.db.READ) return;
    global.db.READ = true;
    await global.db.read().catch(console.error);
    global.db.READ = null;
    global.db.data = { users: {}, chats: {}, settings: {}, ...(global.db.data || {}) };
    global.db.chain = chain(global.db.data);
};
await global.loadDatabase();

// Auth state
const { state, saveCreds } = await useMultiFileAuthState(global.authFile);

const question = (t) => {
    process.stdout.write(t);
    return new Promise((resolve) => {
        process.stdin.once('data', (data) => resolve(data.toString().trim()));
    });
};

// Selezione modalità all'avvio
let opzione;
if (!fs.existsSync(`./${global.authFile}/creds.json`)) {
    console.clear();
    console.log(chalk.cyan.bold(`
╔════════════════════════════════════════════════╗
      𝛥𝐗𝐈𝚶𝐍 𝚩𝚯𝐓 — SETUP CONNESSIONE
╚════════════════════════════════════════════════╝`));
    console.log(chalk.white(`  [1] QR CODE\n  [2] PAIRING CODE (Numero di telefono)`));
    opzione = await question(chalk.green.bold('\n  ❯ Scelta: '));
}

const logger = pino({ level: 'silent' });

// Configurazione socket
const connectionOptions = {
    logger,
    printQRInTerminal: opzione === '1',
    auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: Browsers.ubuntu('Chrome'), // Necessario per Pairing Code
    markOnlineOnConnect: true,
    generateHighQualityLinkPreview: true,
};

global.conn = makeWASocket(connectionOptions);

// --- GESTIONE PAIRING CODE ---
if (!fs.existsSync(`./${global.authFile}/creds.json`) && opzione === '2') {
    let phoneNumber = await question(chalk.cyan.bold('\n  ⚡ Inserisci il numero (es. 393471234567): '));
    phoneNumber = phoneNumber.replace(/\D/g, '');
    
    setTimeout(async () => {
        try {
            let code = await global.conn.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(chalk.black.bgGreen.bold('\n  🔑 CODICE DI ABBINAMENTO: '), chalk.white.bold(code), '\n');
        } catch (e) {
            console.error(chalk.red('\n  ✖ Errore durante la richiesta del codice.'), e);
        }
    }, 3000);
}

// --- GESTIONE CONNESSIONE ---
async function connectionUpdate(update) {
    const { connection, lastDisconnect, qr } = update;

    if (qr && opzione === '1') {
        console.log(chalk.yellow('\n  🌀 QR Code generato, scansionalo con WhatsApp.'));
    }

    if (connection === 'open') {
        console.clear();
        const logo = [
            '  █████╗ ██╗  ██╗██╗ ██████╗ ███╗   ██╗',
            ' ██╔══██╗╚██╗██╔╝██║██╔═══██╗████╗  ██║',
            ' ███████║ ╚███╔╝ ██║██║   ██║██╔██╗ ██║',
            ' ██╔══██║ ██╔██╗ ██║██║   ██║██║╚██╗██║',
            ' ██║  ██║██╔╝ ██╗██║╚██████╔╝██║ ╚████║',
            ' ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝ ╚═════╝ ╚═╝  ╚═══╝'
        ];
        logo.forEach(l => console.log(chalk.cyan.bold(l)));
        console.log(chalk.green.bold('\n  ✅ AXION BOT ONLINE - Connessione stabilita!\n'));
        global.isLogoPrinted = true;
    }

    if (connection === 'close') {
        const reason = lastDisconnect?.error?.output?.statusCode;
        console.log(chalk.red(`\n  ⚠️ Connessione chiusa. Ragione: ${reason}`));
        
        if (reason === 401) { // Logged out
            console.log(chalk.red('  Sessione terminata. Rimuovo i file...'));
            if (fs.existsSync(global.authFile)) fs.rmSync(global.authFile, { recursive: true });
            process.exit(1);
        } else {
            console.log(chalk.yellow('  Riavvio in corso...'));
            // Qui puoi aggiungere la logica di spawn per riavviare il processo
        }
    }
}

global.conn.ev.on('connection.update', connectionUpdate);
global.conn.ev.on('creds.update', saveCreds);

// Salvataggio DB ogni 30 secondi
setInterval(async () => {
    if (global.db.data) await global.db.write();
}, 30000);

process.on('uncaughtException', (err) => console.error('CRASH:', err));

// Watcher Main File
const mainWatcher = watch(fileURLToPath(import.meta.url), () => {
  console.log(chalk.bgHex('#008B8B')(chalk.white.bold(" 📝 [SYSTEM] File Main Aggiornato ")));
});
