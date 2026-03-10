import { FileHelper, T, z } from '@start9labs/start-sdk'
import { i18n } from '../i18n'
import { sdk } from '../sdk'
import {
  fromTorSettings,
  p2pPort,
  rpcPort,
  rpcRestrictedPort,
  torDefaults,
  zmqPort,
  zmqPubsubPort,
} from '../utils'

// ── INI coercion helpers ────────────────────────────────────────────

const _iniString = z.union([
  z.array(z.string()).transform((a) => a.at(-1)!),
  z.string(),
])
const _iniNumber = z.union([
  z.array(z.string()).transform((a) => Number(a.at(-1))),
  z.string().transform(Number),
  z.number(),
])

const iniString = _iniString.optional().catch(undefined)
const iniNumber = _iniNumber.optional().catch(undefined)

const iniStringArray = z
  .union([z.array(z.string()), z.string().transform((s) => [s])])
  .optional()
  .catch(undefined)

// ── INI shape (raw file keys) ───────────────────────────────────────

export const shape = z.object({
  // Enforced
  'data-dir': z
    .literal('/home/monero/.bitmonero')
    .catch('/home/monero/.bitmonero'),
  'log-level': z.literal('0,blockchain:INFO').catch('0,blockchain:INFO'),
  'log-file': z
    .literal('/home/monero/.bitmonero/logs/monerod.log')
    .catch('/home/monero/.bitmonero/logs/monerod.log'),
  'max-log-file-size': z.literal(10000000).catch(10000000),
  'max-log-files': z.literal(2).catch(2),
  'p2p-bind-ip': z.literal('0.0.0.0').catch('0.0.0.0'),
  'p2p-bind-port': z.literal(p2pPort).catch(p2pPort),
  'rpc-bind-ip': z.literal('0.0.0.0').catch('0.0.0.0'),
  'rpc-bind-port': z.literal(rpcPort).catch(rpcPort),
  'confirm-external-bind': z.literal(1).catch(1),
  'rpc-access-control-origins': z.literal('*').catch('*'),
  'rpc-restricted-bind-ip': z.literal('0.0.0.0').catch('0.0.0.0'),
  'rpc-restricted-bind-port': z
    .literal(rpcRestrictedPort)
    .catch(rpcRestrictedPort),
  'db-sync-mode': z.literal('safe:sync').catch('safe:sync'),
  'enforce-dns-checkpointing': z.literal(0).catch(0),
  'disable-dns-checkpoints': z.literal(1).catch(1),
  'check-updates': z.literal('disabled').catch('disabled'),

  // Configurable
  'out-peers': iniNumber,
  'in-peers': iniNumber,
  'limit-rate-up': iniNumber,
  'limit-rate-down': iniNumber,
  'max-txpool-weight': iniNumber,
  'rpc-login': iniString,
  'no-zmq': iniNumber,
  'zmq-rpc-bind-ip': iniString,
  'zmq-rpc-bind-port': iniNumber,
  'zmq-pub': iniString,
  'disable-rpc-ban': iniNumber,
  'hide-my-port': iniNumber,
  igd: iniString,
  'public-node': iniNumber,
  'prune-blockchain': iniNumber,
  'pad-transactions': iniNumber,
  'ban-list': iniString,
  'block-notify': iniString,
  'add-peer': iniStringArray,
  'add-priority-node': iniStringArray,
  'add-exclusive-node': iniStringArray,
  'tx-proxy': iniString,
  proxy: iniString,
  'anonymous-inbound': iniString,
})

export type MoneroConf = z.infer<typeof shape>

// ── Master InputSpec (all user-facing config fields) ────────────────

const { InputSpec, Value, Variants, List } = sdk

const alphanumUnderscore = [
  {
    regex: '^[a-zA-Z0-9_]+$',
    description: i18n(
      'Must be alphanumeric and/or can contain an underscore',
    ),
  },
]

const peerSpec = InputSpec.of({
  hostname: Value.text({
    name: i18n('Hostname'),
    description: i18n('Domain name, onion or IP address of Monero peer.'),
    required: true,
    default: null,
    patterns: [
      {
        regex:
          '(^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$)|((^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$)|(^[a-z2-7]{16}\\.onion$)|(^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$)',
        description: i18n('Hostname'),
      },
    ],
  }),
  port: Value.number({
    name: i18n('Port'),
    description: i18n(
      'TCP Port that peer is listening on for inbound p2p connections. Default: 18080',
    ),
    required: false,
    default: p2pPort,
    integer: true,
    min: 0,
    max: 65535,
  }),
  priority: Value.toggle({
    name: i18n('Priority Node'),
    description: i18n('Attempt to stay perpetually connected to this peer'),
    default: false,
  }),
})

