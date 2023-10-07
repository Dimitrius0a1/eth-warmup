import { privateKeyConvert, readWallets } from "./utils/wallet"
import { random, randomFloat, shuffle, sleep } from "./utils/common"
import { baseBridgeConfig, generalConfig, transferConfig, zkBridgeConfig, zoraBridgeConfig } from "./config"
import { makeLogger } from "./utils/logger"
import { entryPoint } from "./utils/menu"
import { BaseBridge } from "./modules/baseBridge"
import { waitGas } from "./utils/getCurrentGas"
import { ZkBridge } from "./modules/zkBridge"
import { getAddressTxCount } from "./utils/getAddressTxCount"
import { getEthWalletClient, getPublicEthClient } from "./utils/ethClient"
import { ZoraBridge } from "./modules/zoraBridge"
import { StarknetBridge } from "./modules/starknetBridge"
import { Transfer } from "./modules/transfer"

let privateKeys = readWallets('./private_keys.txt')

async function baseBridgeModule() {
    const logger = makeLogger("Base bridge")
    for (let privateKey of privateKeys) {
        const wallet = getEthWalletClient(privateKeyConvert(privateKey))
        if (await getAddressTxCount(wallet.account.address) >= generalConfig.maxAddressTxCount) {
            logger.info(`Address ${wallet.account.address} has ${generalConfig.maxAddressTxCount} or more transactions, skip`)
            continue
        }

        const bridge = new BaseBridge(privateKeyConvert(privateKey))
        const sum = randomFloat(baseBridgeConfig.bridgeFrom, baseBridgeConfig.bridgeTo)
        if (await waitGas()) {
            await bridge.bridge(sum.toString())
        }
        
        const sleepTime = random(generalConfig.sleepFrom, generalConfig.sleepTo)
        logger.info(`Waiting ${sleepTime} sec until next wallet...`)
        await sleep(sleepTime * 1000)
    }
}

async function zoraBridgeModule() {
    const logger = makeLogger("Zora bridge")
    for (let privateKey of privateKeys) {
        const wallet = getEthWalletClient(privateKeyConvert(privateKey))
        if (await getAddressTxCount(wallet.account.address) >= generalConfig.maxAddressTxCount) {
            logger.info(`Address ${wallet.account.address} has ${generalConfig.maxAddressTxCount} or more transactions, skip`)
            continue
        }
        
        const bridge = new ZoraBridge(privateKeyConvert(privateKey))
        const sum = randomFloat(zoraBridgeConfig.bridgeFrom, zoraBridgeConfig.bridgeTo)
        if (await waitGas()) {
            await bridge.bridge(sum.toString())
        }
        
        const sleepTime = random(generalConfig.sleepFrom, generalConfig.sleepTo)
        logger.info(`Waiting ${sleepTime} sec until next wallet...`)
        await sleep(sleepTime * 1000)
    }
}

async function zkBridgeModule() {
    const logger = makeLogger("Zk bridge")
    for (let privateKey of privateKeys) {
        const wallet = getEthWalletClient(privateKeyConvert(privateKey))
        if (await getAddressTxCount(wallet.account.address) >= generalConfig.maxAddressTxCount) {
            logger.info(`Address ${wallet.account.address} has ${generalConfig.maxAddressTxCount} or more transactions, skip`)
            continue
        }

        const bridge = new ZkBridge(privateKeyConvert(privateKey))
        const sum = randomFloat(zkBridgeConfig.bridgeFrom, zkBridgeConfig.bridgeTo)
        if (await waitGas()) {
            await bridge.bridge(sum.toString())
        }
        
        const sleepTime = random(generalConfig.sleepFrom, generalConfig.sleepTo)
        logger.info(`Waiting ${sleepTime} sec until next wallet...`)
        await sleep(sleepTime * 1000)
    }
}

