/*
 * Free site audit. GET /api/audit?url=example.com
 *
 * Fetches a page, its robots.txt and its sitemap, then scores twenty checks.
 * Nothing is stored: the response is built in memory and returned.
 *
 * SECURITY, READ BEFORE EDITING
 * This function fetches a URL a stranger typed in, which is a server-side
 * request forgery vector. Vercel's runtime can reach the cloud metadata
 * endpoint at 169.254.169.254, so an unguarded fetch here would let anyone
 * use this box to read internal addresses. Every hostname is resolved and
 * checked against the private ranges BEFORE any request goes out, redirects
 * are followed by hand so each hop gets the same check, and both the time and
 * the number of bytes read are capped.
 */

const dns = require('dns').promises;

const TIMEOUT_MS = 8000;
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const UA = 'KoomBeiSiteAudit/1.0 (+https://www.koombei.com/pages/site-audit)';

/* ---------- SSRF guards ---------- */

function isPrivateIPv4(ip) {
  const p = ip.split('.').map(Number);
  if (p.length !== 4 || p.some(n => Number.isNaN(n))) return true;
  if (p[0] === 10) return true;                                  // 10/8
  if (p[0] === 127) return true;                                 // loopback
  if (p[0] === 0) return true;                                   // this network
  if (p[0] === 172 && p[1] >= 16 && p[1] <= 31) return true;     // 172.16/12
  if (p[0] === 192 && p[1] === 168) return true;                 // 192.168/16
  if (p[0] === 169 && p[1] === 254) return true;                 // link-local, cloud metadata
  if (p[0] === 100 && p[1] >= 64 && p[1] <= 127) return true;    // carrier NAT
  if (p[0] >= 224) return true;                                  // multicast and reserved
  return false;
}

function isPrivateIPv6(ip) {
  const a = ip.toLowerCase();
  if (a === '::1' || a === '::') return true;
  if (a.startsWith('fc') || a.startsWith('fd')) return true;     // unique local
  if (a.startsWith('fe80')) return true;                         // link-local
  if (a.startsWith('::ffff:')) return isPrivateIPv4(a.split(':').pop());
  return false;
}

async function assertPublicHost(hostname) {
  if (!hostname || hostname === 'localhost' || hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal') || hostname.endsWith('.local')) {
    throw new Error('That address is not reachable from the public internet.');
  }
  let records;
  try {
    records = await dns.lookup(hostname, { all: true });
  } catch (e) {
    throw new Error('We could not find that domain. Check the spelling.');
  }
  if (!records.length) throw new Error('We could not find that domain. Check the spelling.');
  for (const r of records) {
    const bad = r.family === 6 ? isPrivateIPv6(r.address) : isPrivateIPv4(r.address);
    if (bad) throw new Error('That address is not reachable from the public internet.');
  }
}

/* Follows redirects by hand so every hop is checked, not just the first. */
async function safeFetch(rawUrl, { asText = true } = {}) {
  let current = rawUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const u = new URL(current);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      throw new Error('Only http and https addresses can be audited.');
    }
    await assertPublicHost(u.hostname);

    const started = Date.now();
    const res = await fetch(u.href, {
      redirect: 'manual',
      headers: { 'User-Agent': UA, 'Accept': '*/*' },
      signal: AbortSignal.timeout(TIMEOUT_MS)
    });

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      current = new URL(res.headers.get('location'), u.href).href;
      continue;
    }

    let body = '';
    if (asText && res.body) {
      // Cap the read so a huge file cannot exhaust the function.
      const reader = res.body.getReader();
      const chunks = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > MAX_BYTES) { try { reader.cancel(); } catch (e) {} break; }
        chunks.push(value);
      }
      body = Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8');
    }

    return {
      url: u.href, status: res.status, ok: res.ok, body,
      bytes: Buffer.byteLength(body), ms: Date.now() - started,
      headers: res.headers, secure: u.protocol === 'https:'
    };
  }
  throw new Error('That address redirects too many times.');
}

/* ---------- Parsing helpers (regex, not a DOM: no dependencies) ---------- */

const tag = (html, re) => { const m = html.match(re); return m ? (m[1] || '').trim() : ''; };
const meta = (html, name) =>
  tag(html, new RegExp('<meta[^>]+name=["\']' + name + '["\'][^>]*content=["\']([^"\']*)', 'i')) ||
  tag(html, new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*name=["\']' + name + '["\']', 'i'));
