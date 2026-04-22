import { app, BrowserWindow, ipcMain, shell, IpcMainInvokeEvent, nativeImage, Menu } from 'electron'
import { exec, spawn, execSync }  from 'child_process'
import * as http  from 'http'
import * as https from 'https'
import * as path from 'path'
import * as fs   from 'fs'
import * as os   from 'os'

// ─── Paths ───────────────────────────────────────────────────────────────────

const WORKSPACE  = path.join(os.homedir(), 'repo', 'xcelerate')
const LOCAL_DIR  = path.join(WORKSPACE, 'xcelerate-local')
const RUN_DIR    = path.join(LOCAL_DIR, 'run')
const STATE_FILE = path.join(__dirname, '..', '.state.json')

const ENV: NodeJS.ProcessEnv = {
  ...process.env,
  PATH: `/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH ?? ''}`,
}

// ─── App identity ─────────────────────────────────────────────────────────────

app.name = 'Xcelerate Dev'
const ICON = nativeImage.createFromPath(path.join(__dirname, '..', 'assets', 'icon.png'))

// ─── Window ──────────────────────────────────────────────────────────────────

function createWindow(): void {
  const win = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0d0d1a',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
    },
  })
  win.maximize()
  win.loadFile(path.join(__dirname, '..', 'dist', 'renderer', 'index.html'))
}

// ─── Hot-reload (dev only) ────────────────────────────────────────────────────
if (!app.isPackaged) {
  try {
    require('electron-reload')(__dirname, {
      electron:        process.execPath,
      hardResetMethod: 'exit',
    })
  } catch { /* not installed */ }
}

// ─── Single-instance guard ───────────────────────────────────────────────────

if (!app.requestSingleInstanceLock()) {
  // A window is already open — quit this new instance immediately
  app.quit()
  process.exit(0)
}

app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0]
  if (win) { if (win.isMinimized()) win.restore(); win.focus() }
})

// ─── Ready ───────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  if (process.platform === 'darwin') app.dock.setIcon(ICON)

  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: 'Xcelerate Dev',
      submenu: [
        { role: 'about', label: 'About Xcelerate Dev' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', label: 'Quit Xcelerate Dev' },
      ],
    },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    { role: 'windowMenu' },
  ]))

  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// ─── Persistence ─────────────────────────────────────────────────────────────

function readState(): AppState {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) as AppState }
  catch { return { activeSlot: null, feTargets: {} } }
}

function writeState(s: Partial<AppState>): AppState {
  const next = { ...readState(), ...s }
  fs.writeFileSync(STATE_FILE, JSON.stringify(next, null, 2))
  return next
}

// ─── Shell ───────────────────────────────────────────────────────────────────

function sh(cmd: string, cwd = LOCAL_DIR): Promise<ShellResult> {
  return new Promise(resolve => {
    exec(cmd, { cwd, env: ENV, shell: '/bin/zsh', timeout: 30_000 }, (err, stdout, stderr) => {
      resolve({ ok: !err, stdout: stdout.trim(), stderr: stderr.trim() })
    })
  })
}

// ─── Slots ───────────────────────────────────────────────────────────────────

function computePorts(idx: number): Ports {
  const base = 8080 + idx * 100
  return {
    contractorBackend:     base,
    corporateBackend:      base + 1,
    integrationServices:   base + 4,
    companycamIntegration: base + 5,
    encircleIntegration:   base + 6,
    zappierIntegration:    base + 13,
    swaggerIntegration:    base + 14,
    rabbitmqAmqp:          5672  + idx,
    rabbitmqMgmt:          15672 + idx,
    contractorFrontend:    4200  + idx,
    corporateFrontend:     4300  + idx,
    formsFrontend:         4400  + idx,
  }
}

function readSlots(): Slot[] {
  const envDir = path.join(LOCAL_DIR, 'envs')
  return fs.readdirSync(envDir)
    .filter(f => f.endsWith('.env'))
    .map(f => {
      const text = fs.readFileSync(path.join(envDir, f), 'utf8')
      const get  = (key: string): string => text.match(new RegExp(`^${key}=(.+)`, 'm'))?.[1]?.trim() ?? ''
      const idx  = parseInt(get('SLOT_INDEX') || '0', 10)
      return {
        name:      f.replace('.env', ''),
        stackName: get('STACK_NAME'),
        idx,
        ports:     computePorts(idx),
      } satisfies Slot
    })
    .sort((a, b) => a.idx - b.idx)
}

// ─── Docker ──────────────────────────────────────────────────────────────────

