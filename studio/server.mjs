import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { normalizeLibrary, seedLibrary, pageFilename } from './lib/model.mjs';
import { renderBuilder, decorateHTML } from './lib/render.mjs';
import { zipFiles } from './lib/zip.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const option = (name) =>
  process.argv
    .find((arg) => arg.startsWith(`--${name}=`))
    ?.split('=')
    .slice(1)
    .join('=');
const publicRoot = path.resolve(
  option('root') ||
    (fs.existsSync(path.join(here, 'public'))
      ? path.join(here, 'public')
      : path.join(here, '../OfflineStyleStudio/public')),
);
const dataRoot = path.resolve(option('data-dir') || path.join(publicRoot, '../data'));
const port = Number(option('port') || 4387);
if (!Number.isInteger(port) || port < 1024 || port > 65535)
  throw new Error('Choose a port between 1024 and 65535.');
if (!fs.existsSync(publicRoot))
  throw new Error('Build the offline app first: npm run build:offline');
fs.mkdirSync(dataRoot, { recursive: true });
const libraryPath = path.join(dataRoot, 'library.json');
if (!fs.existsSync(libraryPath))
  fs.writeFileSync(libraryPath, JSON.stringify({ revision: 0, library: seedLibrary() }, null, 2));
const origin = `http://127.0.0.1:${port}`;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

