import { fullConfigSpec, moneroConfFile } from '../../fileModels/monero.conf'
import { walletRpcConfFile } from '../../fileModels/monero-wallet-rpc.conf'
import { sdk } from '../../sdk'
import { i18n } from '../../i18n'

export const rpcConfig = sdk.Action.withInput(
  'rpc-config',

  async ({ effects }) => ({
    name: i18n('Daemon RPC Settings'),
    description: i18n('Configure Monero daemon RPC credentials'),
    warning: null,
    allowedStatuses: 'any',
    group: i18n('Configuration'),
    visibility: 'enabled',
  }),

  fullConfigSpec.filter({
    'rpc-credentials': true,
  }),

  ({ effects }) => moneroConfFile.read().once(),

  async ({ effects, input }) => {
    await moneroConfFile.merge(effects, input)

    // Keep wallet-rpc daemon-login in sync
    const rpcLogin =
      input['rpc-credentials'].selection === 'enabled'
        ? `${input['rpc-credentials'].value.username}:${input['rpc-credentials'].value.password}`
        : undefined
    await walletRpcConfFile.merge(effects, {
      'daemon-login': rpcLogin,
    })
  },
)
