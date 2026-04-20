// Shared types for main <-> renderer IPC and app state.
// No imports — this is a global ambient declaration file.

interface Ports {
  contractorBackend:  number
  corporateBackend:   number
  rabbitmqAmqp:       number
  rabbitmqMgmt:       number
  contractorFrontend: number
  corporateFrontend:  number
}

interface Slot {
  name:      string
  stackName: string
  idx:       number
  ports:     Ports
}

interface AppState {
  activeSlot: string | null
}

interface FrontendStatus {
  running: boolean
  pid:     number | null
  port?:   number
}

interface DockerStatusMap {
  [service: string]: 'running' | 'stopped'
}

interface AllStatus {
  docker:    DockerStatusMap
  infra:     string
  frontends: { [name: string]: FrontendStatus }
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
  docker:   { restart: (o: { stackName: string; service: string })              => Promise<ShellResult>
              logs:    (o: { stackName: string; service: string; lines?: number }) => Promise<string> }
  frontend: { start: (o: { name: string; slotIdx: number })   => Promise<StartFrontendResult>
              stop:  (o: { name: string })                     => Promise<{ ok: boolean }>
              logs:  (o: { name: string; lines?: number })     => Promise<string> }
  url:      { open: (url: string)                              => Promise<void> }
}

interface Window {
  api: ElectronApi
}
