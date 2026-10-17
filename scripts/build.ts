// Builds albretsen.no into dist/. Run: node scripts/build.ts
// Pages are rendered to static HTML with their CSS inlined; static assets are
// copied; every page gets a Markdown twin; budgets are checked at the end.
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { brotliCompressSync, constants } from 'node:zlib'
import { execFileSync } from 'node:child_process'
import { markdown, parseFront, stripTitle, esc } from '../site/markdown.ts'
import { home, buildPage, writePage, postPage, stackPage, notFound, type Post } from '../site/templates.ts'
import { site, products, dayJob, mcpClients } from '../site/data.ts'

const ROOT = new URL('..', import.meta.url).pathname
const DIST = join(ROOT, 'dist')
const SITE = join(ROOT, 'site')
const ARTICLES = join(ROOT, 'articles')

const minifyCss = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ').replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim()
const css = async (...names: string[]) => minifyCss((await Promise.all(names.map((n) => readFile(join(SITE, 'styles', n), 'utf8')))).join('\n'))

async function write(path: string, text: string) {
  const full = join(DIST, path)
  await mkdir(dirname(full), { recursive: true })
  await writeFile(full, text)
}

/* ---------------------------------------------------------------- articles */
async function loadPosts(): Promise<Post[]> {
  const entries = await readdir(ARTICLES, { withFileTypes: true })
  const files: { file: string; lang: 'en' | 'nb' }[] = []
  for (const e of entries) {
    if (e.isFile() && e.name.endsWith('.md')) files.push({ file: join(ARTICLES, e.name), lang: 'en' })
    if (e.isDirectory()) for (const lang of ['en', 'nb'] as const) if (existsSync(join(ARTICLES, e.name, `${lang}.md`))) files.push({ file: join(ARTICLES, e.name, `${lang}.md`), lang })
  }
  const posts: Post[] = []
  for (const { file, lang } of files) {
    const { front, body } = parseFront(await readFile(file, 'utf8'))
    const slug = String(front.slug)
    const path = lang === 'nb' ? `/nb/write/${slug}/` : `/write/${slug}/`
    const md = stripTitle(body)
    const html = markdown(md, (comment) => /interactive chart/i.test(comment) ? chartFigure(lang) : '')
    posts.push({ slug, lang, path, title: String(front.title), date: String(front.date), excerpt: String(front.excerpt ?? ''), tags: (front.tags as string[]) ?? [], html, md: body, alternates: [] })
  }
  for (const p of posts) p.alternates = posts.filter((q) => q.slug === p.slug).map((q) => ({ lang: q.lang, path: q.path })).sort((a, b) => (a.lang === 'en' ? -1 : 1))
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title))
}

// The S&P chart: a static SVG first (same box as the live chart), the module when scrolled to.
const CHART_DIR = join(SITE, 'charts', 'spx')
const hasChart = () => ['chart.js', 'chart.css', 'build-data.ts'].every((f) => existsSync(join(CHART_DIR, f))) && !process.env.NO_CHART
function chartFigure(lang: 'en' | 'nb') {
  if (!hasChart()) return ''
  // The pre-rendered chart markup: the live module redraws it in exactly the same box.
  const shell = readFileSync(join(DIST, 'assets', 'charts', 'spx', `spx-shell.${lang}.html`), 'utf8')
  return `<div class="figure-wide spx-slot" data-spx data-lang="${lang}">${shell}</div>`
}
const CHART_SCRIPT = `<script type="module">const el=document.querySelector('[data-spx]');if(el){const go=async()=>{const{mountSpxChart}=await import('/assets/charts/spx/chart.js');mountSpxChart(el,{lang:el.dataset.lang,dataUrl:'/assets/charts/spx/spx.json'})};new IntersectionObserver((e,o)=>{if(e[0].isIntersecting){o.disconnect();go()}},{rootMargin:'600px'}).observe(el)}</script>`

/* ---------------------------------------------------------------- markdown twins */
const mdHome = (posts: Post[]) => `# ${site.person} · ${site.company}

${site.line}
${site.sub}

## Products

${products.filter((p) => p.status !== 'retired').map((p) => `- **${p.name}** (${p.status}, since ${p.since}): ${p.line}${p.figure ? ` ${p.figure.value} ${p.figure.label}.` : ''} ${p.url}`).join('\n')}

Retired: ${products.filter((p) => p.status === 'retired').map((p) => `${p.name} (${p.since})`).join(', ')}.

## Writing

${posts.filter((p) => p.lang === 'en').map((p) => `- [${p.title}](${site.origin}${p.path}) (${p.date})`).join('\n')}

## Contact

${site.availability} ${site.email}

## MCP

${mcpClients.map((c) => `- ${c.name}: \`${c.text.replace(/\n/g, ' ')}\``).join('\n')}
`
const mdBuild = () => `# Products