async function getDockerStatus(stackName: string): Promise<DockerStatusMap> {
  const { stdout } = await sh(
    `docker ps -a --filter "name=${stackName}-" --format "{{.Names}}\\t{{.Status}}"`
  )
  const map: DockerStatusMap = {}
  for (const line of stdout.split('\n').filter(Boolean)) {
    const [name, ...rest] = line.split('\t')
    const svc = name.replace(`${stackName}-`, '').replace(/-\d+$/, '')
    map[svc]  = rest.join('\t').startsWith('Up') ? 'running' : 'stopped'
  }
  return map
}

async function getInfraStatus(): Promise<string> {
  const { stdout } = await sh(
    `docker inspect --format '{{.State.Status}}' xcel-sqlserver 2>/dev/null || echo "not_found"`
  )
  return stdout.trim()
}

// ─── HTTP readiness check ─────────────────────────────────────────────────────

function checkHttp(url: string): Promise<boolean> {
  return new Promise(resolve => {
    const mod = url.startsWith('https') ? https : http
    try {
      const req = mod.get(url, { timeout: 1500 }, res => { resolve(true); res.destroy() })
      req.on('error',   () => resolve(false))
      req.on('timeout', () => { req.destroy(); resolve(false) })
    } catch { resolve(false) }
  })
}

// ─── Frontend processes ───────────────────────────────────────────────────────

function ensureRunDir(): void {
  if (!fs.existsSync(RUN_DIR)) fs.mkdirSync(RUN_DIR, { recursive: true })
}

/**
 * Port-based status detection — checks only the given port (the active slot's
 * expected port for this service). lsof is the source of truth; no PID files.
 */
function getFrontendStatus(port: number): FrontendStatus {
  try {
    const out = execSync(`lsof -ti :${port} 2>/dev/null`, { timeout: 2000, encoding: 'utf8' }).trim()
    if (!out) return { running: false, pid: null }
    const pid = parseInt(out.split('\n')[0], 10)
    return { running: true, pid: isNaN(pid) ? null : pid, port }
  } catch {
    return { running: false, pid: null }
  }
}

/**
 * Kill everything related to this frontend service:
 * 1. Any process listening on any slot's port for this service (lsof-based)
 * 2. The PID-file process group (handles processes still compiling, not yet listening)
 */
function killFrontend(name: string): void {
  const slots = readSlots()
  for (const slot of slots) {
    const port = name === 'contractor-frontend'
      ? slot.ports.contractorFrontend
      : slot.ports.corporateFrontend
    try {
      const out = execSync(`lsof -ti :${port} 2>/dev/null`, { timeout: 2000, encoding: 'utf8' }).trim()
      for (const pidStr of out.split('\n').filter(Boolean)) {
        const pid = parseInt(pidStr, 10)
        if (!isNaN(pid)) try { process.kill(pid, 'SIGTERM') } catch { /* ignore */ }
      }
    } catch { /* nothing on this port */ }
  }
  // Also kill process group from PID file (catches processes still compiling)
  const pidFile = path.join(RUN_DIR, `${name}.pid`)
  try {
    const pid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10)
    if (!isNaN(pid)) {
      try { process.kill(-pid, 'SIGTERM') } catch { try { process.kill(pid, 'SIGTERM') } catch { /* ignore */ } }
    }
  } catch { /* no pid file */ }
  try { fs.unlinkSync(pidFile) } catch { /* ignore */ }
}

// ─── IPC ─────────────────────────────────────────────────────────────────────

ipcMain.handle('slots:list', () => readSlots())
ipcMain.handle('state:get',  () => readState())
ipcMain.handle('state:set',  (_: IpcMainInvokeEvent, s: Partial<AppState>) => writeState(s))
ipcMain.handle('url:open',   (_: IpcMainInvokeEvent, url: string) => shell.openExternal(url))

