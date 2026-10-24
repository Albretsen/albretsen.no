// Tests the Worker's MCP handler, event cleaning and live figures without Cloudflare: node scripts/test/worker.test.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { mcp, clean, cleanFigure, figureText, Feed } from '../../worker/index.ts'

const dist = new URL('../../dist/', import.meta.url)
const env: any = { ASSETS: { fetch: async (r: Request | string) => { const u = new URL(typeof r === 'string' ? r : r.url); try { return new Response(await readFile(new URL('.' + u.pathname, dist))) } catch { return new Response('nf', { status: 404 }) } } } }
const call = async (body: unknown) => { const r = await mcp(new Request('https://albretsen.no/mcp', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }), env); return { status: r.status, json: r.status === 202 ? null : await r.json() as any } }

const init = await call({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } })
assert.equal(init.json.result.serverInfo.name, 'albretsen.no')
assert.equal((await call({ jsonrpc: '2.0', method: 'notifications/initialized' })).status, 202)
const list = await call({ jsonrpc: '2.0', id: 2, method: 'tools/list' })
assert.deepEqual(list.json.result.tools.map((t: any) => t.name), ['list_products', 'get_product', 'list_posts', 'get_post', 'contact'])
const live = await call({ jsonrpc: '2.0', id: 3, method: 'tools/call', params: { name: 'list_products', arguments: { status: 'live' } } })
assert.match(live.json.result.content[0].text, /MCP Emails/)
assert.equal(live.json.result.structuredContent.products.length, 2)
const post = await call({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'get_post', arguments: { slug: 'why-i-built-mcp-emails' } } })
assert.match(post.json.result.content[0].text, /^# Why I built MCP Emails/)
const missing = await call({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'get_product', arguments: { id: 'nope' } } })
assert.equal(missing.json.result.isError, true)
assert.equal((await call({ jsonrpc: '2.0', id: 6, method: 'nope' })).json.error.code, -32601)
const get = await mcp(new Request('https://albretsen.no/mcp'), env); assert.equal(get.status, 405)

assert.equal(clean({ product: 'mcp-emails', text: 'agent sent a reply', ms: 211.4, email: 'x@y.z' })?.ms, 211)
assert.equal((clean({ product: 'mcp-emails', text: 'x', email: 'x@y.z' }) as any).email, undefined)
assert.equal(clean({ product: 'evil', text: 'x' }), null)
// Live figures: cleaning, formatting, and the Durable Object's store and broadcast.
assert.equal(cleanFigure({ product: 'mcp-emails', label: 'emails handled', value: 10203.19, unit: 'sent', email: 'x@y.z' })?.email, undefined)
assert.equal(cleanFigure({ product: 'mcp-emails', label: 'emails handled', value: Infinity }), null)
assert.equal(cleanFigure({ product: 'mcp-emails', label: '', value: 1 }), null)
assert.equal(cleanFigure({ product: 'evil', label: 'emails handled', value: 1 }), null)
assert.equal(cleanFigure({ product: 'fun-libs', label: 'installs', value: ' 113,000+ ' })?.value, '113,000+')
assert.equal(figureText({ value: 10203.19, unit: 'NOK' }), '10,203 NOK')
assert.equal(cleanFigure({ product: 'mcp-emails', label: 'MRR', value: 10203.19, unit: 'NOK' }), null) // money stays private
assert.equal(cleanFigure({ product: 'mcp-emails', label: 'revenue', value: 1 }), null)
assert.equal(cleanFigure({ product: 'mcp-emails', label: 'emails handled', value: '$12k' }), null)
assert.equal(figureText({ value: '113,000+' }), '113,000+')
assert.equal(figureText({ value: 4.5, unit: 'k' }), '4.5 k')
assert.equal(cleanFigure({ product: 'mcp-emails', label: 'emails handled', value: 10203.194, unit: 'sent' })?.value, 10203.19)

const store = new Map<string, unknown>(), sent: string[] = []
const ctx: any = { storage: { get: async (k: string) => store.get(k), put: async (k: string, v: unknown) => { store.set(k, v) } }, acceptWebSocket() {}, getWebSockets: () => [{ send: (m: string) => sent.push(m) }] }
const feed = new Feed(ctx, { FEED_KEY: 'test-key' } as any)
const postFigure = (body: unknown, key = 'test-key') => feed.fetch(new Request('https://albretsen.no/api/figures', { method: 'POST', body: JSON.stringify(body), headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' } }))
assert.equal((await postFigure({ product: 'mcp-emails', label: 'emails handled', value: 10203.19, unit: 'sent' }, 'wrong')).status, 401)
assert.equal((await postFigure({ product: 'nope', label: 'emails handled', value: 1 })).status, 422)
assert.equal((await postFigure({ product: 'mcp-emails', label: 'emails handled', value: 10203.19, unit: 'sent' })).status, 201)
const msg = JSON.parse(sent[0]); assert.equal(msg.type, 'figure'); assert.equal(msg.product, 'mcp-emails'); assert.equal(msg.value, 10203.19)
const got = await feed.fetch(new Request('https://albretsen.no/api/figures'))
assert.equal(got.headers.get('cache-control'), 'no-store'); assert.equal(got.headers.get('access-control-allow-origin'), '*')
const { figures } = await got.json() as any
assert.deepEqual(Object.keys(figures), ['mcp-emails']); assert.equal(figures['mcp-emails'].label, 'emails handled'); assert.equal(figures['mcp-emails'].unit, 'sent'); assert.ok(figures['mcp-emails'].updated)
assert.equal(store.get('events'), undefined) // figures never land in the event list
assert.equal((await feed.fetch(new Request('https://albretsen.no/api/figures', { method: 'DELETE' }))).status, 405)

// The MCP server reports the live figure over the build-time one.
const liveEnv = { ...env, FEED: { idFromName: () => 'feed', get: () => feed } }
const lp = await mcp(new Request('https://albretsen.no/mcp', { method: 'POST', body: JSON.stringify({ jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'get_product', arguments: { id: 'mcp-emails' } } }) }), liveEnv)
assert.match(((await lp.json()) as any).result.content[0].text, /10,203 sent emails handled/)
console.log('worker tests passed')

// A money figure stored before the privacy rule is never served.
{
  const s = new Map<string, any>([['figures', { 'mcp-emails': { label: 'MRR', value: 11076.8, unit: 'NOK', updated: 'x' } }]])
  const f = new Feed({ storage: { get: async (k: string) => s.get(k), put: async (k: string, v: any) => { s.set(k, v) } }, acceptWebSocket() {}, getWebSockets: () => [] } as any, env as any)
  assert.deepEqual(((await (await f.fetch(new Request('https://albretsen.no/api/figures'))).json()) as any).figures, {})
}
