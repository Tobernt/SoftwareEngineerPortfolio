// Run the actual Firefox Accessibility Inspector in an isolated browser profile.
const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
class Marionette {
  constructor(socket) {
    this.socket = socket;
    this.buffer = Buffer.alloc(0);
    this.id = 0;
    this.pending = new Map();
    socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk]);
      while (true) {
        const colon = this.buffer.indexOf(58);
        if (colon < 0) return;
        const length = Number(this.buffer.subarray(0, colon).toString());
        if (this.buffer.length < colon + 1 + length) return;
        const message = JSON.parse(this.buffer.subarray(colon + 1, colon + 1 + length));
        this.buffer = this.buffer.subarray(colon + 1 + length);
        if (!Array.isArray(message)) continue;
        const pending = this.pending.get(message[1]);
        if (!pending) continue;
        clearTimeout(pending.timer);
        this.pending.delete(message[1]);
        message[2]
          ? pending.reject(new Error(JSON.stringify(message[2])))
          : pending.resolve(message[3]);
      }
    });
  }
  send(command, parameters = {}) {
    const id = ++this.id,
      json = JSON.stringify([0, id, command, parameters]);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Firefox timed out: ${command}`)), 55000);
      this.pending.set(id, { resolve, reject, timer });
      this.socket.write(Buffer.byteLength(json) + ':' + json);
    });
  }
  async script(script, async = false) {
    const result = await this.send(
      async ? 'WebDriver:ExecuteAsyncScript' : 'WebDriver:ExecuteScript',
      {
        script,
        args: [],
        newSandbox: false,
        sandbox: 'default',
        scriptTimeout: 50000,
      },
    );
    if (result.value?.error) throw new Error(result.value.error);
    return result.value;
  }
}
async function main() {
  const root = path.resolve(__dirname, '..'),
    output = path.join(root, 'docs/evidence');
  const temporary = path.join(root, '.studio-test-data');
  fs.mkdirSync(temporary, { recursive: true });
  const profile = fs.mkdtempSync(path.join(temporary, 'firefox-audit-'));
  const port = 2831;
  const preferences = {
    'marionette.port': port,
    'marionette.enabled': true,
    'browser.shell.checkDefaultBrowser': false,
    'browser.startup.homepage_override.mstone': 'ignore',
    'browser.aboutwelcome.enabled': false,
    'browser.startup.page': 0,
    'devtools.chrome.enabled': true,
    'devtools.debugger.remote-enabled': true,
    'devtools.debugger.prompt-connection': false,
    'devtools.toolbox.footer.height': 500,
    'accessibility.force_disabled': 0,
    'toolkit.telemetry.reportingpolicy.firstRun': false,
  };
  fs.writeFileSync(
    path.join(profile, 'user.js'),
    Object.entries(preferences)
      .map(([key, value]) => `user_pref(${JSON.stringify(key)},${JSON.stringify(value)});`)
      .join('\n'),
  );
  const executable = process.env.FIREFOX_PATH || 'C:/Program Files/Mozilla Firefox/firefox.exe';
  const firefox = spawn(
    executable,
    ['--headless', '--no-remote', '--profile', profile, '--marionette', 'about:blank'],
    {
      windowsHide: true,
      stdio: 'ignore',
      env: { ...process.env, MOZ_REMOTE_ALLOW_SYSTEM_ACCESS: '1' },
    },
  );
  let client;
  try {
    let socket;
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        socket = await new Promise((resolve, reject) => {
          const connection = net.connect(port, '127.0.0.1');
          connection.once('connect', () => resolve(connection));
          connection.once('error', reject);
        });
        break;
      } catch {
        await delay(200);
      }
    }
    if (!socket) throw new Error('Could not connect to the isolated Firefox audit profile.');
    client = new Marionette(socket);
    await client.send('WebDriver:NewSession', { capabilities: {} });
    await client.send('WebDriver:SetWindowRect', { width: 1440, height: 1100 });
    for (const [name, page] of [
      ['home', '/'],
      ['gallery', '/gallery.html'],
    ]) {
      await client.send('Marionette:SetContext', { value: 'content' });
      await client.send('WebDriver:Navigate', { url: `http://127.0.0.1:4173${page}` });
      await client.send('Marionette:SetContext', { value: 'chrome' });
      const result = await client.script(
        `
        const done=arguments[arguments.length-1];
        (async()=>{
          const {require}=ChromeUtils.importESModule('resource://devtools/shared/loader/Loader.sys.mjs');
          const {gDevTools}=require('resource://devtools/client/framework/devtools.js');
          const win=Services.wm.getMostRecentWindow('navigator:browser');
          const toolbox=await gDevTools.showToolboxForTab(win.gBrowser.selectedTab,{toolId:'accessibility'});
          const panel=toolbox.getPanel('accessibility');
          if(!panel.accessibilityProxy.enabled)await panel.accessibilityProxy.enableAccessibility();
          await panel.forceRefresh();
          const constants=require('resource://devtools/client/accessibility/constants.js');
          const audit=await panel.accessibilityProxy.audit(constants.FILTERS.ALL,()=>{});
          const store=panel.panelWin.view.store;
          store.dispatch({type:constants.AUDIT,response:audit.ancestries||[]});
          store.dispatch({type:constants.FILTER_TOGGLE,filter:constants.FILTERS.ALL});
          await new Promise(resolve=>win.setTimeout(resolve,800));
          await panel.accessibilityProxy.unhighlightAccessible();
          const issues=(audit.ancestries||[]).map(chain=>chain.map(node=>({role:node.accessible.role,name:node.accessible.name,checks:node.accessible.checks})));
          return {filter:'ALL',auditError:audit.error||null,issueCount:issues.length,issues,uiText:panel.panelWin.document.body.innerText,browser:'Firefox '+Services.appinfo.version,url:win.gBrowser.currentURI.spec};
        })().then(done,error=>done({error:error.stack}));
      `,
        true,
      );
      const screenshot = await client.send('WebDriver:TakeScreenshot', {
        full: false,
        scroll: false,
      });
      fs.writeFileSync(
        path.join(output, `firefox-${name}.png`),
        Buffer.from(screenshot.value, 'base64'),
      );
      console.log(`${result.browser} ${name}: ${result.issueCount} inspector findings`);
      await client.script(
        `const {require}=ChromeUtils.importESModule('resource://devtools/shared/loader/Loader.sys.mjs');const {gDevTools}=require('resource://devtools/client/framework/devtools.js');return gDevTools.closeToolboxForTab(Services.wm.getMostRecentWindow('navigator:browser').gBrowser.selectedTab);`,
      );
      if (name === 'gallery') {
        await client.send('Marionette:SetContext', { value: 'content' });
        const before = await client.script("return document.querySelector('#volume').value;");
        const element = await client.send('WebDriver:FindElement', {
          using: 'css selector',
          value: '#volume',
        });
        await client.send('WebDriver:ElementSendKeys', {
          id: Object.values(element.value)[0],
          text: '\uE014',
        });
        const after = await client.script("return document.querySelector('#volume').value;");
        result.sliderKeyboardCheck = {
          key: 'ArrowRight',
          before,
          after,
          passed: Number(after) > Number(before),
        };
        if (!result.sliderKeyboardCheck.passed)
          throw new Error('The gallery slider did not respond to the keyboard.');
      }
      fs.writeFileSync(path.join(output, `firefox-${name}.json`), JSON.stringify(result, null, 2));
    }
  } finally {
    if (client) {
      for (const item of client.pending.values()) clearTimeout(item.timer);
      client.socket.destroy();
    }
    firefox.kill();
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
