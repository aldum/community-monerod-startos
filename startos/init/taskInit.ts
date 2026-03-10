import { moneroConfFile } from '../fileModels/monero.conf'
import { walletRpcConfFile } from '../fileModels/monero-wallet-rpc.conf'
import { storeJson } from '../fileModels/store.json'
import { sdk } from '../sdk'

export const taskInit = sdk.setupOnInit(async (effects) => {
  await Promise.all([
    moneroConfFile.write(effects, {
      'no-zmq': 1,
      'disable-rpc-ban': 1,
      igd: 'disabled',
      'ban-list': '/home/monero/ban_list.txt',
    } as any),
    walletRpcConfFile.write(effects, {
      'disable-rpc-login': 1,
    } as any),
    storeJson.write(effects, {} as any),
  ])
})
