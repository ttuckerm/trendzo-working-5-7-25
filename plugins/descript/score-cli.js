#!/usr/bin/env node
const { stdin, stdout, stderr } = process

async function main() {
  const chunks = []
  for await (const c of stdin) chunks.push(c)
  const text = Buffer.concat(chunks).toString('utf8')
  const apiKey = process.env.PUBLIC_API_KEY || ''
  if (!apiKey) { stderr.write('Missing PUBLIC_API_KEY\n'); process.exit(1) }
  const features = { transcript: text }
  const res = await fetch('/public/score', { method:'POST', headers:{ 'Content-Type':'application/json', 'x-api-key': apiKey }, body: JSON.stringify({ features }) })
  const data = await res.json()
  stdout.write(JSON.stringify(data) + '\n')
}

main().catch(err => { stderr.write(String(err)+'\n'); process.exit(1) })