export const fullConfigSpec = InputSpec.of({
  raw: Value.hidden(shape),

  // ── Other ──
  maxbytes: Value.number({
    name: i18n('Maximum TX Pool Size'),
    description: i18n(
      'Keep the unconfirmed transaction memory pool at or below this many megabytes. You may wish to decrease this if you are low on RAM, or increase if you are mining. Default: 648 MiB.',
    ),
    required: true,
    default: 648,
    integer: true,
    min: 1,
    units: i18n('MiB'),
  }),
  zmq: Value.toggle({
    name: i18n('ZMQ Interface'),
    description: i18n(
      'Enable the ZeroMQ interface for real-time block and transaction notifications. Required by some services such as block explorers and mining software. Default: Disabled',
    ),
    default: false,
  }),
  pruning: Value.toggle({
    name: i18n('Pruning'),
    description: i18n(
      'Blockchain pruning prunes proof data from transactions after verification but before storage. Saves roughly 2/3 of disk space. Default: Disabled',
    ),
    default: false,
  }),
  btcpayserver: Value.toggle({
    name: i18n('BTCPayServer'),
    description: i18n(
      'Send notifications of new Monero blocks to the BTCPayServer back-end. Default: Disabled',
    ),
    default: false,
  }),

  // ── Networking ──
  'in-peers': Value.number({
    name: i18n('Max Peers Incoming'),
    description: i18n(
      'Maximum number of simultaneous peers connecting inbound to the Monero daemon. Default: 24',
    ),
    required: false,
    default: 24,
    integer: true,
    min: 0,
    max: 9999,
  }),
  'out-peers': Value.number({
    name: i18n('Max Peers Outgoing'),
    description: i18n(
      'Maximum number of simultaneous peers for the Monero daemon to connect outbound to. Default: 12',
    ),
    required: false,
    default: 12,
    integer: true,
    min: 0,
    max: 9999,
  }),
  gossip: Value.toggle({
    name: i18n('Peer Gossip'),
    description: i18n(
      'Disabling peer gossip will tell connected peers not to gossip your node info to their peers. This will make your node more private. Leaving this enabled will result in more connections for your node. Default: Enabled',
    ),
    default: true,
  }),
  'ban-list': Value.toggle({
    name: i18n('Spy Nodes Ban List'),
    description: i18n(
      'Use a third-party provided list to ban known spy nodes. Default: Enabled',
    ),
    default: true,
  }),
  'public-node': Value.toggle({
    name: i18n('Advertise RPC Remote Node'),
    description: i18n(
      'Advertise on the P2P network that your restricted RPC port offers Remote Node services. Caution: this could significantly increase resource use. Default: Disabled',
    ),
    default: false,
  }),
  'strict-nodes': Value.toggle({
    name: i18n('Specific Nodes Only'),
    description: i18n(
      'Only connect to the peers specified below and no other peers. Default: Disabled',
    ),
    default: false,
  }),
  peer: Value.list(
    List.obj(
      {
        name: i18n('Add Peers'),
        description: i18n(
          'Optionally add addresses of specific p2p nodes that your Monero node should connect to',
        ),
        default: [],
        minLength: null,
        maxLength: null,
      },
      {
        spec: peerSpec,
        displayAs: null,
        uniqueBy: null,
      },
    ),
  ),
  toronly: Value.toggle({
    name: i18n('Tor Only'),
    description: i18n(
      'Only communicate with Monero nodes via Tor. This is more private, but can be slower, especially during initial sync. Default: Enabled',
    ),
    default: torDefaults.toronly,
  }),
  'rpc-ban': Value.toggle({
    name: i18n('Ban Misbehaving RPC Clients'),
    description: i18n(
      'Ban hosts that generate RPC errors. Leaving disabled may help prevent monerod from banning traffic originating from the Tor daemon. Default: Disabled',
    ),
    default: false,
  }),
  maxonionconns: Value.number({
    name: i18n('Max Tor RPC Connections'),
    description: i18n(
      "Maximum number of simultaneous connections allowed to Monero's .onion RPC. Default: 16",
    ),
    required: true,
    default: torDefaults.maxonionconns,
    integer: true,
    min: 1,
    max: 256,
    units: i18n('Connections'),
  }),
  maxsocksconns: Value.number({
    name: i18n('Max Tor Broadcast Connections'),
    description: i18n(
      "Maximum number of simultaneous connections to Tor's SOCKS proxy when broadcasting transactions. Default: 16",
    ),
    required: true,
    default: torDefaults.maxsocksconns,
    integer: true,
    min: 1,
    max: 256,
    units: i18n('Connections'),
  }),
  dandelion: Value.toggle({
    name: i18n('Dandelion++'),
    description: i18n(
      'Enables white noise and Dandelion++ sender node obfuscation scheme. Default: Enabled',
    ),
    default: torDefaults.dandelion,
  }),
  'limit-rate-down': Value.number({
    name: i18n('Download Speed Limit'),
    description: i18n(
      "Keep the Monero p2p node's incoming bandwidth rate limited at or under this many kilobytes per second. Default: 8192 kB/s",
    ),
    required: true,
    default: 8192,
    integer: true,
    min: 1,
    units: i18n('kB/s'),
  }),
  'limit-rate-up': Value.number({
    name: i18n('Upload Speed Limit'),
    description: i18n(
      "Keep the Monero p2p node's outgoing bandwidth rate limited at or under this many kilobytes per second. Default: 2048 kB/s",
    ),
    required: true,
    default: 2048,
    integer: true,
    min: 1,
    units: i18n('kB/s'),
  }),

  // ── RPC ──
  'rpc-credentials': Value.union({
    name: i18n('RPC Credentials'),
    description: i18n(
      'Enable or disable a username and password to access the Monero RPC. Default: Disabled',
    ),
    default: 'disabled',
    variants: Variants.of({
      disabled: {
        name: i18n('Disabled'),
        spec: InputSpec.of({}),
      },
      enabled: {
        name: i18n('Enabled'),
        spec: InputSpec.of({
          username: Value.text({
            name: i18n('RPC Username'),
            description: i18n(
              "The username for connecting to Monero's unrestricted RPC interface",
            ),
            warning: i18n(
              'Changing this value will necessitate a restart of all services that depend on Monero.',
            ),
            required: true,
            default: 'monero',
            patterns: alphanumUnderscore,
          }),
          password: Value.text({
            name: i18n('RPC Password'),
            description: i18n(
              "The password for connecting to Monero's unrestricted RPC interface",
            ),
            warning: i18n(
              'Changing this value will necessitate a restart of all services that depend on Monero.',
            ),
            required: true,
            default: { charset: 'a-z,A-Z,0-9', len: 22 },
            patterns: alphanumUnderscore,
            masked: true,
            generate: { charset: 'a-z,A-Z,0-9', len: 22 },
          }),
        }),
      },
    }),
  }),
})

