const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const output = path.join(root, '_site');

// Only remove this known build directory, never a symlink or a computed parent.
if (path.dirname(output) !== root || path.basename(output) !== '_site') {
  throw new Error('Unexpected publication directory');
}
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) {
  throw new Error('The publication directory must not be a symlink');
}
fs.rmSync(output, { recursive: true, force: true });

// Publish only browser assets; source documents and local tooling stay out of Pages.
fs.mkdirSync(output, { recursive: true });
for (const file of ['index.html', 'gallery.html', 'robots.txt', 'sitemap.xml']) {
  fs.copyFileSync(path.join(root, file), path.join(output, file));
}
for (const directory of ['assets', 'src', 'react-demo/dist']) {
  fs.cpSync(path.join(root, directory), path.join(output, directory), { recursive: true });
}
fs.writeFileSync(path.join(output, '.nojekyll'), '');
console.log('Published assets prepared in _site/');
