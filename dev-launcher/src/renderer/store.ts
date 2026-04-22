// Store types and reducer — ported from src/app.ts.
// types.d.ts global types (Slot, Ports, FrontendStatus, etc.) are ambient.

export type FeSvcStatus  = 'stopped' | 'starting' | 'running' | 'stopping' | 'restarting'
export type DockerStatus = 'unknown' | 'running' | 'stopped' | 'starting' | 'stopping' | 'restarting'
export type InfraStatus  = 'unknown' | 'running' | 'stopped' | 'not_found' | 'starting' | 'stopping'

export interface FeSvcState {
  status: FeSvcStatus
  pid?:   number
  port?:  number
}

export interface AppStore {
  slots:     Slot[]
  active:    Slot | null
  infra:     InfraStatus
  backends:  Record<string, DockerStatus>
  frontends: Record<string, FeSvcState>
  branches:  Record<string, string>
  feTargets: Record<string, string>
}

export interface BackendTarget {
  label:    string
  url:      string
  isRemote: boolean
}

export const REMOTE_ENVS: BackendTarget[] = [
  { label: 'dev',  url: 'https://dev.xceleraterestoration.com',      isRemote: true },
  { label: 'dev1', url: 'https://dev1.xceleraterestoration.com',     isRemote: true },
  { label: 'dev2', url: 'https://dev2.xceleraterestoration.com',     isRemote: true },
  { label: 'dev3', url: 'https://dev3.xceleraterestoration.com',     isRemote: true },
  { label: 'dev4', url: 'https://dev4.xceleraterestoration.com',     isRemote: true },
  { label: 'dev5', url: 'https://dev5.xceleraterestoration.com',     isRemote: true },
  { label: 'uat',  url: 'https://uat.xceleraterestoration.com',      isRemote: true },
  { label: 'prod', url: 'https://api-prod.xceleraterestoration.com', isRemote: true },
]

export const BACKEND_SVCS: Array<{ id: string; portKey: keyof Ports }> = [
  { id: 'rabbitmq',              portKey: 'rabbitmqAmqp' },
  { id: 'contractor-backend',    portKey: 'contractorBackend' },
  { id: 'corporate-backend',     portKey: 'corporateBackend' },
  { id: 'integration-services',  portKey: 'integrationServices' },
  { id: 'companycam-integration', portKey: 'companycamIntegration' },
  { id: 'encircle-integration',  portKey: 'encircleIntegration' },
  { id: 'zappier-integration',   portKey: 'zappierIntegration' },
  { id: 'swagger-integration',   portKey: 'swaggerIntegration' },
]

export const FRONTEND_SVCS: Array<{ id: string; portKey: keyof Ports }> = [
  { id: 'contractor-frontend', portKey: 'contractorFrontend' },
  { id: 'corporate-frontend',  portKey: 'corporateFrontend' },
  { id: 'forms',               portKey: 'formsFrontend' },
]

export type Action =
  | { type: 'BRANCHES_UPDATED'; branches: Record<string, string> }
  | { type: 'INIT';             slots: Slot[]; activeSlotName: string | null; persistedTargets: Record<string, string> }
  | { type: 'SELECT_SLOT';      slot: Slot }
  | { type: 'STATUS_POLL';      docker: DockerStatusMap; dockerReady: Record<string, boolean>; infraRaw: string; frontends: Record<string, FrontendStatus> }
  | { type: 'INFRA_START' }
  | { type: 'INFRA_STOP' }
  | { type: 'BACKENDS_START' }
  | { type: 'BACKENDS_STOP' }
  | { type: 'DOCKER_START';     service: string }
  | { type: 'DOCKER_RESTART';   service: string }
  | { type: 'DOCKER_STOP';      service: string }
  | { type: 'FRONTEND_START';   name: string }
  | { type: 'FRONTEND_STOP';    name: string }
  | { type: 'FRONTEND_RESTART'; name: string }
  | { type: 'FRONTEND_RESET';   name: string }
  | { type: 'FE_TARGET_SET';    name: string; targetKey: string }

export const FE_LOCKED:     ReadonlySet<FeSvcStatus>  = new Set(['starting', 'stopping', 'restarting'])
export const DOCKER_LOCKED: ReadonlySet<DockerStatus> = new Set(['starting', 'stopping', 'restarting'])
export const INFRA_LOCKED:  ReadonlySet<InfraStatus>  = new Set(['starting', 'stopping'])

