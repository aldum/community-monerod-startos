import { fullConfigSpec, moneroConfFile } from '../../fileModels/monero.conf'
import { sdk } from '../../sdk'
import { i18n } from '../../i18n'

export const otherConfig = sdk.Action.withInput(
  'other-config',

  async ({ effects }) => ({
    name: i18n('Other Settings'),
    description: i18n('Configure mempool, ZMQ, pruning, and integrations'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  fullConfigSpec.filter({
    maxbytes: true,
    zmq: true,
    pruning: true,
    btcpayserver: true,
  }),

  ({ effects }) => moneroConfFile.read().once(),

  async ({ effects, input }) => {
    await moneroConfFile.merge(effects, input)
  },
)
