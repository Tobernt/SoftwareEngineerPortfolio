const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function build() {
  const root = path.resolve(__dirname, '..'),
    output = path.join(root, 'OfflineStyleStudio');
  const publicRoot = path.join(output, 'public');
  if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) {
    throw new Error('The offline output folder must not be a symlink.');
  }
  // Rebuild generated browser files only. The user's data folder is preserved.
  if (
    path.dirname(output) !== root ||
    path.dirname(publicRoot) !== output ||
    (fs.existsSync(publicRoot) && fs.lstatSync(publicRoot).isSymbolicLink())
  )
    throw new Error('Unexpected offline output directory.');
  fs.rmSync(publicRoot, { recursive: true, force: true });
  fs.mkdirSync(path.join(publicRoot, 'sites/portfolio'), { recursive: true });
  for (const file of ['index.html', 'gallery.html'])
    fs.copyFileSync(path.join(root, file), path.join(publicRoot, 'sites/portfolio', file));
  for (const dir of ['assets', 'src'])
    fs.cpSync(path.join(root, dir), path.join(publicRoot, 'sites/portfolio', dir), {
      recursive: true,
    });
  fs.mkdirSync(path.join(publicRoot, 'studio/lib'), { recursive: true });
  for (const file of [
    'index.html',
    'studio.css',
    'app.mjs',
    'theme.css',
    'preview.mjs',
    'typography.mjs',
  ])
    fs.copyFileSync(path.join(root, 'studio', file), path.join(publicRoot, 'studio', file));
  for (const file of ['model.mjs', 'catalog.mjs', 'style-rules.mjs'])
    fs.copyFileSync(path.join(root, 'studio/lib', file), path.join(publicRoot, 'studio/lib', file));
  fs.cpSync(path.join(root, 'studio/lib'), path.join(output, 'lib'), {
    recursive: true,
  });
  fs.copyFileSync(path.join(root, 'studio/server.mjs'), path.join(output, 'server.mjs'));
  fs.mkdirSync(path.join(output, 'runtime'), { recursive: true });
  const runtime = path.join(output, 'runtime', path.basename(process.execPath));
  if (!fs.existsSync(runtime) || fs.statSync(runtime).size !== fs.statSync(process.execPath).size)
    fs.copyFileSync(process.execPath, runtime);
  const license = path.join(path.dirname(process.execPath), 'LICENSE');
  if (fs.existsSync(license)) fs.copyFileSync(license, path.join(output, 'runtime/LICENSE'));
  fs.writeFileSync(
    path.join(output, 'Start Style Studio.cmd'),
    '@echo off\r\ncd /d "%~dp0"\r\n"%~dp0runtime\\node.exe" "%~dp0server.mjs" --open\r\nif errorlevel 1 pause\r\n',
  );
  fs.writeFileSync(
    path.join(output, 'READ-ME.txt'),
    'Double-click Start Style Studio.cmd. This Windows package includes Node.js and needs no internet connection or installation. Your projects are saved in data/library.json. Keep the data folder when moving or rebuilding the app. Use Backup library inside the editor for a portable project backup. The ZIP export creates a website, separate from the editor.\n',
  );
  if (process.argv.includes('--zip')) {
    const { zipFiles } = await import(pathToFileURL(path.join(root, 'studio/lib/zip.mjs')));
    const walk = (dir, prefix = '') =>
      fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((entry) => prefix !== '' || entry.name !== 'data')
        .flatMap((entry) =>
          entry.isDirectory()
            ? walk(path.join(dir, entry.name), prefix + entry.name + '/')
            : [[prefix + entry.name, fs.readFileSync(path.join(dir, entry.name))]],
        );
    fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'dist/StyleStudio-Windows-offline.zip'),
      zipFiles(walk(output)),
    );
  }
  console.log(`Offline app ready: ${output}`);
}
build().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
