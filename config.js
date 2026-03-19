import { watchFile, unwatchFile } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import chalk from 'chalk'
import fs from 'fs'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import NodeCache from 'node-cache'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const moduleCache = new NodeCache({ stdTTL: 300 });

global.owner = [
  ['393336413960', 'creatore, true],
  ['16625545197', 'simone-staff', true], 
  
]
global.mods = ['xxxxxxxxxx', 'xxxxxxxxxx']
global.prems = ['xxxxxxxxxx', 'xxxxxxxxxx']

global.nomebot   = '𝐍𝐀𝐏𝐎𝐋𝐈-𝐁𝐎𝐓'
global.nomepack  = '𝐍𝐀𝐏𝐎𝐋𝐈-𝐁𝐎𝐓'
global.wm        = '𝐍𝐀𝐏𝐎𝐋𝐈-𝐁𝐎𝐓'
global.autore    = 'Salvatore'
global.dev       = 'Salvatore'
global.versione  = pkg.version
global.testobot  = `𝐍𝐀𝐏𝐎𝐋𝐈-CORE-V${pkg.version}`

// 🌐 LINK
global.repobot   = 'https://github.com/axion-bot/axion-bot-Md'
global.canale    = 'https://whatsapp.com/channel/0029Vb8MQ3U1CYoMEtU1832d'
global.insta     = 'https://www.instagram.com/darius._.n'

global.cheerio   = cheerio
global.fs        = fs
global.fetch     = fetch
global.axios     = axios
global.moment    = moment

global.APIKeys = {
    spotifyclientid: 'axion',
    spotifysecret:   'axion',
    browserless:     'axion',
    screenshotone:   'axion',
    tmdb:            'axion',
    gemini:          'axion',
    ocrspace:        'axion',
    assemblyai:      'axion',
    google:          'axion',
    googlex:         'axion',
    googleCX:        'axion',
    genius:          'axion',
    unsplash:        'axion',
    removebg:        'FEx4CYmYN1QRQWD1mbZp87jV',
    openrouter:      'axion',
    lastfm:          '36f859a1fc4121e7f0e931806507d5f9',
}

let filePath = fileURLToPath(import.meta.url)
let fileUrl = pathToFileURL(filePath).href

const reloadConfig = async () => {
  const cached = moduleCache.get(fileUrl);
  if (cached) return cached;
  
  unwatchFile(filePath)
  console.log(chalk.bgCyan.black(" SYSTEM ") + chalk.cyan(` File 'config.js' aggiornato con successo.`))
  
  const module = await import(`${fileUrl}?update=${Date.now()}`)
  moduleCache.set(fileUrl, module, { ttl: 300 });
  return module;
}

watchFile(filePath, reloadConfig)
