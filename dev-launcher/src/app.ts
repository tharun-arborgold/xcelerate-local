// Renderer process — runs in Chromium, no Node imports.
// window.api is injected by preload.ts. Types come from src/types.d.ts.

// ─── Store types ─────────────────────────────────────────────────────────────

// Distinguish local state type from the IPC return type (FrontendStatus in types.d.ts)
type FeSvcStatus   = 'stopped' | 'starting' | 'running' | 'stopping' | 'restarting'
type DockerStatus  = 'unknown'  | 'running'  | 'stopped' | 'starting' | 'stopping'   | 'restarting'
type InfraStatus   = 'unknown'  | 'running'  | 'stopped' | 'not_found'| 'starting'   | 'stopping'

interface FeSvcState {
  status: FeSvcStatus
  pid?:   number
  port?:  number
}

interface AppStore {
  slots:     Slot[]
  active:    Slot | null
  infra:     InfraStatus
  backends:  Record<string, DockerStatus>
  frontends: Record<string, FeSvcState>
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'INIT';              slots: Slot[]; activeSlotName: string | null }
  | { type: 'SELECT_SLOT';       slot: Slot }
  | { type: 'STATUS_POLL';       docker: DockerStatusMap; infraRaw: string; frontends: Record<string, FrontendStatus> }
  | { type: 'INFRA_START' }
  | { type: 'INFRA_STOP' }
  | { type: 'BACKENDS_START' }
  | { type: 'BACKENDS_STOP' }
  | { type: 'DOCKER_RESTART';    service: string }
  | { type: 'FRONTEND_START';    name: string }
  | { type: 'FRONTEND_STOP';     name: string }
  | { type: 'FRONTEND_RESTART';  name: string }
  | { type: 'FRONTEND_RESET';    name: string }  // force-clear a stuck transition

// ─── Locked-state sets ────────────────────────────────────────────────────────
// Services in these states are mid-transition — the poll must confirm the
// expected outcome before the state advances.  This prevents poll flicker.

const FE_LOCKED:     ReadonlySet<FeSvcStatus>  = new Set(['starting', 'stopping', 'restarting'])
const DOCKER_LOCKED: ReadonlySet<DockerStatus> = new Set(['starting', 'stopping', 'restarting'])
const INFRA_LOCKED:  ReadonlySet<InfraStatus>  = new Set(['starting', 'stopping'])

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reconcileDocker(current: DockerStatus, polled: 'running' | 'stopped'): DockerStatus {
  if (DOCKER_LOCKED.has(current)) {
    if (current === 'starting'   && polled === 'running')  return 'running'
    if (current === 'stopping'   && polled === 'stopped')  return 'stopped'
    if (current === 'restarting' && polled === 'running')  return 'running'
    return current
  }
  return polled
}

function reconcileFrontend(current: FeSvcState, polled: FrontendStatus): FeSvcState {
  if (FE_LOCKED.has(current.status)) {
    if (current.status === 'starting'   && polled.running)  return { status: 'running', pid: polled.pid ?? undefined, port: polled.port }
    if (current.status === 'stopping'   && !polled.running) return { status: 'stopped' }
    if (current.status === 'restarting' && polled.running)  return { status: 'running', pid: polled.pid ?? undefined, port: polled.port }
    return current  // stay locked
  }
  return polled.running
    ? { status: 'running', pid: polled.pid ?? undefined, port: polled.port }
    : { status: 'stopped' }
}