const prop = (html, p) =>
  tag(html, new RegExp('<meta[^>]+property=["\']' + p + '["\'][^>]*content=["\']([^"\']*)', 'i')) ||
  tag(html, new RegExp('<meta[^>]+content=["\']([^"\']*)["\'][^>]*property=["\']' + p + '["\']', 'i'));

function strip(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------- The checks ---------- */

function runChecks(page, robots, sitemap) {
  const html = page.body;
  const out = [];
  // weight: how much of the score this check is worth. fix: what to actually do.
  const add = (id, label, group, weight, pass, detail, fix) =>
    out.push({ id, label, group, weight, pass: pass === true, warn: pass === 'warn', detail, fix });

  /* Findable */
  const title = tag(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
  add('title', 'Page title', 'Findable', 3, !!title,
    title ? '"' + title.slice(0, 70) + '"' : 'No title tag found',
    'Add a <title>. It is the line Google shows as the clickable heading.');
  add('title-length', 'Title length', 'Findable', 2,
    title ? (title.length >= 30 && title.length <= 65 ? true : 'warn') : false,
    title ? title.length + ' characters' : 'No title',
    'Aim for 30 to 65 characters. Shorter wastes the space, longer gets cut off.');

  const desc = meta(html, 'description');
  add('description', 'Meta description', 'Findable', 3, !!desc,
    desc ? desc.length + ' characters' : 'Missing',
    'Write one sentence that makes someone click. Google falls back to scraping your page without it.');
  add('description-length', 'Description length', 'Findable', 1,
    desc ? (desc.length >= 70 && desc.length <= 165 ? true : 'warn') : false,
    desc ? desc.length + ' characters' : 'Missing',
    'Aim for 70 to 165 characters.');

  const h1s = (html.match(/<h1[\s>]/gi) || []).length;
  add('h1', 'One H1 heading', 'Findable', 2, h1s === 1 ? true : (h1s === 0 ? false : 'warn'),
    h1s + ' found',
    'Exactly one H1 per page tells search engines what the page is about.');

  const canonical = tag(html, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']*)/i);
  add('canonical', 'Canonical link', 'Findable', 2, !!canonical,
    canonical || 'Missing',
    'Stops the same page competing with itself when it is reachable at several addresses.');

  add('robots', 'robots.txt', 'Findable', 2, robots.ok,
    robots.ok ? 'Found' : 'Not found',
    'Tells crawlers what to read. Without it they guess.');
  add('sitemap', 'XML sitemap', 'Findable', 3, sitemap.ok,
    sitemap.ok ? 'Found' : 'Not found at /sitemap.xml',
    'Lists every page you want indexed, so new pages get found in days instead of weeks.');
  add('sitemap-in-robots', 'Sitemap listed in robots.txt', 'Findable', 1,
    robots.ok && /sitemap:/i.test(robots.body),
    robots.ok ? (/sitemap:/i.test(robots.body) ? 'Listed' : 'Not listed') : 'No robots.txt',
    'Add a "Sitemap:" line to robots.txt so crawlers find it without guessing.');

  /* Shareable */
  add('og-title', 'Open Graph title', 'Shareable', 2, !!prop(html, 'og:title'),
    prop(html, 'og:title') ? 'Set' : 'Missing',
    'Controls the headline when the link is pasted into WhatsApp or LinkedIn.');
  add('og-description', 'Open Graph description', 'Shareable', 1, !!prop(html, 'og:description'),
    prop(html, 'og:description') ? 'Set' : 'Missing',
    'The grey line under the headline in a link preview.');
  add('og-image', 'Open Graph image', 'Shareable', 3, !!prop(html, 'og:image'),
    prop(html, 'og:image') ? 'Set' : 'Missing',
    'Without it your link shares as a bare grey box. This is the single most visible miss on most sites.');
  add('twitter-card', 'Twitter card', 'Shareable', 1,
    !!meta(html, 'twitter:card'),
    meta(html, 'twitter:card') || 'Missing',
    'Set twitter:card to summary_large_image for a full-width preview.');

  /* Understood by machines */
  const ld = (html.match(/application\/ld\+json/gi) || []).length;
  add('structured-data', 'Structured data', 'Understood', 3, ld > 0,
    ld > 0 ? ld + ' JSON-LD block' + (ld > 1 ? 's' : '') : 'None found',
    'JSON-LD is how you become a fact an AI assistant can quote rather than prose it has to interpret.');
  add('lang', 'Language declared', 'Understood', 1,
    /<html[^>]+lang=["'][a-z]{2}/i.test(html),
    /<html[^>]+lang=/i.test(html) ? 'Set' : 'Missing',
    'Add lang to the <html> tag. Screen readers need it to pick a voice.');
  add('charset', 'Character set', 'Understood', 1,
    /<meta[^>]+charset=/i.test(html),
    /<meta[^>]+charset=/i.test(html) ? 'Declared' : 'Missing',
    'Without it, accented characters can render as mojibake.');

  /* Usable */
  add('viewport', 'Mobile viewport', 'Usable', 3,
    /<meta[^>]+name=["']viewport["']/i.test(html),
    /<meta[^>]+name=["']viewport["']/i.test(html) ? 'Set' : 'Missing',
    'Without this the page renders at desktop width on a phone and every visitor has to pinch to zoom.');

  const imgs = html.match(/<img[^>]*>/gi) || [];
  const noAlt = imgs.filter(i => !/\salt=/i.test(i)).length;
  add('img-alt', 'Image alt text', 'Usable', 2,
    imgs.length === 0 ? true : (noAlt === 0 ? true : (noAlt <= 2 ? 'warn' : false)),
    imgs.length ? noAlt + ' of ' + imgs.length + ' images missing alt' : 'No images',
    'Alt text is what a blind visitor hears and what Google reads. Decorative images get alt="".');

  add('favicon', 'Favicon', 'Usable', 1,
    /<link[^>]+rel=["'][^"']*icon/i.test(html),
    /<link[^>]+rel=["'][^"']*icon/i.test(html) ? 'Set' : 'Missing',
    'The small square in the browser tab. Its absence reads as unfinished.');

  /* Fast and safe */
  add('https', 'HTTPS', 'Fast and safe', 3, page.secure,
    page.secure ? 'Secure' : 'Not secure',
    'Browsers mark plain http as Not Secure in the address bar.');
  add('page-weight', 'HTML weight', 'Fast and safe', 2,
    page.bytes < 100000 ? true : (page.bytes < 250000 ? 'warn' : false),
    Math.round(page.bytes / 1024) + ' KB of HTML',
    'Under 100 KB of markup keeps the page usable on a slow mobile connection.');
  add('ttfb', 'Server response', 'Fast and safe', 2,
    page.ms < 800 ? true : (page.ms < 2000 ? 'warn' : false),
    page.ms + ' ms',
    'Over two seconds to respond and visitors leave before anything is drawn.');

  const words = strip(html).split(' ').filter(Boolean).length;
  add('content', 'Readable content', 'Understood', 2,
    words >= 300 ? true : (words >= 100 ? 'warn' : false),
    words + ' words',
    'Thin pages rarely rank. Around 300 words is a sensible floor for a page meant to be found.');

  return out;
}

function scoreOf(checks) {
  const total = checks.reduce((s, c) => s + c.weight, 0);
  const got = checks.reduce((s, c) => s + (c.pass ? c.weight : c.warn ? c.weight * 0.5 : 0), 0);
  return Math.round((got / total) * 100);
}

/* ---------- Handler ---------- */

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const raw = (req.query && req.query.url) ||
    (req.url && new URL(req.url, 'http://x').searchParams.get('url')) || '';
  const input = String(raw).trim();

  if (!input) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'Enter a website address.' }));
  }

  let target;
  try {
    target = new URL(/^https?:\/\//i.test(input) ? input : 'https://' + input);
  } catch (e) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'That does not look like a website address.' }));
  }

  try {
    const page = await safeFetch(target.href);
    if (!page.ok) {
      res.statusCode = 200;
      return res.end(JSON.stringify({
        error: 'That page returned ' + page.status + '. Check the address and try again.'
      }));
    }

    const origin = new URL(page.url).origin;
    const soft = async (u) => {
      try { return await safeFetch(u); } catch (e) { return { ok: false, body: '', status: 0 }; }
    };
    const [robots, sitemap] = await Promise.all([
      soft(origin + '/robots.txt'),
      soft(origin + '/sitemap.xml')
    ]);

    const checks = runChecks(page, robots, sitemap);
    res.statusCode = 200;
    return res.end(JSON.stringify({
      url: page.url,
      score: scoreOf(checks),
      checked: checks.length,
      passed: checks.filter(c => c.pass).length,
      warned: checks.filter(c => c.warn).length,
      failed: checks.filter(c => !c.pass && !c.warn).length,
      checks
    }));
  } catch (e) {
    res.statusCode = 200;
    return res.end(JSON.stringify({ error: e.message || 'We could not reach that site.' }));
  }
};