// ── INI → Form (onRead) ────────────────────────────────────────────

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

function parsePeerString(s: string): { hostname: string; port: number } | null {
  const [hostname, portStr] = s.split(':')
  if (!hostname) return null
  return { hostname, port: Number(portStr) || p2pPort }
}

function parseRpcLogin(login: string | undefined) {
  if (login) {
    const colonIdx = login.indexOf(':')
    if (colonIdx > 0) {
      return {
        selection: 'enabled' as const,
        value: {
          username: login.substring(0, colonIdx),
          password: login.substring(colonIdx + 1),
        },
      }
    }
  }
  return { selection: 'disabled' as const, value: {} }
}

function fileToForm(
  conf: MoneroConf,
): T.DeepPartial<typeof fullConfigSpec._TYPE> {
  const strictNodes = conf['add-exclusive-node'] !== undefined
  const tor = fromTorSettings(conf)

  const peer: Array<{
    hostname: string
    port: number | null
    priority: boolean
  }> = []
  if (strictNodes) {
    for (const node of toArray(conf['add-exclusive-node'])) {
      const parsed = parsePeerString(node)
      if (parsed) peer.push({ ...parsed, priority: false })
    }
  } else {
    for (const node of toArray(conf['add-peer'])) {
      const parsed = parsePeerString(node)
      if (parsed) peer.push({ ...parsed, priority: false })
    }
    for (const node of toArray(conf['add-priority-node'])) {
      const parsed = parsePeerString(node)
      if (parsed) peer.push({ ...parsed, priority: true })
    }
  }

  return {
    raw: conf,

    // Other
    maxbytes: Math.round((conf['max-txpool-weight'] ?? 648000000) / 1000000),
    zmq: conf['no-zmq'] === undefined || conf['no-zmq'] === 0,
    pruning:
      conf['prune-blockchain'] !== undefined && conf['prune-blockchain'] !== 0,
    btcpayserver: conf['block-notify'] !== undefined,

    // Networking
    'in-peers': conf['in-peers'],
    'out-peers': conf['out-peers'],
    gossip: conf['hide-my-port'] === undefined,
    'ban-list': conf['ban-list'] !== undefined,
    'public-node':
      conf['public-node'] !== undefined && conf['public-node'] !== 0,
    'strict-nodes': strictNodes,
    peer,
    ...tor,
    'rpc-ban': conf['disable-rpc-ban'] === undefined,
    'limit-rate-down': conf['limit-rate-down'],
    'limit-rate-up': conf['limit-rate-up'],

    // RPC
    'rpc-credentials': parseRpcLogin(conf['rpc-login']),
  }
}

