// Shared types for main <-> renderer IPC and app state.
// No imports — this is a global ambient declaration file.

interface Ports {
  contractorBackend:    number
  corporateBackend:     number
  integrationServices:  number
  companycamIntegration: number
  encircleIntegration:  number
  zappierIntegration:   number
  swaggerIntegration:   number
  rabbitmqAmqp:         number
  rabbitmqMgmt:         number
  contractorFrontend:   number
  corporateFrontend:    number
  formsFrontend:        number
}

interface Slot {
  name:      string
  stackName: string
  idx:       number
  ports:     Ports
}

interface AppState {
  activeSlot: string | null
  feTargets:  Record<string, string>
}

interface FrontendStatus {
  running: boolean
  ready?:  boolean   // true only when HTTP on the port actually responds
  pid:     number | null
  port?:   number
}

interface DockerStatusMap {
  [service: string]: 'running' | 'stopped'
}

interface AllStatus {
  docker:      DockerStatusMap
  dockerReady: Record<string, boolean>   // service → HTTP health check passed
  infra:       string
  frontends:   { [name: string]: FrontendStatus }
}

interface ShellResult {
  ok:     boolean
  stdout: string
  stderr: string
}

interface StartFrontendResult {
  pid?:   number
  port?:  number
  error?: string
}

// Exposed on window.api by the preload bridge
interface ElectronApi {
  slots:    { list: ()                                         => Promise<Slot[]> }
  state:    { get: ()                                          => Promise<AppState>
              set: (s: Partial<AppState>)                      => Promise<AppState> }
  status:   { get: (o: { stackName: string; slotIdx: number }) => Promise<AllStatus> }
  stack:    { up:   (o: { slotName: string; profile: string }) => Promise<ShellResult>
              down: (o: { slotName: string })                  => Promise<ShellResult> }
  infra:    { up:   ()                                         => Promise<ShellResult>
              down: ()                                         => Promise<ShellResult> }
  docker:   { start:   (o: { stackName: string; service: string })              => Promise<ShellResult>
              restart: (o: { stackName: string; service: string })              => Promise<ShellResult>
              stop:    (o: { stackName: string; service: string })              => Promise<ShellResult>
              logs:    (o: { stackName: string; service: string; lines?: number }) => Promise<string> }
  frontend: { start: (o: { name: string; slotIdx: number; targetUrl: string; isRemote: boolean; envLabel: string }) => Promise<StartFrontendResult>
              stop:  (o: { name: string })                     => Promise<{ ok: boolean }>
              logs:  (o: { name: string; lines?: number })     => Promise<string> }
  url:      { open: (url: string)                              => Promise<void> }
  git:      { branches: ()                                     => Promise<Record<string, string>> }
}

interface Window {
  api: ElectronApi
}
