export const rpcRestrictedPort = 18089
export const rpcPort = 18081
export const p2pPort = 18080
export const p2pLocalBindPort = 18084
export const zmqPort = 18082
export const zmqPubsubPort = 18083
export const walletRpcPort = 28088

export interface TorPreferences {
  toronly: boolean
  maxsocksconns: number
  maxonionconns: number
  dandelion: boolean
}

export const torDefaults: TorPreferences = {
  toronly: true,
  maxsocksconns: 16,
  maxonionconns: 16,
  dandelion: true,
}

export function toTorSettings(
  prefs: TorPreferences,
  torProxyAddress: string,
) {
  if (!prefs.toronly) {
    return {
      'tx-proxy': undefined,
      proxy: undefined,
      'anonymous-inbound': undefined,
      'pad-transactions': undefined as number | undefined,
    }
  }

  let txProxy = `tor,${torProxyAddress},${prefs.maxsocksconns}`
  if (!prefs.dandelion) txProxy += ',disable_noise'

  return {
    'tx-proxy': txProxy,
    proxy: torProxyAddress,
    'anonymous-inbound': undefined as string | undefined,
    'pad-transactions': 1 as number | undefined,
  }
}

export function fromTorSettings(conf: {
  proxy?: string
  'tx-proxy'?: string
  'anonymous-inbound'?: string
}): TorPreferences {
  const toronly = conf.proxy !== undefined
  const txParts = conf['tx-proxy']?.split(',') ?? []
  const anonParts = conf['anonymous-inbound']?.split(',') ?? []

  return {
    toronly,
    maxsocksconns: Number(txParts[2]) || torDefaults.maxsocksconns,
    maxonionconns: Number(anonParts[2]) || torDefaults.maxonionconns,
    dandelion: conf['tx-proxy']
      ? !conf['tx-proxy'].includes('disable_noise')
      : torDefaults.dandelion,
  }
}

export function anonymousInbound(
  peerTorAddress: string,
  maxonionconns: number,
): string {
  return `${peerTorAddress}:${p2pPort},127.0.0.1:${p2pLocalBindPort},${maxonionconns}`
}