function reduce(s: AppStore, a: Action): AppStore {
  switch (a.type) {

    case 'INIT': {
      const active = a.slots.find(sl => sl.name === a.activeSlotName) ?? a.slots[0] ?? null
      return { ...s, slots: a.slots, active }
    }

    case 'SELECT_SLOT': {
      // Reset to neutral so locked states (starting/stopping) never leak across slots.
      // Pre-populate with 'unknown'/'stopped' so rows stay visible during the
      // brief window before the next poll fills in real values (~300ms).
      const backends: Record<string, DockerStatus> = {}
      BACKEND_SVCS.forEach(({ id }) => { backends[id] = 'unknown' })
      const frontends: Record<string, FeSvcState> = {}
      FRONTEND_SVCS.forEach(({ id }) => { frontends[id] = { status: 'stopped' } })
      return { ...s, active: a.slot, backends, frontends }
    }

    case 'STATUS_POLL': {
      if (!s.active) return s

      // Infra
      const ip: InfraStatus = a.infraRaw === 'running'   ? 'running'
        :                      a.infraRaw === 'not_found' ? 'not_found'
        :                                                    'stopped'
      let infra = s.infra
      if (INFRA_LOCKED.has(infra)) {
        if (infra === 'starting' && ip === 'running')      infra = 'running'
        if (infra === 'stopping' && ip !== 'running')      infra = ip
      } else {
        infra = ip
      }

      // Backends
      const backends = { ...s.backends }
      for (const [svc, p] of Object.entries(a.docker)) {
        backends[svc] = reconcileDocker(backends[svc] ?? 'unknown', p)
      }

      // Frontends
      const frontends = { ...s.frontends }
      for (const [name, p] of Object.entries(a.frontends)) {
        frontends[name] = reconcileFrontend(frontends[name] ?? { status: 'stopped' }, p)
      }

      return { ...s, infra, backends, frontends }
    }

    case 'INFRA_START':    return { ...s, infra: 'starting' }
    case 'INFRA_STOP':     return { ...s, infra: 'stopping' }

    case 'BACKENDS_START': {
      const backends = { ...s.backends }
      BACKEND_SVCS.forEach(({ id }) => { backends[id] = 'starting' })
      return { ...s, backends }
    }
    case 'BACKENDS_STOP': {
      const backends = { ...s.backends }
      BACKEND_SVCS.forEach(({ id }) => { backends[id] = 'stopping' })
      return { ...s, backends }
    }

    case 'DOCKER_RESTART':
      return { ...s, backends: { ...s.backends, [a.service]: 'restarting' } }

    case 'FRONTEND_START':
      return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'starting' } } }
    case 'FRONTEND_STOP':
      return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'stopping' } } }
    case 'FRONTEND_RESTART':
      return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'restarting' } } }
    case 'FRONTEND_RESET':
      return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'stopped' } } }

    default: return s
  }
}

// ─── Store & dispatch ─────────────────────────────────────────────────────────

const EMPTY: AppStore = { slots: [], active: null, infra: 'unknown', backends: {}, frontends: {} }
let store = EMPTY

function dispatch(action: Action): void {
  store = reduce(store, action)
  render()
}

// ─── Poll ─────────────────────────────────────────────────────────────────────

let pollTimer: ReturnType<typeof setInterval> | null = null

async function poll(): Promise<void> {
  if (!store.active) return
  try {
    const st = await window.api.status.get({ stackName: store.active.stackName, slotIdx: store.active.idx })
    dispatch({ type: 'STATUS_POLL', docker: st.docker, infraRaw: st.infra, frontends: st.frontends })
    const el = document.getElementById('last-updated')
    if (el) el.textContent = new Date().toLocaleTimeString()
  } catch { /* ignore transient errors */ }
}

