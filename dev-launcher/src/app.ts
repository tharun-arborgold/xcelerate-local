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
  branches:  Record<string, string>   // service → git branch
  feTargets: Record<string, string>   // frontend name → target key (slot name or env label)
}

// ─── Backend targets ──────────────────────────────────────────────────────────

interface BackendTarget { label: string; url: string; isRemote: boolean }

const REMOTE_ENVS: BackendTarget[] = [
  { label: 'dev',   url: 'https://dev.xceleraterestoration.com',   isRemote: true },
  { label: 'dev1',  url: 'https://dev1.xceleraterestoration.com',  isRemote: true },
  { label: 'dev2',  url: 'https://dev2.xceleraterestoration.com',  isRemote: true },
  { label: 'dev3',  url: 'https://dev3.xceleraterestoration.com',  isRemote: true },
  { label: 'dev4',  url: 'https://dev4.xceleraterestoration.com',  isRemote: true },
  { label: 'dev5',  url: 'https://dev5.xceleraterestoration.com',  isRemote: true },
  { label: 'uat',   url: 'https://uat.xceleraterestoration.com',   isRemote: true },
  { label: 'prod',  url: 'https://api-prod.xceleraterestoration.com', isRemote: true },
]

function allTargets(feName: string): BackendTarget[] {
  const local: BackendTarget[] = store.slots.map(slot => {
    const ports = slot.ports
    const url = feName === 'contractor-frontend'
      ? `http://localhost:${ports.contractorBackend}`
      : `http://localhost:${ports.corporateBackend}`
    return { label: slot.name, url, isRemote: false }
  })
  return [...local, ...REMOTE_ENVS]
}

function resolveTarget(feName: string): BackendTarget {
  const key = store.feTargets[feName] ?? store.active?.name ?? ''
  return allTargets(feName).find(t => t.label === key) ?? allTargets(feName)[0]
}

// ─── Actions ─────────────────────────────────────────────────────────────────

type Action =
  | { type: 'BRANCHES_UPDATED'; branches: Record<string, string> }
  | { type: 'INIT';              slots: Slot[]; activeSlotName: string | null }
  | { type: 'SELECT_SLOT';       slot: Slot }
  | { type: 'STATUS_POLL';       docker: DockerStatusMap; dockerReady: Record<string, boolean>; infraRaw: string; frontends: Record<string, FrontendStatus> }
  | { type: 'INFRA_START' }
  | { type: 'INFRA_STOP' }
  | { type: 'BACKENDS_START' }
  | { type: 'BACKENDS_STOP' }
  | { type: 'DOCKER_RESTART';    service: string }
  | { type: 'DOCKER_STOP';       service: string }
  | { type: 'FRONTEND_START';    name: string }
  | { type: 'FRONTEND_STOP';     name: string }
  | { type: 'FRONTEND_RESTART';  name: string }
  | { type: 'FRONTEND_RESET';    name: string }  // force-clear a stuck transition
  | { type: 'FE_TARGET_SET';    name: string; targetKey: string }

// ─── Locked-state sets ────────────────────────────────────────────────────────
// Services in these states are mid-transition — the poll must confirm the
// expected outcome before the state advances.  This prevents poll flicker.

const FE_LOCKED:     ReadonlySet<FeSvcStatus>  = new Set(['starting', 'stopping', 'restarting'])
const DOCKER_LOCKED: ReadonlySet<DockerStatus> = new Set(['starting', 'stopping', 'restarting'])
const INFRA_LOCKED:  ReadonlySet<InfraStatus>  = new Set(['starting', 'stopping'])

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reconcileDocker(current: DockerStatus, polled: 'running' | 'stopped', ready: boolean): DockerStatus {
  if (DOCKER_LOCKED.has(current)) {
    if (current === 'starting'   && polled === 'running'  && ready) return 'running'
    if (current === 'stopping'   && polled === 'stopped')           return 'stopped'
    if (current === 'restarting' && polled === 'running'  && ready) return 'running'
    return current   // stay locked until HTTP confirms ready
  }
  return polled
}

function reconcileFrontend(current: FeSvcState, polled: FrontendStatus): FeSvcState {
  if (FE_LOCKED.has(current.status)) {
    if (current.status === 'starting'   && polled.running && polled.ready)  return { status: 'running', pid: polled.pid ?? undefined, port: polled.port }
    if (current.status === 'stopping'   && !polled.running)                 return { status: 'stopped' }
    if (current.status === 'restarting' && polled.running && polled.ready)  return { status: 'running', pid: polled.pid ?? undefined, port: polled.port }
    return current  // stay locked until HTTP confirms ready
  }
  return polled.running
    ? { status: 'running', pid: polled.pid ?? undefined, port: polled.port }
    : { status: 'stopped' }
}

