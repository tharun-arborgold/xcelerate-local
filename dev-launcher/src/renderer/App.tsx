import React, { useCallback, useEffect, useReducer, useRef } from 'react'
import { Toaster, toast } from 'sonner'
import {
  reduce, EMPTY,
  BACKEND_SVCS, FRONTEND_SVCS, REMOTE_ENVS,
  FE_LOCKED, DOCKER_LOCKED, INFRA_LOCKED,
  resolveTarget, allTargets,
} from './store'
import type { AppStore, FeSvcStatus, DockerStatus, InfraStatus } from './store'
import { cn } from '@/lib/utils'
import {
  Button, Badge, StatusBadge, Spinner,
  Tooltip, TooltipProvider,
  SegmentedControl, Select,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
} from '@/components/ui'
import type { StatusVariant } from '@/components/ui'

// ─── Layout primitives ────────────────────────────────────────────────────────

function Card({
  title, actions, children,
}: {
  title: string
  actions?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800">
        <h2 className="text-sm font-semibold tracking-tight text-neutral-100">{title}</h2>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div className="divide-y divide-neutral-800/50">{children}</div>
    </div>
  )
}

function SvcRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5 min-h-[46px]">{children}</div>
  )
}

// ─── Status helpers ───────────────────────────────────────────────────────────

function dockerVariant(st: DockerStatus): StatusVariant {
  if (DOCKER_LOCKED.has(st)) return 'starting'
  if (st === 'running') return 'running'
  if (st === 'unknown') return 'unknown'
  return 'stopped'
}

function feVariant(st: FeSvcStatus): StatusVariant {
  if (FE_LOCKED.has(st)) return 'starting'
  if (st === 'running') return 'running'
  return 'stopped'
}

function infraVariant(st: InfraStatus): StatusVariant {
  if (INFRA_LOCKED.has(st)) return 'starting'
  if (st === 'running') return 'running'
  return 'unknown'
}

function statusLabel(st: string, locked: boolean): string {
  if (locked) return st + '…'
  if (st === 'not_found') return 'not started'
  return st
}