function readState() {
  const state = JSON.parse(fs.readFileSync(libraryPath, 'utf8'));
  return { revision: state.revision, library: normalizeLibrary(state.library) };
}
function reply(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, {
    'Content-Type': type,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}
async function body(req) {
  if (
    req.headers['x-style-studio'] !== 'local' ||
    (req.headers.origin && req.headers.origin !== origin)
  )
    throw Object.assign(new Error('Open the editor from its local address.'), {
      status: 403,
    });
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 25000000) throw new Error('The library is too large. Use fewer local fonts.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}
function baseHTML(project, page) {
  if (page.source === 'builder') return renderBuilder(project, page);
  return fs.readFileSync(
    path.join(
      publicRoot,
      'sites/portfolio',
      page.source === 'gallery' ? 'gallery.html' : 'index.html',
    ),
    'utf8',
  );
}
function walk(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name),
      relative = `${prefix}${entry.name}`;
    return entry.isDirectory() ? walk(file, relative + '/') : [[relative, fs.readFileSync(file)]];
  });
}
const previewServer = `const http=require('http'),fs=require('fs'),path=require('path'),{spawn}=require('child_process');const root=__dirname;const port=Number(process.argv.find(arg=>arg.startsWith('--port='))?.slice(7)||4390);http.createServer((req,res)=>{try{const url=new URL(req.url,'http://localhost');const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(root+path.sep))throw Error();const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.svg':'image/svg+xml'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>{const url='http://127.0.0.1:'+port;console.log('Website: '+url+' (Ctrl+C to stop)');if(process.platform==='win32'&&!process.argv.includes('--no-open'))spawn('cmd',['/c','start','',url],{windowsHide:true});});`;

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, origin);
    if (url.pathname === '/health')
      return reply(res, 200, { app: 'portfolio-style-studio', version: 1 });
    if (url.pathname === '/api/library' && req.method === 'GET')
      return reply(res, 200, readState());
    if (url.pathname === '/api/library' && req.method === 'POST') {
      const input = await body(req),
        current = readState();
      if (input.revision !== current.revision)
        return reply(res, 409, {
          error: 'Another window saved this library. Export your draft as a backup, then reload.',
        });
      const state = {
        revision: current.revision + 1,
        library: normalizeLibrary(input.library),
      };
      fs.copyFileSync(libraryPath, path.join(dataRoot, 'library.previous.json'));
      const temporary = path.join(dataRoot, 'library.next.json');
      fs.writeFileSync(temporary, JSON.stringify(state, null, 2));
      fs.renameSync(temporary, libraryPath);
      return reply(res, 200, { revision: state.revision });
    }
    if (url.pathname === '/api/preview' && req.method === 'POST') {
      const input = await body(req),
        library = normalizeLibrary({
          version: 1,
          fonts: input.fonts || [],
          recipes: [],
          projects: [input.project],
        });
      const project = library.projects[0],
        page = project.pages.find((page) => page.id === input.pageId);
      if (!page) throw new Error('Choose a page to preview.');
      const html = decorateHTML(baseHTML(project, page), project, page, library.fonts, {
        preview: true,
        base: `${origin}/sites/portfolio/`,
        stylesheet: `${origin}/studio/theme.css`,
        bridge: `${origin}/studio/preview.mjs`,
      });
      return reply(res, 200, html, 'text/html; charset=utf-8');
    }
    if (url.pathname === '/api/export' && req.method === 'POST') {
      const input = await body(req),
        library = normalizeLibrary({
          version: 1,
          fonts: input.fonts || [],
          recipes: [],
          projects: [input.project],
        });
      const project = library.projects[0];
      const usedFonts = new Set(
        [project.theme, ...project.pages.map((page) => page.theme).filter(Boolean)].flatMap(
          (theme) => [theme.headingFont, theme.bodyFont],
        ),
      );
      const exportFonts = library.fonts.filter((font) => usedFonts.has(`custom:${font.id}`));
      const entries = project.pages.some((page) => page.source !== 'builder')
        ? walk(path.join(publicRoot, 'sites/portfolio')).filter(
            ([name]) => name !== 'index.html' && name !== 'gallery.html',
          )
        : [
            [
              'assets/styles.css',
              fs.readFileSync(path.join(publicRoot, 'sites/portfolio/assets/styles.css')),
            ],
          ];
      entries.push([
        'assets/design.css',
        fs.readFileSync(path.join(publicRoot, 'studio/theme.css')),
      ]);
      entries.push([
        'assets/design-typography.mjs',
        fs.readFileSync(path.join(publicRoot, 'studio/typography.mjs')),
      ]);
      project.pages.forEach((page, index) =>
        entries.push([
          pageFilename(page, index),
          decorateHTML(baseHTML(project, page), project, page, exportFonts),
        ]),
      );
      entries.push([
        'design-recipe.json',
        JSON.stringify(
          {
            kind: 'style-studio-project',
            version: 1,
            project,
            fonts: exportFonts,
          },
          null,
          2,
        ),
      ]);
      entries.push(['preview.cjs', previewServer]);
      entries.push([
        'Start Website.cmd',
        '@echo off\r\ncd /d "%~dp0"\r\nnode preview.cjs\r\nif errorlevel 1 pause\r\n',
      ]);
      entries.push([
        'READ-ME.txt',
        'Unzip this folder. On Windows, double-click Start Website.cmd (Node.js must be installed). No internet connection is needed to run the site. You can also serve this directory with any static web server, or upload its browser files to your web host. External contact and social links require the relevant app or internet connection.\n',
      ]);
      const zip = zipFiles(entries);
      res.writeHead(200, {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="website.zip"',
        'Content-Length': zip.length,
      });
      return res.end(zip);
    }
    if (!['GET', 'HEAD'].includes(req.method))
      return reply(res, 405, { error: 'Unsupported request.' });
    const pathname = url.pathname === '/' ? '/studio/index.html' : url.pathname;
    let file = path.resolve(publicRoot, '.' + decodeURIComponent(pathname));
    if (!file.startsWith(publicRoot + path.sep))
      return reply(res, 403, { error: 'Invalid file path.' });
    if (fs.existsSync(file) && fs.statSync(file).isDirectory())
      file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) return reply(res, 404, { error: 'File not found.' });
    res.writeHead(200, {
      'Content-Type': types[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    return res.end(req.method === 'HEAD' ? '' : fs.readFileSync(file));
  } catch (error) {
    reply(res, error.status || 400, {
      error: error.message || 'The request could not be completed.',
    });
  }
});
function openBrowser() {
  if (process.platform === 'win32')
    spawn('cmd', ['/c', 'start', '', origin], {
      windowsHide: true,
      stdio: 'ignore',
    }).unref();
  else if (process.platform === 'darwin') spawn('open', [origin], { stdio: 'ignore' }).unref();
}
server.on('error', async (error) => {
  if (error.code === 'EADDRINUSE' && process.argv.includes('--open')) {
    try {
      const existing = await (await fetch(origin + '/health')).json();
      if (existing.app === 'portfolio-style-studio') {
        openBrowser();
        return;
      }
    } catch {}
  }
  console.error(`Cannot start Style Studio: ${error.message}. Try --port=4388.`);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(
    `Style Studio: ${origin}\nProjects: ${libraryPath}\nClose this window or press Ctrl+C to stop.`,
  );
  if (process.argv.includes('--open')) openBrowser();
});