ipcMain.handle('status:get', async (_: IpcMainInvokeEvent, { stackName, slotIdx }: { stackName: string; slotIdx: number }): Promise<AllStatus> => {
  const ports = computePorts(slotIdx)
  const [docker, infra,
    cbReady, corpReady, integReady, companycamReady, encircleReady, zappierReady, swaggerReady, rmqReady,
    cfReady, corpFeReady, formsReady,
  ] = await Promise.all([
    getDockerStatus(stackName),
    getInfraStatus(),
    checkHttp(`http://localhost:${ports.contractorBackend}/actuator/health`),
    checkHttp(`http://localhost:${ports.corporateBackend}/actuator/health`),
    checkHttp(`http://localhost:${ports.integrationServices}/actuator/health`),
    checkHttp(`http://localhost:${ports.companycamIntegration}/actuator/health`),
    checkHttp(`http://localhost:${ports.encircleIntegration}/actuator/health`),
    checkHttp(`http://localhost:${ports.zappierIntegration}/actuator/health`),
    checkHttp(`http://localhost:${ports.swaggerIntegration}/actuator/health`),
    checkHttp(`http://localhost:${ports.rabbitmqMgmt}`),
    checkHttp(`http://localhost:${ports.contractorFrontend}`),
    checkHttp(`http://localhost:${ports.corporateFrontend}`),
    checkHttp(`http://localhost:${ports.formsFrontend}`),
  ])
  return {
    docker,
    dockerReady: {
      'contractor-backend':    cbReady,
      'corporate-backend':     corpReady,
      'integration-services':  integReady,
      'companycam-integration': companycamReady,
      'encircle-integration':  encircleReady,
      'zappier-integration':   zappierReady,
      'swagger-integration':   swaggerReady,
      'rabbitmq':              rmqReady,
    },
    infra,
    frontends: {
      'contractor-frontend': { ...getFrontendStatus(ports.contractorFrontend), ready: cfReady },
      'corporate-frontend':  { ...getFrontendStatus(ports.corporateFrontend),  ready: corpFeReady },
      'forms':               { ...getFrontendStatus(ports.formsFrontend),       ready: formsReady },
    },
  }
})

ipcMain.handle('stack:up',   (_: IpcMainInvokeEvent, { slotName, profile }: { slotName: string; profile: string }) =>
  sh(`./stack up ${slotName} ${profile}`)
)
ipcMain.handle('stack:down', (_: IpcMainInvokeEvent, { slotName }: { slotName: string }) =>
  sh(`./stack down ${slotName}`)
)
ipcMain.handle('infra:up',   () => sh('./stack infra up'))
ipcMain.handle('infra:down', () => sh('./stack infra down'))

ipcMain.handle('docker:start', (_: IpcMainInvokeEvent, { stackName, service }: { stackName: string; service: string }) =>
  sh(`docker start ${stackName}-${service}-1`)
)

ipcMain.handle('docker:restart', (_: IpcMainInvokeEvent, { stackName, service }: { stackName: string; service: string }) =>
  sh(`docker restart ${stackName}-${service}-1`)
)

ipcMain.handle('docker:stop', (_: IpcMainInvokeEvent, { stackName, service }: { stackName: string; service: string }) =>
  sh(`docker stop ${stackName}-${service}-1`)
)

ipcMain.handle('docker:logs', async (_: IpcMainInvokeEvent, { stackName, service, lines = 80 }: { stackName: string; service: string; lines?: number }): Promise<string> => {
  const { stdout, stderr } = await sh(`docker logs --tail ${lines} ${stackName}-${service}-1 2>&1`)
  return stdout || stderr || '(no output)'
})

