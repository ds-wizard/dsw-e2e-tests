const http = require('http')
const { URL } = require('url')

// Fixed dataset for the Integration question's own test call (KM editor's "Load"
// button, POST /type-hints/test) and the live questionnaire's real search
// (POST /type-hints) - both are backend-proxied and hit this same /search route.
const ITEMS = [
  { id: '1', name: 'Apple' },
  { id: '2', name: 'Banana' },
  { id: '3', name: 'Cherry' },
  { id: '4', name: 'Date' },
  { id: '5', name: 'Elderberry' }
]

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://mockserver')

  if (url.pathname === '/search') {
    const q = (url.searchParams.get('q') || '').toLowerCase()
    const results = q ? ITEMS.filter((item) => item.name.toLowerCase().includes(q)) : ITEMS

    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ results }))
    return
  }

  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ error: 'not found' }))
})

server.listen(80, () => {
  console.log('mockserver listening on :80')
})
