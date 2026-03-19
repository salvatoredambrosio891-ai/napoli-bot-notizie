//Dipendenze.js Plugin by Bonzino
import fs from 'fs'
import path from 'path'

// estrae import e require dal codice
const getImports = (code) => {
  const imports = new Set()

  const importRegex = /import\s+(?:.*?\s+from\s+)?['"]([^'"]+)['"]/g
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g

  let match

  while ((match = importRegex.exec(code))) {
    imports.add(match[1])
  }

  while ((match = requireRegex.exec(code))) {
    imports.add(match[1])
  }

  return [...imports]
}

// controlla se è una dipendenza esterna
const isExternal = (pkg) => {
  return !pkg.startsWith('.') && !pkg.startsWith('/')
}

let handler = async (m, { conn }) => {
  const chat = m.chat

  try {
    const pkgPath = path.join(process.cwd(), 'package.json')
    const pluginsDir = path.join(process.cwd(), 'plugins')
    const nodeModules = path.join(process.cwd(), 'node_modules')

    // controlla se esiste package.json
    if (!fs.existsSync(pkgPath)) {
      return conn.sendMessage(chat, { text: '❌ package.json non trovato.' }, { quoted: m })
    }

    // legge package.json
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
    const deps = pkg.dependencies || {}
    const devDeps = pkg.devDependencies || {}

    let text = `📦 *DIPENDENZE BOT*\n\n`
    text += `🧠 *Node:* ${process.version}\n\n`

    // lista dipendenze installate
    text += `📚 *Dipendenze installate:*\n`

    if (!Object.keys(deps).length) {
      text += `- Nessuna\n`
    } else {
      for (const [name, version] of Object.entries(deps)) {
        const exists = fs.existsSync(path.join(nodeModules, name))
        text += `${exists ? '✅' : '❌'} ${name} → ${version}\n`
      }
    }

    // lista devDependencies
    text += `\n🛠️ *Dipendenze di sviluppo:*\n`

    if (!Object.keys(devDeps).length) {
      text += `- Nessuna\n`
    } else {
      for (const [name, version] of Object.entries(devDeps)) {
        const exists = fs.existsSync(path.join(nodeModules, name))
        text += `${exists ? '✅' : '❌'} ${name} → ${version}\n`
      }
    }

    // oggetto dipendenze mancanti
    let missing = {}

    // scansione plugin
    if (fs.existsSync(pluginsDir)) {
      const files = fs.readdirSync(pluginsDir)

      for (const file of files) {
        if (!file.endsWith('.js')) continue

        const fullPath = path.join(pluginsDir, file)
        const code = fs.readFileSync(fullPath, 'utf8')

        const imports = getImports(code)

        for (const imp of imports) {
          if (!isExternal(imp)) continue

          const exists = fs.existsSync(path.join(nodeModules, imp))

          if (!exists) {
            if (!missing[imp]) missing[imp] = []
            missing[imp].push(file)
          }
        }
      }
    }

    // stampa dipendenze mancanti nei plugin
    text += `\n⚠️ *Dipendenze mancanti nei plugin:*\n`

    if (Object.keys(missing).length === 0) {
      text += `✅ Nessun problema rilevato\n`
    } else {
      for (const [depName, files] of Object.entries(missing)) {
        text += `❌ *${depName}*\n`
        text += `   ↳ usata in: ${files.join(', ')}\n`
      }
    }

    await conn.sendMessage(chat, { text }, { quoted: m })
  } catch (e) {
    await conn.sendMessage(chat, {
      text: `❌ Errore: ${e.message}`
    }, { quoted: m })
  }
}

handler.help = ['dipendenze']
handler.tags = ['info']
handler.command = ['dipendenze']

export default handler