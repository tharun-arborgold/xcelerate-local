import { contextBridge, ipcRenderer } from 'electron'

const api: ElectronApi = {
  slots:    { list: ()        => ipcRenderer.invoke('slots:list') },
  state:    { get: ()         => ipcRenderer.invoke('state:get'),
              set: s          => ipcRenderer.invoke('state:set', s) },
  status:   { get: opts       => ipcRenderer.invoke('status:get', opts) },
  stack:    { up:   opts      => ipcRenderer.invoke('stack:up', opts),
              down: opts      => ipcRenderer.invoke('stack:down', opts) },
  infra:    { up:   ()        => ipcRenderer.invoke('infra:up'),
              down: ()        => ipcRenderer.invoke('infra:down') },
  docker:   { start:   opts   => ipcRenderer.invoke('docker:start', opts),
              restart: opts   => ipcRenderer.invoke('docker:restart', opts),
              stop:    opts   => ipcRenderer.invoke('docker:stop', opts),
              logs:    opts   => ipcRenderer.invoke('docker:logs', opts) },
  frontend: { start: opts     => ipcRenderer.invoke('frontend:start', opts),
              stop:  opts     => ipcRenderer.invoke('frontend:stop', opts),
              logs:  opts     => ipcRenderer.invoke('frontend:logs', opts) },
  url:      { open: url       => ipcRenderer.invoke('url:open', url) },
  git:      { branches: ()   => ipcRenderer.invoke('git:branches') },
}

contextBridge.exposeInMainWorld('api', api)