${products.map((p) => `- **${p.name}** (${p.status}, since ${p.since}): ${p.line}${p.figure ? ` ${p.figure.value} ${p.figure.label}.` : ''}${p.url ? ` ${p.url}` : ''}`).join('\n')}

## Day job

${dayJob.map((d) => `- ${d}`).join('\n')}
`

/* ---------------------------------------------------------------- build */
async function main() {
  const t0 = performance.now()
  await rm(DIST, { recursive: true, force: true })
  await mkdir(DIST, { recursive: true })
  await cp(join(SITE, 'static'), DIST, { recursive: true })

  if (hasChart()) {
    const out = join(DIST, 'assets', 'charts', 'spx')
    await mkdir(out, { recursive: true })
    await cp(join(CHART_DIR, 'chart.js'), join(out, 'chart.js'))
    execFileSync(process.execPath, [join(CHART_DIR, 'build-data.ts'), out, '/assets/charts/spx/'], { stdio: 'inherit' })
  }

  const posts = await loadPosts()
  const enPosts = posts.filter((p) => p.lang === 'en')
  const homeCss = await css('base.css', 'home.css')
  const pageCss = await css('base.css', 'pages.css')

  await write('index.html', home(enPosts, homeCss))
  await write('build/index.html', buildPage(pageCss))
  await write('write/index.html', writePage(enPosts, pageCss))
  await write('stack/index.html', stackPage(pageCss))
  await write('404.html', notFound(pageCss))
  for (const p of posts) {
    const hasSpx = p.html.includes('data-spx')
    const postCss = hasSpx ? pageCss + minifyCss(await readFile(join(CHART_DIR, 'chart.css'), 'utf8')) : pageCss
    await write(p.path + 'index.html', postPage(p, postCss, hasSpx ? CHART_SCRIPT : ''))
    await write(p.path.replace(/\/$/, '.md'), p.md)
  }

  if (hasChart()) for (const l of ['en', 'nb']) await rm(join(DIST, 'assets', 'charts', 'spx', `spx-shell.${l}.html`), { force: true })

  // Markdown twins and machine files
  await write('index.md', mdHome(posts))
  await write('build.md', mdBuild())
  await write('write.md', `# Writing\n\n${enPosts.map((p) => `- [${p.title}](${site.origin}${p.path}) (${p.date}): ${p.excerpt}`).join('\n')}\n`)
  await write('stack.md', `# Stack\n\nStatic HTML from a small TypeScript build, served by a Cloudflare Worker. See ${site.origin}/stack/\n`)
  await write('llms.txt', `# ${site.person} · ${site.company}\n\n> ${site.description}\n\nAdd .md to any page path for Markdown. MCP server: ${site.mcpUrl}\n\n## Pages\n\n- [Home](${site.origin}/index.md)\n- [Products](${site.origin}/build.md)\n- [Writing](${site.origin}/write.md)\n- [Stack](${site.origin}/stack.md)\n\n## Posts\n\n${posts.map((p) => `- [${p.title}](${site.origin}${p.path.replace(/\/$/, '.md')}) (${p.lang})`).join('\n')}\n`)
  const pages = ['/', '/build/', '/write/', '/stack/', ...posts.map((p) => p.path)]
  await write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((p) => `<url><loc>${site.origin}${p}</loc></url>`).join('')}</urlset>\n`)
  await write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site.origin}/sitemap.xml\n`)
  await write('_headers', `/assets/*\n  Cache-Control: public, max-age=31536000, immutable\n/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n`)
  // Content for the MCP server, so the Worker never parses HTML.
  await write('api/content.json', JSON.stringify({ site, products, dayJob, posts: posts.map(({ html, alternates, ...p }) => p) }))

  await budgets()
  console.log(`built ${pages.length} pages in ${Math.round(performance.now() - t0)} ms`)
}

// The homepage's first response (HTML with inlined CSS) must fit in the first round trip.
async function budgets() {
  const BUDGET = 14 * 1024
  const rows: string[] = []
  let failed = false
  const walk = async (dir: string): Promise<string[]> => (await Promise.all((await readdir(dir, { withFileTypes: true })).map((e) => e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))).flat()
  for (const f of (await walk(DIST)).filter((f) => f.endsWith('.html'))) {
    const br = brotliCompressSync(await readFile(f), { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length
    const rel = f.slice(DIST.length)
    const limit = rel === '/index.html' ? BUDGET : 20 * 1024
    if (br > limit) failed = true
    rows.push(`${br > limit ? '✗' : '✓'} ${(br / 1024).toFixed(1).padStart(5)} KB br  ${rel}`)
  }
  const js = (await walk(join(DIST, 'assets', 'js'))).filter((f) => f.endsWith('.js'))
  for (const f of js) rows.push(`  ${((await stat(f)).size / 1024).toFixed(1).padStart(5)} KB raw ${f.slice(DIST.length)}`)
  console.log(rows.join('\n'))
  if (failed) { console.error('page budget exceeded'); process.exitCode = 1 }
}

main().catch((e) => { console.error(e); process.exit(1) })