function startPolling(): void {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(poll, 3_000)
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  const [slots, state] = await Promise.all([window.api.slots.list(), window.api.state.get()])
  dispatch({ type: 'INIT', slots, activeSlotName: state.activeSlot })
  await poll()
  startPolling()
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render(): void {
  renderSlotTabs()
  renderInfra()
  renderBackends()
  renderFrontends()
  renderLinks()
}

// ── Slot tabs ─────────────────────────────────────────────────────────────────

function renderSlotTabs(): void {
  document.getElementById('slot-tabs')!.innerHTML = store.slots.map(s => `
    <button class="slot-tab ${s.name === store.active?.name ? 'active' : ''}"
            onclick="selectSlot('${s.name}')">${s.name}</button>
  `).join('')
}

// ── Infra ─────────────────────────────────────────────────────────────────────

function renderInfra(): void {
  const st   = store.infra
  const busy = INFRA_LOCKED.has(st)

  const dotCls = busy             ? 'starting'
    : st === 'running'            ? 'running'
    : st === 'not_found'          ? 'unknown'
    :                               'stopped'

  const label  = st === 'starting' ? 'starting…'
    : st === 'stopping'            ? 'stopping…'
    : st === 'not_found'           ? 'not started'
    :                                 st

  document.getElementById('infra-section')!.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Infrastructure</span>
        <div class="card-actions">
          <button class="btn btn-ghost" ${busy ? 'disabled' : ''} onclick="doInfraStart()">
            ${st === 'starting' ? spinner() + ' Starting…' : 'Start SQL Server'}
          </button>
          <button class="btn btn-danger" ${busy ? 'disabled' : ''} onclick="doInfraStop()">Stop</button>
        </div>
      </div>
      <div class="svc-row">
        <div class="dot ${dotCls}"></div>
        <span class="svc-name">sql-server <span class="badge">shared</span></span>
        <span class="svc-port">:1433</span>
        <span class="svc-state">${label}</span>
        <div class="svc-btns"></div>
      </div>
    </div>
  `
}

// ── Backends ──────────────────────────────────────────────────────────────────

const BACKEND_SVCS: Array<{ id: string; portKey: keyof Ports }> = [
  { id: 'rabbitmq',           portKey: 'rabbitmqAmqp' },
  { id: 'contractor-backend', portKey: 'contractorBackend' },
  { id: 'corporate-backend',  portKey: 'corporateBackend' },
]

function renderBackends(): void {
  if (!store.active) return
  const anyBusy    = BACKEND_SVCS.some(({ id }) => DOCKER_LOCKED.has(store.backends[id] ?? 'unknown'))
  const anyRunning = BACKEND_SVCS.some(({ id }) => store.backends[id] === 'running')

  const rows = BACKEND_SVCS.map(({ id, portKey }) => {
    const st   = store.backends[id] ?? 'unknown'
    const busy = DOCKER_LOCKED.has(st)
    const port = store.active!.ports[portKey]

    const dotCls = busy             ? 'starting'
      : st === 'running'            ? 'running'
      : st === 'unknown'            ? 'unknown'
      :                               'stopped'
    const label  = busy ? st + '…' : st

    return `
      <div class="svc-row">
        <div class="dot ${dotCls}"></div>
        <span class="svc-name">${id}</span>
        <span class="svc-port">:${port}</span>
        <span class="svc-state">${label}</span>
        <div class="svc-btns">
          <button class="btn-icon" title="Logs"    onclick="doDockerLogs('${id}')">📋</button>
          <button class="btn-icon" title="Restart" ${busy ? 'disabled' : ''}
                  onclick="doDockerRestart('${id}')">${st === 'restarting' ? spinner() : '↺'}</button>
        </div>
      </div>
    `
  }).join('')

  document.getElementById('docker-section')!.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Backends</span>
        <div class="card-actions">
          ${anyBusy
            ? `<button class="btn btn-ghost" disabled>${spinner()} Working…</button>`
            : anyRunning
              ? `<button class="btn btn-danger" onclick="doBackendsStop()">Stop All</button>`
              : `<button class="btn btn-primary" onclick="doBackendsStart()">Start Backends</button>`
          }
        </div>
      </div>
      ${rows}
    </div>
  `
}

// ── Frontends ─────────────────────────────────────────────────────────────────

const FRONTEND_SVCS: Array<{ id: string; portKey: keyof Ports }> = [
  { id: 'contractor-frontend', portKey: 'contractorFrontend' },
  { id: 'corporate-frontend',  portKey: 'corporateFrontend' },
]

function renderFrontends(): void {
  if (!store.active) return

  const rows = FRONTEND_SVCS.map(({ id, portKey }) => {
    const fe   = store.frontends[id] ?? { status: 'stopped' as FeSvcStatus }
    const st   = fe.status
    const busy = FE_LOCKED.has(st)
    const port = store.active!.ports[portKey]

    const dotCls = busy             ? 'starting'
      : st === 'running'            ? 'running'
      :                               'stopped'

    const label  = busy             ? st + '…'
      : st === 'running'            ? 'running'
      :                               'stopped'

    let btns: string
    if (busy) {
      btns = `<button class="btn btn-ghost" disabled>${spinner()} ${cap(st)}…</button>`
    } else if (st === 'running') {
      btns = `
        <button class="btn-icon" title="Logs"    onclick="doFrontendLogs('${id}')">📋</button>
        <button class="btn-icon" title="Restart" onclick="doFrontendRestart('${id}')">↺</button>
        <button class="btn btn-danger"           onclick="doFrontendStop('${id}')">Stop</button>
      `
    } else {
      btns = `<button class="btn btn-primary" onclick="doFrontendStart('${id}')">Start</button>`
    }

    return `
      <div class="svc-row">
        <div class="dot ${dotCls}"></div>
        <span class="svc-name">${id}</span>
        <span class="svc-port">:${port}</span>
        <span class="svc-state">${label}</span>
        <div class="svc-btns">
          ${btns}
          <button class="btn-icon" title="Open" onclick="openUrl('http://localhost:${port}')">↗</button>
        </div>
      </div>
    `
  }).join('')

  document.getElementById('frontend-section')!.innerHTML = `
    <div class="card">
      <div class="card-header"><span class="card-title">Frontends (ng serve)</span></div>
      ${rows}
    </div>
  `
}

// ── Quick links ───────────────────────────────────────────────────────────────

function renderLinks(): void {
  if (!store.active) return
  const p = store.active.ports
  const links = [
    { icon: '🏗', label: 'Contractor App', url: `http://localhost:${p.contractorFrontend}` },
    { icon: '🏢', label: 'Corporate App',  url: `http://localhost:${p.corporateFrontend}` },
    { icon: '🐰', label: 'RabbitMQ UI',    url: `http://localhost:${p.rabbitmqMgmt}` },
    { icon: '⚙',  label: 'Contractor API', url: `http://localhost:${p.contractorBackend}/actuator/health` },
    { icon: '⚙',  label: 'Corporate API',  url: `http://localhost:${p.corporateBackend}/actuator/health` },
  ]
  document.getElementById('links-section')!.innerHTML = `
    <div class="card">
      <div class="card-header"><span class="card-title">Quick Links</span></div>
      <div class="links-grid">
        ${links.map(l =>
          `<button class="link-btn" onclick="openUrl('${l.url}')">
            <span class="licon">${l.icon}</span>${l.label}
          </button>`
        ).join('')}
      </div>
    </div>
  `
}

// ─── Action handlers (async side effects + dispatch) ─────────────────────────

// Timeouts that auto-reset a stuck transition after 5 minutes
const feTimeouts: Record<string, ReturnType<typeof setTimeout>> = {}

function armFeTimeout(name: string): void {
  if (feTimeouts[name]) clearTimeout(feTimeouts[name])
  feTimeouts[name] = setTimeout(() => {
    if (FE_LOCKED.has(store.frontends[name]?.status)) {
      dispatch({ type: 'FRONTEND_RESET', name })
      toast(`${name}: timed out — check logs`)
    }
  }, 5 * 60_000)
}

async function selectSlot(name: string): Promise<void> {
  const slot = store.slots.find(s => s.name === name)
  if (!slot || slot.name === store.active?.name) return
  dispatch({ type: 'SELECT_SLOT', slot })
  await window.api.state.set({ activeSlot: slot.name })
  await poll()
}

async function doInfraStart(): Promise<void> {
  dispatch({ type: 'INFRA_START' })
  toast('Starting SQL Server…')
  await window.api.infra.up()
  toast('')
}

async function doInfraStop(): Promise<void> {
  dispatch({ type: 'INFRA_STOP' })
  await window.api.infra.down()
}

async function doBackendsStart(): Promise<void> {
  if (!store.active) return
  dispatch({ type: 'BACKENDS_START' })
  toast(`Starting backends for ${store.active.name}…`)
  await window.api.stack.up({ slotName: store.active.name, profile: 'backends' })
  toast('')
}

async function doBackendsStop(): Promise<void> {
  if (!store.active) return
  dispatch({ type: 'BACKENDS_STOP' })
  toast(`Stopping ${store.active.name}…`)
  await window.api.stack.down({ slotName: store.active.name })
  toast('')
}

async function doDockerRestart(service: string): Promise<void> {
  if (!store.active) return
  dispatch({ type: 'DOCKER_RESTART', service })
  toast(`Restarting ${service}…`)
  await window.api.docker.restart({ stackName: store.active.stackName, service })
  toast('')
}

async function doFrontendStart(name: string): Promise<void> {
  if (!store.active) return
  dispatch({ type: 'FRONTEND_START', name })
  toast(`${name} compiling… (~60s)`)
  armFeTimeout(name)

  const result = await window.api.frontend.start({ name, slotIdx: store.active.idx })
  if (result.error) {
    dispatch({ type: 'FRONTEND_RESET', name })
    clearTimeout(feTimeouts[name])
    toast(`Error: ${result.error}`)
  }
}

async function doFrontendStop(name: string): Promise<void> {
  dispatch({ type: 'FRONTEND_STOP', name })
  toast(`Stopping ${name}…`)
  await window.api.frontend.stop({ name })
  toast('')
}

async function doFrontendRestart(name: string): Promise<void> {
  if (!store.active) return
  dispatch({ type: 'FRONTEND_RESTART', name })
  toast(`${name} restarting… (compiling)`)
  armFeTimeout(name)

  await window.api.frontend.stop({ name })
  await delay(400)
  const result = await window.api.frontend.start({ name, slotIdx: store.active.idx })
  if (result.error) {
    dispatch({ type: 'FRONTEND_RESET', name })
    clearTimeout(feTimeouts[name])
    toast(`Error: ${result.error}`)
  }
}

function openUrl(url: string): void {
  window.api.url.open(url)
}

// ─── Log drawer ───────────────────────────────────────────────────────────────

let logTimer:  ReturnType<typeof setInterval> | null = null
let logTarget: { type: 'docker' | 'frontend'; id: string } | null = null

async function doDockerLogs(service: string): Promise<void> {
  if (!store.active) return
  logTarget = { type: 'docker', id: service }
  openLogDrawer(`${service} — docker logs`)
  await refreshLogs()
  if (logTimer) clearInterval(logTimer)
  logTimer = setInterval(refreshLogs, 3_000)
}

async function doFrontendLogs(name: string): Promise<void> {
  logTarget = { type: 'frontend', id: name }
  openLogDrawer(`${name} — ng serve`)
  await refreshLogs()
  if (logTimer) clearInterval(logTimer)
  logTimer = setInterval(refreshLogs, 3_000)
}

async function refreshLogs(): Promise<void> {
  if (!logTarget || !store.active) return
  const content = logTarget.type === 'docker'
    ? await window.api.docker.logs({ stackName: store.active.stackName, service: logTarget.id })
    : await window.api.frontend.logs({ name: logTarget.id })
  const el = document.getElementById('log-body')
  if (el) { el.textContent = content; el.scrollTop = el.scrollHeight }
}

function openLogDrawer(title: string): void {
  document.getElementById('log-title')!.textContent = title
  document.getElementById('log-drawer')!.classList.add('open')
}

function closeLogDrawer(): void {
  document.getElementById('log-drawer')!.classList.remove('open')
  logTarget = null
  if (logTimer) { clearInterval(logTimer); logTimer = null }
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function toast(msg: string): void {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = msg
  el.classList.toggle('visible', msg.length > 0)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function spinner(): string { return '<span class="spin">⟳</span>' }
function cap(s: string):    string { return s.charAt(0).toUpperCase() + s.slice(1) }
function delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

// ─── Globals for inline onclick ───────────────────────────────────────────────

;(window as any).selectSlot         = selectSlot
;(window as any).doInfraStart       = doInfraStart
;(window as any).doInfraStop        = doInfraStop
;(window as any).doBackendsStart    = doBackendsStart
;(window as any).doBackendsStop     = doBackendsStop
;(window as any).doDockerRestart    = doDockerRestart
;(window as any).doFrontendStart    = doFrontendStart
;(window as any).doFrontendStop     = doFrontendStop
;(window as any).doFrontendRestart  = doFrontendRestart
;(window as any).openUrl            = openUrl
;(window as any).doDockerLogs       = doDockerLogs
;(window as any).doFrontendLogs     = doFrontendLogs
;(window as any).refreshLogs        = refreshLogs
;(window as any).closeLogDrawer     = closeLogDrawer

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('log-close')!.addEventListener('click', closeLogDrawer)
  boot()
})
