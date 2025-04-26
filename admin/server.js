const { createServer } = require('https')
const { parse } = require('url')
const next = require('next')
const fs = require('fs')
const os = require('os')

const dev = process.env.NODE_ENV !== 'production'
const app = next({ dev })
const handle = app.getRequestHandler()

const httpsOptions = {
  key: fs.readFileSync('../certificates/localhost-key.pem'),
  cert: fs.readFileSync('../certificates/localhost.pem')
}

// Get local IP address
const getLocalIpAddress = () => {
  const interfaces = os.networkInterfaces()
  for (const interfaceName of Object.keys(interfaces)) {
    const interface = interfaces[interfaceName]
    for (const entry of interface) {
      if (entry.family === 'IPv4' && !entry.internal) {
        return entry.address
      }
    }
  }
  return '192.168.1.5' // fallback IP
}

const localIp = getLocalIpAddress()

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true)
    handle(req, res, parsedUrl)
  }).listen(3000, '0.0.0.0', (err) => {
    if (err) throw err

    console.log('\x1b[32m%s\x1b[0m', '▲ Next.js 15.2.4')
    console.log('  - Local:        \x1b[36m%s\x1b[0m', `https://localhost:3000`)
    console.log('  - Network:      \x1b[36m%s\x1b[0m', `https://${localIp}:3000`)
    console.log('  - Environments: \x1b[36m%s\x1b[0m', '.env.local')
  })
})
