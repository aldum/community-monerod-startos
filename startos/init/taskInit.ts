import { moneroConfFile } from '../fileModels/monero.conf'
import { walletRpcConfFile } from '../fileModels/monero-wallet-rpc.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const taskInit = sdk.setupOnInit(async (effects) => {
  await Promise.all([
    moneroConfFile.merge(effects, {
      'no-zmq': 1,
      'disable-rpc-ban': 1,
      igd: 'disabled',
      'ban-list': '/home/monero/ban_list.txt',
    } as any),
    walletRpcConfFile.merge(effects, {
      'disable-rpc-login': 1,
    } as any),
    storeJson.merge(effects, {}),
  ])
})