// ── Form → INI (onWrite) ───────────────────────────────────────────

function formToFile(
  input: T.DeepPartial<typeof fullConfigSpec._TYPE>,
): MoneroConf {
  const {
    raw,
    maxbytes,
    zmq,
    pruning,
    btcpayserver,
    gossip,
    peer,
    'rpc-credentials': rpcCredentials,
    ...rest
  } = input

  const peerAddr = (p: { hostname?: string; port?: number | null }) =>
    p.port != null ? `${p.hostname}:${p.port}` : (p.hostname ?? '')
  const peers = (peer ?? []).filter((p): p is NonNullable<typeof p> => !!p)
  const regular = peers.filter((p) => !p.priority)
  const priority = peers.filter((p) => p.priority)

  const rpcLogin =
    rpcCredentials?.selection === 'enabled'
      ? `${rpcCredentials.value?.username}:${rpcCredentials.value?.password}`
      : undefined

  return {
    ...raw,

    // Other
    'max-txpool-weight': maxbytes ? maxbytes * 1000000 : undefined,
    'prune-blockchain': pruning ? 1 : undefined,
    'block-notify': btcpayserver
      ? '/usr/bin/curl -so /dev/null -X GET http://btcpayserver.embassy:23000/monerolikedaemoncallback/block?cryptoCode=xmr&hash=%s'
      : undefined,
    'no-zmq': zmq ? undefined : 1,
    'zmq-rpc-bind-ip': zmq ? '0.0.0.0' : undefined,
    'zmq-rpc-bind-port': zmq ? zmqPort : undefined,
    'zmq-pub': zmq ? `tcp://0.0.0.0:${zmqPubsubPort}` : undefined,

    // Networking (simple fields — tor INI fields come from raw passthrough)
    'out-peers': rest['out-peers'] as number | undefined,
    'in-peers': rest['in-peers'] as number | undefined,
    'limit-rate-up': rest['limit-rate-up'],
    'limit-rate-down': rest['limit-rate-down'],
    'disable-rpc-ban': rest['rpc-ban'] ? undefined : 1,
    'public-node': rest['public-node'] ? 1 : undefined,
    'ban-list': rest['ban-list'] ? '/home/monero/ban_list.txt' : undefined,
    'hide-my-port': gossip ? undefined : 1,
    igd: !gossip || rest.toronly ? 'disabled' : undefined,
    'add-peer':
      !rest['strict-nodes'] && regular.length > 0
        ? regular.map(peerAddr)
        : undefined,
    'add-priority-node':
      !rest['strict-nodes'] && priority.length > 0
        ? priority.map(peerAddr)
        : undefined,
    'add-exclusive-node':
      rest['strict-nodes'] && peers.length > 0
        ? peers.map(peerAddr)
        : undefined,

    // RPC
    'rpc-login': rpcLogin,
  } as MoneroConf
}

// ── Stringify primitives for INI output ─────────────────────────────

function stringifyPrimitives(a: unknown): any {
  if (a && typeof a === 'object') {
    if (Array.isArray(a)) return a.map(stringifyPrimitives)
    return Object.fromEntries(
      Object.entries(a).map(([k, v]) => [k, stringifyPrimitives(v)]),
    )
  } else if (typeof a === 'boolean') {
    return a ? 1 : 0
  }
  return a
}

// ── File helper ─────────────────────────────────────────────────────

export const moneroConfFile = FileHelper.ini(
  {
    base: sdk.volumes.monerod,
    subpath: 'monero.conf',
  },
  fullConfigSpec.partialValidator,
  { bracketedArray: false },
  {
    onRead: (a) => {
      const base = shape.parse(a)
      return fileToForm(base)
    },
    onWrite: (a) => {
      return stringifyPrimitives(formToFile(a))
    },
  },
)
