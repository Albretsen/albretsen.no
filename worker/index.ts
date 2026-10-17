// albretsen.no Worker. Static files come from dist/ (the ASSETS binding);
// this script only answers what a static host cannot:
//   /mcp              read-only MCP server (Streamable HTTP, stateless JSON responses)
//   /api/events       latest product events (GET) and ingestion (POST, bearer key)
//   /api/events/socket live events over a hibernating WebSocket
//   Accept: text/markdown  → the page's Markdown twin
//   Server-Timing on every response

interface Env {
  ASSETS: { fetch(req: Request | string): Promise<Response> }
  FEED: { idFromName(name: string): unknown; get(id: unknown): { fetch(req: Request): Promise<Response> } }
  FEED_KEY?: string
}

type Json = Record<string, unknown>
const PRODUCTS = new Set(['mcp-emails', 'fun-libs', 'toolrails', 'harbor', 'albretsen.no'])
const LABELS: Record<string, string> = { 'mcp-emails': 'MCP Emails', 'fun-libs': 'Fun Libs', toolrails: 'Toolrails', harbor: 'Harbor', 'albretsen.no': 'albretsen.no' }

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const t0 = Date.now()
    const url = new URL(req.url)
    let res: Response
    if (url.pathname === '/mcp') res = await mcp(req, env)
    else if (url.pathname.startsWith('/api/events')) res = await feedStub(env).fetch(req)
    else if (wantsMarkdown(req, url)) res = await markdownTwin(url, env)
    else res = await env.ASSETS.fetch(req)
    const out = new Response(res.body, res)
    if (res.status !== 101) out.headers.append('Server-Timing', `worker;dur=${Date.now() - t0}`)
    return res.status === 101 ? res : out
  },
}

const feedStub = (env: Env) => env.FEED.get(env.FEED.idFromName('feed'))

/* ---------------------------------------------------------------- Markdown twins */
function wantsMarkdown(req: Request, url: URL) {
  if (req.method !== 'GET') return false
  const accept = req.headers.get('accept') ?? ''
  return /text\/markdown/.test(accept) && !/text\/html/.test(accept.split(',')[0]) && !/\.\w+$/.test(url.pathname)
}
async function markdownTwin(url: URL, env: Env) {
  const path = url.pathname === '/' ? '/index.md' : url.pathname.replace(/\/$/, '') + '.md'
  const r = await env.ASSETS.fetch(new Request(new URL(path, url)))
  if (!r.ok) return r
  return new Response(r.body, { headers: { 'content-type': 'text/markdown; charset=utf-8', vary: 'accept', 'cache-control': 'public, max-age=300' } })
}

/* ---------------------------------------------------------------- MCP */
const PROTOCOL = '2025-06-18'
const TOOLS = [
  { name: 'list_products', description: 'Every product Asgeir Albretsen has shipped, with status, start year and its headline figure.', inputSchema: { type: 'object', properties: { status: { type: 'string', enum: ['live', 'building', 'paused', 'retired'], description: 'Only products with this status.' } } }, annotations: { readOnlyHint: true, openWorldHint: false } },
  { name: 'get_product', description: 'One product by id, e.g. "mcp-emails" or "fun-libs".', inputSchema: { type: 'object', properties: { id: { type: 'string' } }, required: ['id'] }, annotations: { readOnlyHint: true, openWorldHint: false } },
  { name: 'list_posts', description: 'Articles on albretsen.no, newest first.', inputSchema: { type: 'object', properties: { lang: { type: 'string', enum: ['en', 'nb'] } } }, annotations: { readOnlyHint: true, openWorldHint: false } },
  { name: 'get_post', description: 'The full text of one article as Markdown.', inputSchema: { type: 'object', properties: { slug: { type: 'string' }, lang: { type: 'string', enum: ['en', 'nb'] } }, required: ['slug'] }, annotations: { readOnlyHint: true, openWorldHint: false } },
  { name: 'contact', description: 'How to reach Asgeir Albretsen and what kind of outside work he takes.', inputSchema: { type: 'object', properties: {} }, annotations: { readOnlyHint: true, openWorldHint: false } },
]

let contentCache: Json | null = null
async function content(env: Env, origin: string): Promise<any> {
  if (contentCache) return contentCache
  const r = await env.ASSETS.fetch(new Request(origin + '/api/content.json'))
  contentCache = await r.json() as Json
  return contentCache
}

const rpc = (id: unknown, result: unknown) => ({ jsonrpc: '2.0', id, result })
const rpcError = (id: unknown, code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } })
const text = (t: string, structured?: unknown) => ({ content: [{ type: 'text', text: t }], ...(structured ? { structuredContent: structured } : {}) })