function reduce(s: AppStore, a: Action): AppStore {
  switch (a.type) {

    case 'INIT': {
      const active = a.slots.find(sl => sl.name === a.activeSlotName) ?? a.slots[0] ?? null
      const feTargets: Record<string, string> = {}
      FRONTEND_SVCS.forEach(({ id }) => { feTargets[id] = active?.name ?? '' })
      return { ...s, slots: a.slots, active, feTargets }
    }

    case 'SELECT_SLOT': {
      const backends: Record<string, DockerStatus> = {}
      BACKEND_SVCS.forEach(({ id }) => { backends[id] = 'unknown' })
      const frontends: Record<string, FeSvcState> = {}
      FRONTEND_SVCS.forEach(({ id }) => { frontends[id] = { status: 'stopped' } })
      const feTargets: Record<string, string> = {}
      FRONTEND_SVCS.forEach(({ id }) => { feTargets[id] = a.slot.name })
      return { ...s, active: a.slot, backends, frontends, feTargets }
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
        backends[svc] = reconcileDocker(backends[svc] ?? 'unknown', p, a.dockerReady[svc] ?? false)
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
    case 'DOCKER_STOP':
      return { ...s, backends: { ...s.backends, [a.service]: 'stopping' } }

    case 'FRONTEND_START':
      return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'starting' } } }
    case 'FRONTEND_STOP':
      return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'stopping' } } }
    case 'FRONTEND_RESTART':
      return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'restarting' } } }
    case 'FRONTEND_RESET':
      return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'stopped' } } }

    case 'FE_TARGET_SET':
      return { ...s, feTargets: { ...s.feTargets, [a.name]: a.targetKey } }

    case 'BRANCHES_UPDATED':
      return { ...s, branches: a.branches }

    default: return s
  }
}

// ─── Store & dispatch ─────────────────────────────────────────────────────────

const EMPTY: AppStore = { slots: [], active: null, infra: 'unknown', backends: {}, frontends: {}, branches: {}, feTargets: {} }
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
    dispatch({ type: 'STATUS_POLL', docker: st.docker, dockerReady: st.dockerReady, infraRaw: st.infra, frontends: st.frontends })
    const el = document.getElementById('last-updated')
    if (el) el.textContent = new Date().toLocaleTimeString()
  } catch { /* ignore transient errors */ }
}