function reconcileDocker(
  current: DockerStatus,
  polled: 'running' | 'stopped',
  ready: boolean,
): DockerStatus {
  if (DOCKER_LOCKED.has(current)) {
    if (current === 'starting'   && polled === 'running' && ready) return 'running'
    if (current === 'stopping'   && polled === 'stopped')          return 'stopped'
    if (current === 'restarting' && polled === 'running' && ready) return 'running'
    return current
  }
  return polled
}

function reconcileFrontend(current: FeSvcState, polled: FrontendStatus): FeSvcState {
  if (FE_LOCKED.has(current.status)) {
    if (current.status === 'starting'   && polled.running && polled.ready) return { status: 'running', pid: polled.pid ?? undefined, port: polled.port }
    if (current.status === 'stopping'   && !polled.running)                return { status: 'stopped' }
    if (current.status === 'restarting' && polled.running && polled.ready) return { status: 'running', pid: polled.pid ?? undefined, port: polled.port }
    return current
  }
  return polled.running
    ? { status: 'running', pid: polled.pid ?? undefined, port: polled.port }
    : { status: 'stopped' }
}

export const EMPTY: AppStore = {
  slots: [], active: null, infra: 'unknown',
  backends: {}, frontends: {}, branches: {}, feTargets: {},
}

export function reduce(s: AppStore, a: Action): AppStore {
  switch (a.type) {
    case 'INIT': {
      const active = a.slots.find(sl => sl.name === a.activeSlotName) ?? a.slots[0] ?? null
      const feTargets: Record<string, string> = {}
      FRONTEND_SVCS.forEach(({ id }) => {
        feTargets[id] = a.persistedTargets[id] ?? active?.name ?? ''
      })
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
      const ip: InfraStatus = a.infraRaw === 'running'   ? 'running'
        :                     a.infraRaw === 'not_found' ? 'not_found'
        :                                                   'stopped'
      let infra = s.infra
      if (INFRA_LOCKED.has(infra)) {
        if (infra === 'starting' && ip === 'running')  infra = 'running'
        if (infra === 'stopping' && ip !== 'running')  infra = ip
      } else {
        infra = ip
      }
      const backends = { ...s.backends }
      for (const [svc, p] of Object.entries(a.docker)) {
        backends[svc] = reconcileDocker(backends[svc] ?? 'unknown', p, a.dockerReady[svc] ?? false)
      }
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

    case 'DOCKER_START':   return { ...s, backends: { ...s.backends, [a.service]: 'starting' } }
    case 'DOCKER_RESTART': return { ...s, backends: { ...s.backends, [a.service]: 'restarting' } }
    case 'DOCKER_STOP':    return { ...s, backends: { ...s.backends, [a.service]: 'stopping' } }

    case 'FRONTEND_START':   return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'starting' } } }
    case 'FRONTEND_STOP':    return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'stopping' } } }
    case 'FRONTEND_RESTART': return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'restarting' } } }
    case 'FRONTEND_RESET':   return { ...s, frontends: { ...s.frontends, [a.name]: { status: 'stopped' } } }

    case 'FE_TARGET_SET': return { ...s, feTargets: { ...s.feTargets, [a.name]: a.targetKey } }

    case 'BRANCHES_UPDATED': return { ...s, branches: a.branches }

    default: return s
  }
}

export function allTargets(slots: Slot[], feName: string): BackendTarget[] {
  const local: BackendTarget[] = slots.map(slot => ({
    label:    slot.name,
    url:      feName === 'contractor-frontend'
                ? `http://localhost:${slot.ports.contractorBackend}`
                : feName === 'corporate-frontend'
                  ? `http://localhost:${slot.ports.corporateBackend}`
                  : `http://localhost:${slot.ports.contractorBackend}`,
    isRemote: false,
  }))
  return [...local, ...REMOTE_ENVS]
}

export function resolveTarget(
  slots:     Slot[],
  feTargets: Record<string, string>,
  active:    Slot | null,
  feName:    string,
): BackendTarget {
  const key = feTargets[feName] ?? active?.name ?? ''
  return allTargets(slots, feName).find(t => t.label === key) ?? allTargets(slots, feName)[0]
}