export async function mcp(req: Request, env: Env): Promise<Response> {
  const headers = { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type, mcp-protocol-version, mcp-session-id', 'access-control-allow-methods': 'POST, OPTIONS' }
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (req.method !== 'POST') return new Response(JSON.stringify(rpcError(null, -32000, 'Use POST. This server is stateless and does not open an SSE stream.')), { status: 405, headers: { ...headers, allow: 'POST, OPTIONS' } })
  let body: any
  try { body = await req.json() } catch { return new Response(JSON.stringify(rpcError(null, -32700, 'Parse error')), { status: 400, headers }) }
  const origin = new URL(req.url).origin
  const handle = async (m: any) => {
    if (m?.jsonrpc !== '2.0' || typeof m.method !== 'string') return rpcError(m?.id ?? null, -32600, 'Invalid request')
    if (m.id === undefined) return null // notification
    switch (m.method) {
      case 'initialize': return rpc(m.id, { protocolVersion: PROTOCOL, capabilities: { tools: { listChanged: false } }, serverInfo: { name: 'albretsen.no', title: 'Albretsen AS', version: '1.0.0' }, instructions: 'Read-only facts about Asgeir Albretsen, his company Albretsen AS, its products and writing.' })
      case 'ping': return rpc(m.id, {})
      case 'tools/list': return rpc(m.id, { tools: TOOLS })
      case 'tools/call': return rpc(m.id, await callTool(m.params?.name, m.params?.arguments ?? {}, env, origin))
      default: return rpcError(m.id, -32601, `Method not found: ${m.method}`)
    }
  }
  const replies = Array.isArray(body) ? (await Promise.all(body.map(handle))).filter(Boolean) : await handle(body)
  if (!replies || (Array.isArray(replies) && !replies.length)) return new Response(null, { status: 202, headers })
  return new Response(JSON.stringify(replies), { headers })
}

async function callTool(name: string, args: any, env: Env, origin: string) {
  const c = await content(env, origin)
  const line = (p: any) => `${p.name} (${p.status}, since ${p.since}): ${p.line}${p.figure ? ` ${p.figure.value} ${p.figure.label}.` : ''}${p.url ? ` ${p.url}` : ''}`
  switch (name) {
    case 'list_products': {
      const list = c.products.filter((p: any) => !args.status || p.status === args.status)
      return text(list.map(line).join('\n'), { products: list })
    }
    case 'get_product': {
      const p = c.products.find((x: any) => x.id === args.id)
      return p ? text(line(p) + (p.facts ? `\nFacts: ${p.facts.join('; ')}` : ''), p) : { ...text(`No product "${args.id}". Ids: ${c.products.map((x: any) => x.id).join(', ')}`), isError: true }
    }
    case 'list_posts': {
      const list = c.posts.filter((p: any) => !args.lang || p.lang === args.lang).map(({ md, ...p }: any) => p)
      return text(list.map((p: any) => `${p.date} · ${p.title} (${p.lang}) ${origin}${p.path}`).join('\n'), { posts: list })
    }
    case 'get_post': {
      const p = c.posts.find((x: any) => x.slug === args.slug && x.lang === (args.lang ?? 'en'))
      return p ? text(`# ${p.title}\n${p.date}\n\n${p.md}`) : { ...text(`No post "${args.slug}".`), isError: true }
    }
    case 'contact': return text(`${c.site.availability} Email: ${c.site.email}. Albretsen AS builds software products: apps, SaaS and infrastructure for AI agents.`)
    default: return { ...text(`Unknown tool: ${name}`), isError: true }
  }
}

/* ---------------------------------------------------------------- the event feed
   One Durable Object keeps the last 50 events and pushes new ones to open
   WebSockets. It uses the hibernation API, so idle sockets cost nothing. */
interface Ctx {
  storage: { get<T>(k: string): Promise<T | undefined>; put(k: string, v: unknown): Promise<void> }
  acceptWebSocket(ws: WebSocket): void
  getWebSockets(): WebSocket[]
}

export class Feed {
  ctx: Ctx
  env: Env
  constructor(ctx: Ctx, env: Env) { this.ctx = ctx; this.env = env }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url)
    const cors = { 'access-control-allow-origin': '*' }
    if (url.pathname === '/api/events/socket') {
      if (req.headers.get('upgrade') !== 'websocket') return new Response('Expected a WebSocket', { status: 426 })
      const pair = new (globalThis as any).WebSocketPair()
      this.ctx.acceptWebSocket(pair[1])
      return new Response(null, { status: 101, webSocket: pair[0] } as ResponseInit)
    }
    if (req.method === 'GET') {
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') ?? 12) || 12))
      const events = ((await this.ctx.storage.get<Json[]>('events')) ?? []).slice(0, limit)
      return Response.json({ events }, { headers: { ...cors, 'cache-control': 'no-store' } })
    }
    if (req.method === 'POST') {
      if (!this.env.FEED_KEY || req.headers.get('authorization') !== `Bearer ${this.env.FEED_KEY}`) return new Response('Unauthorized', { status: 401 })
      let e: any
      try { e = await req.json() } catch { return new Response('Bad JSON', { status: 400 }) }
      const event = clean(e)
      if (!event) return new Response('Invalid event', { status: 422 })
      const events = [event, ...((await this.ctx.storage.get<Json[]>('events')) ?? [])].slice(0, 50)
      await this.ctx.storage.put('events', events)
      const msg = JSON.stringify(event)
      for (const ws of this.ctx.getWebSockets()) { try { ws.send(msg) } catch { /* closed */ } }
      return Response.json({ ok: true }, { status: 201 })
    }
    return new Response('Method not allowed', { status: 405 })
  }

  webSocketMessage() { /* the feed is one-way */ }
  webSocketClose(ws: WebSocket) { try { ws.close() } catch { /* already closed */ } }
}

// Only anonymous, whitelisted fields are kept: never personal data.
export function clean(e: any): Json | null {
  if (!e || !PRODUCTS.has(e.product) || typeof e.text !== 'string' || !e.text.trim()) return null
  const out: Json = { product: e.product, label: LABELS[e.product], text: e.text.trim().slice(0, 80), time: new Date().toISOString() }
  if (typeof e.kind === 'string') out.kind = e.kind.slice(0, 40)
  if (typeof e.country === 'string') out.country = e.country.slice(0, 40)
  if (Number.isFinite(e.ms)) out.ms = Math.round(e.ms)
  return out
}