ipcMain.handle('frontend:start', (_: IpcMainInvokeEvent, { name, slotIdx, targetUrl, isRemote, envLabel }: { name: string; slotIdx: number; targetUrl: string; isRemote: boolean; envLabel: string }): StartFrontendResult => {
  ensureRunDir()

  const frontendDirs: Record<string, string> = {
    'contractor-frontend': path.join(WORKSPACE, 'xcelerate-contractor-frontend'),
    'corporate-frontend':  path.join(WORKSPACE, 'xcelerate-corporate-frontend'),
    'forms':               path.join(WORKSPACE, 'xcelerate-forms'),
  }
  const dir = frontendDirs[name]
  if (!dir || !fs.existsSync(dir)) return { error: `Not found: ${dir}` }

  killFrontend(name)   // kill any existing process

  const ports    = computePorts(slotIdx)
  const servPort = name === 'contractor-frontend' ? ports.contractorFrontend
    : name === 'corporate-frontend'              ? ports.corporateFrontend
    :                                              ports.formsFrontend

  // Write proxy.conf.json — local slots strip /xcelerate prefix; remote envs keep it
  const proxyEntry = isRemote
    ? { target: targetUrl, secure: true,  changeOrigin: true, logLevel: 'info' }
    : { target: targetUrl, secure: false, changeOrigin: true, pathRewrite: { '^/xcelerate': '' }, logLevel: 'info' }

  fs.writeFileSync(path.join(dir, 'proxy.conf.json'), JSON.stringify({ '/xcelerate': proxyEntry }, null, 2))

  // Rewrite environment.local.ts — replace the xceleraterestoration.com base URL
  // so the Angular app calls the correct backend directly (env file takes precedence over proxy)
  const envFile = path.join(dir, 'src', 'environments', 'environment.local.ts')
  if (fs.existsSync(envFile)) {
    const backPort  = name === 'contractor-frontend' ? ports.contractorBackend  : ports.corporateBackend
    const frontPort = name === 'contractor-frontend' ? ports.contractorFrontend : ports.corporateFrontend
    const newBase   = isRemote ? targetUrl.replace(/\/$/, '') : `http://localhost:${backPort}`
    const content   = fs.readFileSync(envFile, 'utf8')
    let updated: string
    if (isRemote) {
      // Remote: replace host only — /xcelerate path stays as-is
      updated = content.replace(
        /https?:\/\/(?:[a-z0-9-]+\.xceleraterestoration\.com|localhost:\d+)/g, newBase)
    } else {
      // Local: strip /xcelerate path for all API URLs (backend has no context path),
      // then override dataUrl to frontend port — it's a tenant identifier matched against
      // rest_comp_url in the DB (seeded as http://localhost:4200/), not the backend URL.
      updated = content.replace(
        /https?:\/\/(?:[a-z0-9-]+\.xceleraterestoration\.com|localhost:\d+)(?:\/xcelerate)?/g, newBase)
      updated = updated.replace(
        /(dataUrl:\s*['"])http:\/\/localhost:\d+(\/['"])/,
        `$1http://localhost:${frontPort}$2`)
    }
    updated = updated.replace(/(prefix:\s*['"])[^'"]*(['"])/, `$1${envLabel}$2`)
    fs.writeFileSync(envFile, updated, 'utf8')
  }

  const logFile = path.join(RUN_DIR, `${name}.log`)
  const pidFile = path.join(RUN_DIR, `${name}.pid`)

  const out  = fs.openSync(logFile, 'w')
  const proc = spawn('/bin/zsh', [
    '-c',
    `node --max_old_space_size=8192 ./node_modules/@angular/cli/bin/ng serve --configuration=local --port=${servPort}`,
  ], { cwd: dir, detached: true, stdio: ['ignore', out, out], env: ENV })

  proc.unref()
  // PID file is only used by killFrontend during compilation (before the port is listening)
  fs.writeFileSync(pidFile, String(proc.pid))
  return { pid: proc.pid, port: servPort }
})

ipcMain.handle('frontend:stop', (_: IpcMainInvokeEvent, { name }: { name: string }) => {
  killFrontend(name)
  return { ok: true }
})

ipcMain.handle('git:branches', async (): Promise<Record<string, string>> => {
  const repos: Record<string, string> = {
    'contractor-backend':    path.join(WORKSPACE, 'xcelerate-contractor-backend'),
    'corporate-backend':     path.join(WORKSPACE, 'xcelerate-corporate-backend'),
    'integration-services':  path.join(WORKSPACE, 'xcelerate-integration-services'),
    'companycam-integration': path.join(WORKSPACE, 'xcelerate-companycam-integration'),
    'encircle-integration':  path.join(WORKSPACE, 'xcelerate-encircle-integration'),
    'zappier-integration':   path.join(WORKSPACE, 'xcelerate-zappier-integration'),
    'swagger-integration':   path.join(WORKSPACE, 'xcelerate-swagger-integration'),
    'contractor-frontend':   path.join(WORKSPACE, 'xcelerate-contractor-frontend'),
    'corporate-frontend':    path.join(WORKSPACE, 'xcelerate-corporate-frontend'),
    'forms':                 path.join(WORKSPACE, 'xcelerate-forms'),
  }
  const entries = await Promise.all(
    Object.entries(repos).map(async ([name, dir]) => {
      if (!fs.existsSync(dir)) return [name, '?'] as const
      const { stdout } = await sh('git branch --show-current', dir)
      return [name, stdout || 'detached'] as const
    })
  )
  return Object.fromEntries(entries)
})

ipcMain.handle('frontend:logs', async (_: IpcMainInvokeEvent, { name, lines = 80 }: { name: string; lines?: number }): Promise<string> => {
  const logFile = path.join(RUN_DIR, `${name}.log`)
  if (!fs.existsSync(logFile)) return '(no log yet)'
  const { stdout } = await sh(`tail -n ${lines} "${logFile}"`, __dirname)
  return stdout || '(empty)'
})