async function starknetBridgeModule() {
    const logger = makeLogger("Starknet bridge")
    const starknetAddresses = readWallets('./addresses_starknet.txt')
    for (const [index, privateKey] of privateKeys.entries()) {
        const wallet = getEthWalletClient(privateKeyConvert(privateKey))
        if (await getAddressTxCount(wallet.account.address) >= generalConfig.maxAddressTxCount) {
            logger.info(`Address ${wallet.account.address} has ${generalConfig.maxAddressTxCount} or more transactions, skip`)
            continue
        }

        const bridge = new StarknetBridge(privateKeyConvert(privateKey), starknetAddresses[index])
        const sum = randomFloat(zkBridgeConfig.bridgeFrom, zkBridgeConfig.bridgeTo)
        if (await waitGas()) {
            await bridge.bridge(sum.toString())
        }
        
        const sleepTime = random(generalConfig.sleepFrom, generalConfig.sleepTo)
        logger.info(`Waiting ${sleepTime} sec until next wallet...`)
        await sleep(sleepTime * 1000)
    }
}

async function transferModule() {
    const logger = makeLogger("Transfer")
    const addresses = readWallets('./addresses_evm.txt')
    const client = getPublicEthClient()
    for (const [index, privateKey] of privateKeys.entries()) {
        const wallet = getEthWalletClient(privateKeyConvert(privateKey))
        if (await getAddressTxCount(wallet.account.address) >= generalConfig.maxAddressTxCount) {
            logger.info(`Address ${wallet.account.address} has ${generalConfig.maxAddressTxCount} or more transactions, skip`)
            continue
        }

        const bridge = new Transfer(privateKeyConvert(privateKey))
        const randomPercent: number = random(transferConfig.percentSendFrom, transferConfig.percentSendTo) / 100
        const ethBalance: bigint = await client.getBalance({ address: wallet.account.address })
        let amount: bigint = BigInt(Math.round(Number(ethBalance) * randomPercent))
        if (await waitGas()) {
            await bridge.bridge(amount, privateKeyConvert(addresses[index]))
        }
        
        const sleepTime = random(generalConfig.sleepFrom, generalConfig.sleepTo)
        logger.info(`Waiting ${sleepTime} sec until next wallet...`)
        await sleep(sleepTime * 1000)
    }
}

async function randomModule() {
    const logger = makeLogger("Random")
    for (let privateKey of privateKeys) {
        const wallet = getEthWalletClient(privateKeyConvert(privateKey))
        let modules = generalConfig.modules
        shuffle(modules)

        for (let i = 0; i < generalConfig.maxTxPerRun; i++) {
            if (await getAddressTxCount(wallet.account.address) >= generalConfig.maxAddressTxCount) {
                logger.info(`Address ${wallet.account.address} has ${generalConfig.maxAddressTxCount} or more transactions, skip`)
                continue
            }

            if (modules[i] == 'base_bridge') {
                const bridge = new BaseBridge(privateKeyConvert(privateKey))
                const sum = randomFloat(baseBridgeConfig.bridgeFrom, baseBridgeConfig.bridgeTo)
                if (await waitGas()) {
                    await bridge.bridge(sum.toString())
                }
            }

            if (modules[i] == 'zora_bridge') {
                const bridge = new BaseBridge(privateKeyConvert(privateKey))
                const sum = randomFloat(baseBridgeConfig.bridgeFrom, baseBridgeConfig.bridgeTo)
                if (await waitGas()) {
                    await bridge.bridge(sum.toString())
                }
            }

            if (modules[i] == 'zk_bridge') {
                const bridge = new ZkBridge(privateKeyConvert(privateKey))
                const sum = randomFloat(zkBridgeConfig.bridgeFrom, zkBridgeConfig.bridgeTo)
                if (await waitGas()) {
                    await bridge.bridge(sum.toString())
                }
            }
            
            const sleepTime = random(generalConfig.sleepFrom, generalConfig.sleepTo)
            logger.info(`Waiting ${sleepTime} sec until next action...`)
            await sleep(sleepTime * 1000)
        }

        const sleepTime = random(generalConfig.sleepFrom, generalConfig.sleepTo)
        logger.info(`Waiting ${sleepTime} sec until next wallet...`)
        await sleep(sleepTime * 1000)
    }
}

async function startMenu() {
    let mode = await entryPoint()
    switch (mode) {
        case "random":
            await randomModule()
            break
        case "base_bridge":
            await baseBridgeModule()
            break
        case "zora_bridge":
            await zoraBridgeModule()
            break
        case "zk_bridge":
            await zkBridgeModule()
            break
        case "starknet_bridge":
            await starknetBridgeModule()
            break
        case "transfer":
            await transferModule()
            break
    }
}

await startMenu()