function startPolling(): void {
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(poll, 3_000)
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

async function refreshBranches(): Promise<void> {
  const branches = await window.api.git.branches()
  dispatch({ type: 'BRANCHES_UPDATED', branches })
}

async function boot(): Promise<void> {
  const [slots, state] = await Promise.all([window.api.slots.list(), window.api.state.get()])
  dispatch({ type: 'INIT', slots, activeSlotName: state.activeSlot })
  await Promise.all([poll(), refreshBranches()])
  startPolling()
  setInterval(refreshBranches, 30_000)
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
        <span class="svc-name">sql-server <span class="badge">shared</span><span class="port-badge">:1433</span>${statusBadge(label, dotCls === 'starting' ? 'starting' : dotCls === 'running' ? 'running' : dotCls === 'unknown' ? 'unknown' : 'stopped')}</span>
        <div class="svc-btns"></div>
      </div>
    </div>
  `
}

// ── Backends ──────────────────────────────────────────────────────────────────

const BACKEND_SVCS: Array<{ id: string; portKey: keyof Ports }> = [
  { id: 'rabbitmq',              portKey: 'rabbitmqAmqp' },
  { id: 'contractor-backend',    portKey: 'contractorBackend' },
  { id: 'corporate-backend',     portKey: 'corporateBackend' },
  { id: 'integration-services',  portKey: 'integrationServices' },
  { id: 'companycam-integration', portKey: 'companycamIntegration' },
  { id: 'encircle-integration',   portKey: 'encircleIntegration' },
  { id: 'zappier-integration',    portKey: 'zappierIntegration' },
  { id: 'swagger-integration',    portKey: 'swaggerIntegration' },
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

    const branch = store.branches[id]
    return `
      <div class="svc-row">
        <div class="dot ${dotCls}"></div>
        <span class="svc-name">${id}<span class="port-badge">:${port}</span>${statusBadge(label, busy ? 'starting' : st === 'running' ? 'running' : st === 'unknown' ? 'unknown' : 'stopped')}${branch ? `<span class="branch-badge">${branch}</span>` : ''}</span>
        <div class="svc-btns">
          <button class="btn-icon" title="Logs" onclick="doDockerLogs('${id}')"><i class="ri-file-list-line"></i></button>
          ${st === 'running' ? `<button class="btn btn-danger" onclick="doDockerStop('${id}')">Stop</button>` : ''}
          <button class="btn btn-ghost" ${busy ? 'disabled' : ''} onclick="doDockerRestart('${id}')">${st === 'restarting' ? spinner() + ' Restarting…' : 'Restart'}</button>
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
              ? `<button class="btn btn-danger" onclick="doBackendsStop()">Stop</button>
                 <button class="btn btn-ghost" onclick="doBackendsRestart()">Restart</button>`
              : `<button class="btn btn-primary" onclick="doBackendsStart()">Start</button>`
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
  { id: 'forms',               portKey: 'formsFrontend' },
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

    const targets    = allTargets(id)
    const currentKey = store.feTargets[id] ?? store.active!.name
    const targetSel  = `
      <select class="target-select" ${busy ? 'disabled' : ''} onchange="setFeTarget('${id}', this.value)">
        <optgroup label="Local">
          ${store.slots.map(sl => `<option value="${sl.name}" ${currentKey === sl.name ? 'selected' : ''}>${sl.name}</option>`).join('')}
        </optgroup>
        <optgroup label="Remote">
          ${REMOTE_ENVS.map(e => `<option value="${e.label}" ${currentKey === e.label ? 'selected' : ''}>${e.label}</option>`).join('')}
        </optgroup>
      </select>`

    let btns: string
    if (busy) {
      btns = `<button class="btn btn-ghost" disabled>${spinner()} ${cap(st)}…</button>`
    } else if (st === 'running') {
      btns = `
        <button class="btn-icon" title="Logs" onclick="doFrontendLogs('${id}')"><i class="ri-file-list-line"></i></button>
        <button class="btn btn-danger"         onclick="doFrontendStop('${id}')">Stop</button>
        <button class="btn btn-ghost"          onclick="doFrontendRestart('${id}')">Restart</button>
      `
    } else {
      btns = `<button class="btn btn-primary" onclick="doFrontendStart('${id}')">Start</button>`
    }

    const branch = store.branches[id]
    return `
      <div class="svc-row">
        <div class="dot ${dotCls}"></div>
        <span class="svc-name svc-link" onclick="openUrl('http://localhost:${port}')" title="Open http://localhost:${port}">${id}<i class="ri-external-link-line link-icon"></i><span class="port-badge">:${port}</span>${statusBadge(label, busy ? st : st === 'running' ? 'running' : 'stopped')}${branch ? `<span class="branch-badge">${branch}</span>` : ''}</span>
        ${targetSel}
        <div class="svc-btns">
          ${btns}
        </div>
      </div>
    `
  }).join('')

  const feAnyBusy    = FRONTEND_SVCS.some(({ id }) => FE_LOCKED.has(store.frontends[id]?.status ?? 'stopped'))
  const feAnyRunning = FRONTEND_SVCS.some(({ id }) => store.frontends[id]?.status === 'running')

  document.getElementById('frontend-section')!.innerHTML = `
    <div class="card">
      <div class="card-header">
        <span class="card-title">Frontends (ng serve)</span>
        <div class="card-actions">
          ${feAnyBusy
            ? `<button class="btn btn-ghost" disabled>${spinner()} Working…</button>`
            : feAnyRunning
              ? `<button class="btn btn-danger" onclick="doFrontendsStop()">Stop</button>
                 <button class="btn btn-ghost" onclick="doFrontendsRestart()">Restart</button>`
              : `<button class="btn btn-primary" onclick="doFrontendsStart()">Start</button>`
          }
        </div>
      </div>
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

async function doDockerStop(service: string): Promise<void> {
  if (!store.active) return
  dispatch({ type: 'DOCKER_STOP', service })
  toast(`Stopping ${service}…`)
  await window.api.docker.stop({ stackName: store.active.stackName, service })
  toast('')
}

async function doDockerRestart(service: string): Promise<void> {
  if (!store.active) return
  dispatch({ type: 'DOCKER_RESTART', service })
  toast(`Restarting ${service}…`)
  await window.api.docker.restart({ stackName: store.active.stackName, service })
  toast('')
}

async function doBackendsRestart(): Promise<void> {
  if (!store.active) return
  const running = BACKEND_SVCS.filter(({ id }) => store.backends[id] === 'running')
  running.forEach(({ id }) => dispatch({ type: 'DOCKER_RESTART', service: id }))
  toast(`Restarting backends…`)
  await Promise.all(running.map(({ id }) =>
    window.api.docker.restart({ stackName: store.active!.stackName, service: id })
  ))
  toast('')
}

async function doFrontendsStop(): Promise<void> {
  toast('Stopping all frontends…')
  await Promise.all(FRONTEND_SVCS.map(({ id }) => {
    dispatch({ type: 'FRONTEND_STOP', name: id })
    return window.api.frontend.stop({ name: id })
  }))
  toast('')
}

async function doFrontendsStart(): Promise<void> {
  if (!store.active) return
  toast('Starting all frontends… (~60s)')
  FRONTEND_SVCS.forEach(({ id }) => { dispatch({ type: 'FRONTEND_START', name: id }); armFeTimeout(id) })
  await Promise.all(FRONTEND_SVCS.map(({ id }) => {
    const target = resolveTarget(id)
    return window.api.frontend.start({ name: id, slotIdx: store.active!.idx, targetUrl: target.url, isRemote: target.isRemote }).then(result => {
      if (result.error) { dispatch({ type: 'FRONTEND_RESET', name: id }); clearTimeout(feTimeouts[id]) }
    })
  }))
  toast('')
}

async function doFrontendsRestart(): Promise<void> {
  if (!store.active) return
  toast('Restarting all frontends…')
  const running = FRONTEND_SVCS.filter(({ id }) => store.frontends[id]?.status === 'running')
  running.forEach(({ id }) => dispatch({ type: 'FRONTEND_RESTART', name: id }))
  await Promise.all(running.map(async ({ id }) => {
    const target = resolveTarget(id)
    await window.api.frontend.stop({ name: id })
    await delay(400)
    await window.api.frontend.start({ name: id, slotIdx: store.active!.idx, targetUrl: target.url, isRemote: target.isRemote })
  }))
  toast('')
}

function setFeTarget(name: string, targetKey: string): void {
  store = { ...store, feTargets: { ...store.feTargets, [name]: targetKey } }
  const st = store.frontends[name]?.status
  if (st === 'running') doFrontendRestart(name)
}

async function doFrontendStart(name: string): Promise<void> {
  if (!store.active) return
  const target = resolveTarget(name)
  dispatch({ type: 'FRONTEND_START', name })
  toast(`${name} → ${target.label} — compiling… (~60s)`)
  armFeTimeout(name)

  const result = await window.api.frontend.start({
    name,
    slotIdx:   store.active.idx,
    targetUrl: target.url,
    isRemote:  target.isRemote,
  })
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
  const target = resolveTarget(name)
  dispatch({ type: 'FRONTEND_RESTART', name })
  toast(`${name} restarting… (compiling)`)
  armFeTimeout(name)

  await window.api.frontend.stop({ name })
  await delay(400)
  const result = await window.api.frontend.start({ name, slotIdx: store.active.idx, targetUrl: target.url, isRemote: target.isRemote })
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
  const el = document.getElementById('log-drawer')!
  el.classList.remove('open')
  el.style.height = ''
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

function spinner(): string { return '<i class="ri-loader-4-line spin"></i>' }
function statusBadge(label: string, cls: string): string {
  return `<span class="status-badge ${cls}">${label}</span>`
}
function cap(s: string):    string { return s.charAt(0).toUpperCase() + s.slice(1) }
function delay(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

// ─── Globals for inline onclick ───────────────────────────────────────────────

;(window as any).selectSlot         = selectSlot
;(window as any).doInfraStart       = doInfraStart
;(window as any).doInfraStop        = doInfraStop
;(window as any).doBackendsStart    = doBackendsStart
;(window as any).doBackendsStop     = doBackendsStop
;(window as any).doDockerStop       = doDockerStop
;(window as any).doDockerRestart    = doDockerRestart
;(window as any).doBackendsRestart  = doBackendsRestart
;(window as any).setFeTarget        = setFeTarget
;(window as any).doFrontendsStart   = doFrontendsStart
;(window as any).doFrontendsStop    = doFrontendsStop
;(window as any).doFrontendsRestart = doFrontendsRestart
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

  // ── Resizable log drawer ──────────────────────────────────────────────────
  const drawer = document.getElementById('log-drawer')!
  const handle = document.getElementById('log-resize-handle')!
  let startY = 0, startH = 0

  handle.addEventListener('mousedown', (e: MouseEvent) => {
    startY = e.clientY
    startH = drawer.offsetHeight
    drawer.classList.add('resizing')
    e.preventDefault()

    function onMove(e: MouseEvent): void {
      const h = Math.max(80, Math.min(window.innerHeight * 0.85, startH + (startY - e.clientY)))
      drawer.style.height = h + 'px'
    }
    function onUp(): void {
      drawer.classList.remove('resizing')
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  })

  boot()
})
