import { T } from '@start9labs/start-sdk'
import { fullConfigSpec, moneroConfFile } from '../../fileModels/monero.conf'
import { i18n } from '../../i18n'
import { sdk } from '../../sdk'
import { anonymousInbound, toTorSettings } from '../../utils'

type NetworkingSpec = typeof networkingFilter._TYPE

const networkingFilter = fullConfigSpec.filter({
  'in-peers': true,
  'out-peers': true,
  gossip: true,
  'ban-list': true,
  'public-node': true,
  'strict-nodes': true,
  peer: true,
  toronly: true,
  'rpc-ban': true,
  maxonionconns: true,
  maxsocksconns: true,
  dandelion: true,
  'limit-rate-down': true,
  'limit-rate-up': true,
})

export const networkingConfig = sdk.Action.withInput(
  'networking-config',

  async ({ effects }) => ({
    name: i18n('Networking Settings'),
    description: i18n('Configure peer, Tor, and rate limit settings'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  networkingFilter,

  ({ effects }) => moneroConfFile.read().once(),

  ({ effects, input }) => write(effects, input),
)

async function write(effects: T.Effects, input: NetworkingSpec) {
  const torIp = input.toronly
    ? await sdk.getContainerIp(effects, { packageId: 'tor' })
    : undefined
  const torProxyAddress = torIp ? `${torIp}:9050` : ''

  const peerOnionUrl = input.toronly
    ? await sdk.serviceInterface
        .getOwn(effects, 'peer', (iface) =>
          (iface?.addressInfo?.public.format() || []).find((url) =>
            url.includes('.onion'),
          ),
        )
        .once()
    : undefined
  const peerTorAddress = peerOnionUrl ? new URL(peerOnionUrl).hostname : ''

  // Compute tor INI fields and inject into raw for passthrough
  await moneroConfFile.merge(effects, {
    ...input,
    raw: {
      ...toTorSettings(
        {
          toronly: input.toronly,
          maxsocksconns: input.maxsocksconns,
          maxonionconns: input.maxonionconns,
          dandelion: input.dandelion,
        },
        torProxyAddress,
      ),
      'anonymous-inbound':
        input.toronly && input.gossip && peerTorAddress
          ? anonymousInbound(peerTorAddress, input.maxonionconns)
          : undefined,
    },
  })
}