function delay(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [store, dispatch] = useReducer(reduce, EMPTY)

  // Log drawer
  const [logOpen, setLogOpen]       = React.useState(false)
  const [logTitle, setLogTitle]     = React.useState('')
  const [logContent, setLogContent] = React.useState('')
  const logHeightRef = useRef(280)
  const drawerRef    = useRef<HTMLDivElement>(null)
  const logTargetRef = useRef<{ type: 'docker' | 'frontend'; id: string } | null>(null)
  const logTimer     = useRef<ReturnType<typeof setInterval> | null>(null)
  const [lastUpdated, setLastUpdated] = React.useState('')

  // Timers + FE timeout guard
  const pollTimer   = useRef<ReturnType<typeof setInterval> | null>(null)
  const branchTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const feTimeouts  = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const [booting, setBooting] = React.useState(true)

  // Always-fresh store ref for async callbacks
  const storeRef = useRef<AppStore>(store)
  storeRef.current = store

  // ── Poll ───────────────────────────────────────────────────────────────────
  const doPoll = useCallback(async () => {
    const s = storeRef.current
    if (!s.active) return
    try {
      const st = await window.api.status.get({ stackName: s.active.stackName, slotIdx: s.active.idx })
      dispatch({ type: 'STATUS_POLL', docker: st.docker, dockerReady: st.dockerReady, infraRaw: st.infra, frontends: st.frontends })
      setLastUpdated(new Date().toLocaleTimeString())
    } catch { /* transient */ }
  }, [])

  const refreshBranches = useCallback(async () => {
    const branches = await window.api.git.branches()
    dispatch({ type: 'BRANCHES_UPDATED', branches })
  }, [])

  // ── Boot ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    async function boot() {
      const [slots, state] = await Promise.all([window.api.slots.list(), window.api.state.get()])
      dispatch({ type: 'INIT', slots, activeSlotName: state.activeSlot, persistedTargets: state.feTargets ?? {} })
      // Poll directly with the loaded slot — storeRef won't have updated yet after INIT dispatch
      const activeSlot = slots.find(s => s.name === state.activeSlot) ?? slots[0]
      await Promise.all([
        activeSlot
          ? window.api.status.get({ stackName: activeSlot.stackName, slotIdx: activeSlot.idx }).then(st => {
              dispatch({ type: 'STATUS_POLL', docker: st.docker, dockerReady: st.dockerReady, infraRaw: st.infra, frontends: st.frontends })
              setLastUpdated(new Date().toLocaleTimeString())
            }).catch(() => {})
          : Promise.resolve(),
        refreshBranches(),
      ])
      setBooting(false)
      pollTimer.current   = setInterval(doPoll, 3_000)
      branchTimer.current = setInterval(refreshBranches, 30_000)
    }
    boot()
    return () => {
      if (pollTimer.current)   clearInterval(pollTimer.current)
      if (branchTimer.current) clearInterval(branchTimer.current)
    }
  }, [doPoll, refreshBranches])

  // ── FE timeout guard ───────────────────────────────────────────────────────
  const armFeTimeout = useCallback((name: string) => {
    if (feTimeouts.current[name]) clearTimeout(feTimeouts.current[name])
    feTimeouts.current[name] = setTimeout(() => {
      if (FE_LOCKED.has(storeRef.current.frontends[name]?.status)) {
        dispatch({ type: 'FRONTEND_RESET', name })
        toast.error(`${name}: timed out — check logs`)
      }
    }, 5 * 60_000)
  }, [])

  // ── Log drawer ─────────────────────────────────────────────────────────────
  const refreshLogs = useCallback(async () => {
    const target = logTargetRef.current
    const s = storeRef.current
    if (!target || !s.active) return
    try {
      const content = target.type === 'docker'
        ? await window.api.docker.logs({ stackName: s.active.stackName, service: target.id })
        : await window.api.frontend.logs({ name: target.id })
      setLogContent(content)
    } catch { /* ignore */ }
  }, [])

  const openLogs = useCallback((type: 'docker' | 'frontend', id: string, title: string) => {
    logTargetRef.current = { type, id }
    setLogTitle(title)
    setLogContent('')
    setLogOpen(true)
    refreshLogs()
    if (logTimer.current) clearInterval(logTimer.current)
    logTimer.current = setInterval(refreshLogs, 3_000)
  }, [refreshLogs])

  const closeLogs = useCallback(() => {
    setLogOpen(false)
    logTargetRef.current = null
    if (logTimer.current) { clearInterval(logTimer.current); logTimer.current = null }
  }, [])

  // ── Drag resize ────────────────────────────────────────────────────────────
  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = logHeightRef.current
    function onMove(ev: MouseEvent) {
      const h = Math.max(80, Math.min(window.innerHeight * 0.85, startH + (startY - ev.clientY)))
      logHeightRef.current = h
      if (drawerRef.current) drawerRef.current.style.height = h + 'px'
    }
    function onUp() {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  // ── Action handlers ────────────────────────────────────────────────────────
  const selectSlot = useCallback(async (name: string) => {
    const s = storeRef.current
    const slot = s.slots.find(sl => sl.name === name)
    if (!slot || slot.name === s.active?.name) return
    dispatch({ type: 'SELECT_SLOT', slot })
    await window.api.state.set({ activeSlot: slot.name })
    await doPoll()
  }, [doPoll])

  const doInfraStart = useCallback(async () => {
    dispatch({ type: 'INFRA_START' })
    const id = toast.loading('Starting SQL Server…')
    try {
      await window.api.infra.up()
      toast.success('SQL Server started', { id })
    } catch { toast.error('Failed to start SQL Server', { id, duration: 8000 }) }
  }, [])

  const doInfraStop = useCallback(async () => {
    dispatch({ type: 'INFRA_STOP' })
    const id = toast.loading('Stopping SQL Server…')
    try {
      await window.api.infra.down()
      toast.success('SQL Server stopped', { id })
    } catch { toast.error('Failed to stop SQL Server', { id, duration: 8000 }) }
  }, [])

  const doBackendsStart = useCallback(async () => {
    const s = storeRef.current
    if (!s.active) return
    dispatch({ type: 'BACKENDS_START' })
    const id = toast.loading(`Starting backends for ${s.active.name}…`)
    try {
      await window.api.stack.up({ slotName: s.active.name, profile: 'backends' })
      toast.success('Backends started', { id })
    } catch { toast.error('Failed to start backends', { id, duration: 8000 }) }
  }, [])

  const doBackendsStop = useCallback(async () => {
    const s = storeRef.current
    if (!s.active) return
    dispatch({ type: 'BACKENDS_STOP' })
    const id = toast.loading(`Stopping ${s.active.name}…`)
    try {
      await window.api.stack.down({ slotName: s.active.name })
      toast.success('Backends stopped', { id })
    } catch { toast.error('Failed to stop backends', { id, duration: 8000 }) }
  }, [])

  const doBackendsRestart = useCallback(async () => {
    const s = storeRef.current
    if (!s.active) return
    const running = BACKEND_SVCS.filter(({ id }) => s.backends[id] === 'running')
    running.forEach(({ id }) => dispatch({ type: 'DOCKER_RESTART', service: id }))
    const tid = toast.loading('Restarting backends…')
    try {
      await Promise.all(running.map(({ id }) =>
        window.api.docker.restart({ stackName: s.active!.stackName, service: id })
      ))
      toast.success('Backends restarted', { id: tid })
    } catch { toast.error('Failed to restart backends', { id: tid, duration: 8000 }) }
  }, [])

  const doDockerStart = useCallback(async (service: string) => {
    const s = storeRef.current
    if (!s.active) return
    dispatch({ type: 'DOCKER_START', service })
    const id = toast.loading(`Starting ${service}…`)
    try {
      await window.api.docker.start({ stackName: s.active.stackName, service })
      toast.success(`${service} started`, { id })
    } catch { toast.error(`Failed to start ${service}`, { id, duration: 8000 }) }
  }, [])

  const doDockerStop = useCallback(async (service: string) => {
    const s = storeRef.current
    if (!s.active) return
    dispatch({ type: 'DOCKER_STOP', service })
    const id = toast.loading(`Stopping ${service}…`)
    try {
      await window.api.docker.stop({ stackName: s.active.stackName, service })
      toast.success(`${service} stopped`, { id })
    } catch { toast.error(`Failed to stop ${service}`, { id, duration: 8000 }) }
  }, [])

  const doDockerRestart = useCallback(async (service: string) => {
    const s = storeRef.current
    if (!s.active) return
    dispatch({ type: 'DOCKER_RESTART', service })
    const id = toast.loading(`Restarting ${service}…`)
    try {
      await window.api.docker.restart({ stackName: s.active.stackName, service })
      toast.success(`${service} restarted`, { id })
    } catch { toast.error(`Failed to restart ${service}`, { id, duration: 8000 }) }
  }, [])

  // Shared helper — start a single frontend and resolve the toast
  const startFrontend = useCallback(async (
    name: string, slotIdx: number, targetKey: string, slots: Slot[],
  ) => {
    const target = allTargets(slots, name).find(t => t.label === targetKey) ?? allTargets(slots, name)[0]
    const result = await window.api.frontend.start({
      name, slotIdx, targetUrl: target.url, isRemote: target.isRemote, envLabel: target.label,
    })
    if (result.error) {
      dispatch({ type: 'FRONTEND_RESET', name })
      clearTimeout(feTimeouts.current[name])
      toast.error(result.error, { id: name, duration: 8000 })
    } else {
      toast.success(`${name} ready`, { id: name, duration: 4000 })
    }
  }, [])

  const doFrontendStart = useCallback(async (name: string) => {
    const s = storeRef.current
    if (!s.active) return
    const targetKey = s.feTargets[name] ?? s.active.name
    dispatch({ type: 'FRONTEND_START', name })
    toast.loading(`${name} → ${targetKey} — compiling…`, { id: name, duration: Infinity })
    armFeTimeout(name)
    await startFrontend(name, s.active.idx, targetKey, s.slots)
  }, [armFeTimeout, startFrontend])

  const doFrontendStop = useCallback(async (name: string) => {
    dispatch({ type: 'FRONTEND_STOP', name })
    const id = toast.loading(`Stopping ${name}…`)
    try {
      await window.api.frontend.stop({ name })
      toast.success(`${name} stopped`, { id })
    } catch { toast.error(`Failed to stop ${name}`, { id, duration: 8000 }) }
  }, [])

  const doFrontendRestart = useCallback(async (name: string, overrideTargetKey?: string) => {
    const s = storeRef.current
    if (!s.active) return
    const targetKey = overrideTargetKey ?? s.feTargets[name] ?? s.active.name
    dispatch({ type: 'FRONTEND_RESTART', name })
    toast.loading(`${name} → ${targetKey} — restarting…`, { id: name, duration: Infinity })
    armFeTimeout(name)
    try {
      await window.api.frontend.stop({ name })
      await delay(400)
      await startFrontend(name, s.active.idx, targetKey, s.slots)
    } catch {
      dispatch({ type: 'FRONTEND_RESET', name })
      clearTimeout(feTimeouts.current[name])
      toast.error(`Failed to restart ${name}`, { id: name, duration: 8000 })
    }
  }, [armFeTimeout, startFrontend])

  const doFrontendsStart = useCallback(async () => {
    const s = storeRef.current
    if (!s.active) return
    FRONTEND_SVCS.forEach(({ id }) => { dispatch({ type: 'FRONTEND_START', name: id }); armFeTimeout(id) })
    toast.loading('Starting all frontends… (~60s)', { id: 'frontends', duration: Infinity })
    try {
      await Promise.all(FRONTEND_SVCS.map(({ id }) =>
        startFrontend(id, s.active!.idx, s.feTargets[id] ?? s.active!.name, s.slots)
      ))
      toast.success('Frontends ready', { id: 'frontends', duration: 4000 })
    } catch { toast.error('Failed to start frontends', { id: 'frontends', duration: 8000 }) }
  }, [armFeTimeout, startFrontend])

  const doFrontendsStop = useCallback(async () => {
    const id = toast.loading('Stopping all frontends…')
    try {
      await Promise.all(FRONTEND_SVCS.map(({ id: name }) => {
        dispatch({ type: 'FRONTEND_STOP', name })
        return window.api.frontend.stop({ name })
      }))
      toast.success('Frontends stopped', { id })
    } catch { toast.error('Failed to stop frontends', { id, duration: 8000 }) }
  }, [])

  const doFrontendsRestart = useCallback(async () => {
    const s = storeRef.current
    if (!s.active) return
    const running = FRONTEND_SVCS.filter(({ id }) => s.frontends[id]?.status === 'running')
    running.forEach(({ id }) => dispatch({ type: 'FRONTEND_RESTART', name: id }))
    const tid = toast.loading('Restarting all frontends…')
    try {
      await Promise.all(running.map(async ({ id }) => {
        await window.api.frontend.stop({ name: id })
        await delay(400)
        await startFrontend(id, s.active!.idx, s.feTargets[id] ?? s.active!.name, s.slots)
      }))
      toast.success('Frontends restarted', { id: tid })
    } catch { toast.error('Failed to restart frontends', { id: tid, duration: 8000 }) }
  }, [startFrontend])

  // Target select — always enabled. If frontend is running, restart with new target immediately.
  const setFeTarget = useCallback((name: string, targetKey: string) => {
    dispatch({ type: 'FE_TARGET_SET', name, targetKey })
    const s = storeRef.current
    const updated = { ...s.feTargets, [name]: targetKey }
    window.api.state.set({ feTargets: updated }).catch(() => {})
    if (s.frontends[name]?.status === 'running') {
      doFrontendRestart(name, targetKey)
    }
  }, [doFrontendRestart])

  // ── Derived ────────────────────────────────────────────────────────────────
  const { active, slots, infra, backends, frontends, branches, feTargets } = store
  const infraBusy     = INFRA_LOCKED.has(infra)
  const anyDockerBusy = BACKEND_SVCS.some(({ id }) => DOCKER_LOCKED.has(backends[id] ?? 'unknown'))
  const anyDockerRun  = BACKEND_SVCS.some(({ id }) => backends[id] === 'running')
  const feAnyBusy     = FRONTEND_SVCS.some(({ id }) => FE_LOCKED.has(frontends[id]?.status ?? 'stopped'))
  const feAnyRunning  = FRONTEND_SVCS.some(({ id }) => frontends[id]?.status === 'running')

  // ── Render ─────────────────────────────────────────────────────────────────
  if (booting) {
    return (
      <div className="flex h-screen items-center justify-center bg-neutral-950">
        <div className="flex flex-col items-center gap-3">
          <i className="ri-loader-4-line animate-spin text-2xl text-neutral-600" />
          <span className="text-xs text-neutral-700 font-medium">Loading…</span>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-screen bg-neutral-950 text-neutral-300 overflow-hidden select-none">

        {/* Sonner toaster — bottom-center, dark theme */}
        <Toaster
          position="bottom-center"
          theme="dark"
          duration={5000}
          toastOptions={{
            classNames: {
              toast:        'bg-neutral-800 border border-neutral-700 text-neutral-200 text-sm shadow-xl',
              description:  'text-neutral-400',
              actionButton: 'bg-purple-500 text-white',
              cancelButton: 'bg-neutral-700 text-neutral-300',
              loader:       'text-purple-400',
            },
          }}
        />

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <header
          className="flex items-center justify-between px-4 py-2 border-b border-neutral-800/60 shrink-0"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className="pl-20" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <SegmentedControl
              options={slots.map(s => ({ value: s.name, label: s.name }))}
              value={active?.name ?? ''}
              onChange={selectSlot}
            />
          </div>
          {lastUpdated && (
            <span className="text-[11px] font-medium text-neutral-700 tabular-nums">{lastUpdated}</span>
          )}
        </header>

        {/* ── Main ─────────────────────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

          {/* Infrastructure */}
          <Card
            title="Infrastructure"
            actions={
              infraBusy
                ? <Button variant="ghost" disabled><Spinner /> Working…</Button>
                : infra === 'running'
                  ? <Button variant="danger" onClick={doInfraStop}>Stop</Button>
                  : <Button variant="primary" onClick={doInfraStart}>Start SQL Server</Button>
            }
          >
            <SvcRow>
              <span className="text-sm font-medium text-neutral-200">sql-server</span>
              <Badge variant="neutral">shared</Badge>
              <Badge variant="port">:1433</Badge>
              <StatusBadge variant={infraVariant(infra)} label={statusLabel(infra, infraBusy)} />
              <div className="flex-1" />
            </SvcRow>
          </Card>

          {/* Backends */}
          {active && (
            <Card
              title="Backends"
              actions={
                anyDockerBusy
                  ? <Button variant="ghost" disabled><Spinner /> Working…</Button>
                  : anyDockerRun
                    ? <>
                        <Button variant="danger" onClick={doBackendsStop}>Stop</Button>
                        <Button variant="ghost"  onClick={doBackendsRestart}>Restart</Button>
                      </>
                    : <Button variant="primary" onClick={doBackendsStart}>Start</Button>
              }
            >
              {BACKEND_SVCS.map(({ id, portKey }) => {
                const st     = backends[id] ?? 'unknown'
                const busy   = DOCKER_LOCKED.has(st)
                const port   = active.ports[portKey]
                const v      = dockerVariant(st)
                const branch = branches[id]
                return (
                  <SvcRow key={id}>
                    <span className="text-sm font-medium text-neutral-200 shrink-0">{id}</span>
                    <Badge variant="port">:{port}</Badge>
                    <StatusBadge variant={v} label={statusLabel(st, busy)} />
                    {branch && <Badge variant="branch">{branch}</Badge>}
                    <div className="flex-1" />
                    <div className="flex items-center gap-1 shrink-0">
                      {(st === 'stopped' || st === 'unknown') && (
                        <Button variant="primary" size="sm" onClick={() => doDockerStart(id)}>Start</Button>
                      )}
                      {st === 'running' && (
                        <Button variant="danger" size="sm" onClick={() => doDockerStop(id)}>Stop</Button>
                      )}
                      {busy && st === 'restarting' && (
                        <Button variant="ghost" size="sm" disabled><Spinner /> Restarting…</Button>
                      )}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="icon">
                            <i className="ri-more-2-fill text-sm" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem icon="ri-file-list-line" label="View logs"
                            onSelect={() => openLogs('docker', id, `${id} — docker logs`)} />
                          <DropdownMenuItem icon="ri-restart-line" label="Restart" disabled={busy}
                            onSelect={() => doDockerRestart(id)} />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </SvcRow>
                )
              })}
            </Card>
          )}

          {/* Frontends */}
          {active && (
            <Card
              title="Frontends (ng serve)"
              actions={
                feAnyBusy
                  ? <>
                      <Button variant="ghost" disabled><Spinner /> Working…</Button>
                      <Button variant="danger" onClick={doFrontendsStop}>Stop</Button>
                    </>
                  : feAnyRunning
                    ? <>
                        <Button variant="danger" onClick={doFrontendsStop}>Stop</Button>
                        <Button variant="ghost"  onClick={doFrontendsRestart}>Restart</Button>
                      </>
                    : <Button variant="primary" onClick={doFrontendsStart}>Start</Button>
              }
            >
              {FRONTEND_SVCS.map(({ id, portKey }) => {
                const fe     = frontends[id] ?? { status: 'stopped' as FeSvcStatus }
                const st     = fe.status
                const busy   = FE_LOCKED.has(st)
                const port   = active.ports[portKey]
                const v      = feVariant(st)
                const branch = branches[id]
                const currentKey = feTargets[id] ?? active.name

                return (
                  <SvcRow key={id}>
                    <button
                      onClick={() => window.api.url.open(`http://localhost:${port}`)}
                      className="text-sm font-medium text-neutral-200 hover:text-purple-300 flex items-center gap-1 shrink-0 transition-colors"
                    >
                      {id}
                      <i className="ri-external-link-line text-[11px] text-neutral-600" />
                    </button>
                    <Badge variant="port">:{port}</Badge>
                    <Select
                      value={currentKey}
                      onChange={val => setFeTarget(id, val)}
                      groups={[
                        { label: 'Local',  options: slots.map(sl => ({ value: sl.name, label: sl.name })) },
                        { label: 'Remote', options: REMOTE_ENVS.map(e => ({ value: e.label, label: e.label })) },
                      ]}
                    />
                    <StatusBadge variant={v} label={statusLabel(st, busy)} />
                    {branch && <Badge variant="branch">{branch}</Badge>}
                    <div className="flex-1" />
                    <div className="flex items-center gap-1 shrink-0">
                      {busy ? (
                        <>
                          <Button variant="ghost" size="sm" disabled>
                            <Spinner />
                            {st.charAt(0).toUpperCase() + st.slice(1)}…
                          </Button>
                          {st !== 'stopping' && (
                            <Button variant="danger" size="sm" onClick={() => doFrontendStop(id)}>Stop</Button>
                          )}
                        </>
                      ) : st === 'running' ? (
                        <>
                          <Button variant="danger" size="sm" onClick={() => doFrontendStop(id)}>Stop</Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="icon">
                                <i className="ri-more-2-fill text-sm" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuItem icon="ri-file-list-line" label="View logs"
                                onSelect={() => openLogs('frontend', id, `${id} — ng serve`)} />
                              <DropdownMenuItem icon="ri-restart-line" label="Restart"
                                onSelect={() => doFrontendRestart(id)} />
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </>
                      ) : (
                        <Button variant="primary" size="sm" onClick={() => doFrontendStart(id)}>Start</Button>
                      )}
                    </div>
                  </SvcRow>
                )
              })}
            </Card>
          )}

          {/* Quick Links */}
          {active && (
            <Card title="Quick Links">
              <div className="px-4 py-3 grid grid-cols-5 gap-2">
                {([
                  { icon: 'ri-hammer-line',       label: 'Contractor', url: `http://localhost:${active.ports.contractorFrontend}` },
                  { icon: 'ri-building-4-line',   label: 'Corporate',  url: `http://localhost:${active.ports.corporateFrontend}` },
                  { icon: 'ri-server-line',        label: 'RabbitMQ',   url: `http://localhost:${active.ports.rabbitmqMgmt}` },
                  { icon: 'ri-code-s-slash-line', label: 'Contr. API', url: `http://localhost:${active.ports.contractorBackend}/actuator/health` },
                  { icon: 'ri-code-s-slash-line', label: 'Corp. API',  url: `http://localhost:${active.ports.corporateBackend}/actuator/health` },
                ] as const).map(({ icon, label, url }) => (
                  <button
                    key={label}
                    onClick={() => window.api.url.open(url)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-3 rounded-lg',
                      'border border-neutral-800 hover:border-neutral-700 hover:bg-neutral-800/40',
                      'transition-colors text-neutral-500 hover:text-neutral-300',
                    )}
                  >
                    <i className={cn(icon, 'text-xl')} />
                    <span className="text-[11px] font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}
        </main>

        {/* ── Log Drawer ───────────────────────────────────────────────────── */}
        {logOpen && (
          <div
            ref={drawerRef}
            className="shrink-0 flex flex-col border-t border-neutral-800 bg-[#0a0c12]"
            style={{ height: logHeightRef.current }}
          >
            {/* Drag handle */}
            <div
              className="h-1.5 cursor-row-resize group shrink-0 flex items-center justify-center"
              onMouseDown={onResizeMouseDown}
            >
              <div className="w-8 h-0.5 rounded-full bg-neutral-700 group-hover:bg-purple-500/60 transition-colors" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-neutral-800 shrink-0">
              <span className="text-xs font-mono text-neutral-500">{logTitle}</span>
              <Tooltip content="Close" side="left">
                <button
                  onClick={closeLogs}
                  className="text-neutral-600 hover:text-neutral-300 transition-colors"
                >
                  <i className="ri-close-line text-base" />
                </button>
              </Tooltip>
            </div>
            {/* Log output */}
            <pre className="flex-1 overflow-auto p-4 text-[11px] font-mono text-neutral-500 leading-relaxed whitespace-pre-wrap break-words">
              {logContent || '(no output yet)'}
            </pre>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
