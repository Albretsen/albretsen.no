// Tests the Worker's MCP handler and event cleaning without Cloudflare: node scripts/test/worker.test.ts
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { mcp, clean } from '../../worker/index.ts'

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
console.log('worker tests passed')
