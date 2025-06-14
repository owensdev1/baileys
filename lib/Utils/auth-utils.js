"use strict"
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : {
        "default": mod
    }
}
Object.defineProperty(exports, "__esModule", {
    value: true
})
const crypto_1 = require("crypto")
const node_cache_1 = __importDefault(require("@cacheable/node-cache"))
const Defaults_1 = require("../Defaults")
const crypto_2 = require("./crypto")
const generics_1 = require("./generics")

function makeCacheableSignalKeyStore(store, logger, _cache) {
    const cache = _cache || new node_cache_1.default({
        stdTTL: Defaults_1.DEFAULT_CACHE_TTLS.SIGNAL_STORE,
        useClones: false,
        deleteOnExpire: true,
    })

    function getUniqueId(type, id) {
        return `${type}.${id}`
    }
    return {
        async get(type, ids) {
            const data = {}
            const idsToFetch = []
            for (const id of ids) {
                const item = cache.get(getUniqueId(type, id))
                if (typeof item !== 'undefined') {
                    data[id] = item
                } else {
                    idsToFetch.push(id)
                }
            }
            if (idsToFetch.length) {
                logger?.trace({
                    items: idsToFetch.length
                }, 'loading from store')
                const fetched = await store.get(type, idsToFetch)
                for (const id of idsToFetch) {
                    const item = fetched[id]
                    if (item) {
                        data[id] = item
                        cache.set(getUniqueId(type, id), item)
                    }
                }
            }
            return data
        },
        async set(data) {
            let keys = 0
            for (const type in data) {
                for (const id in data[type]) {
                    cache.set(getUniqueId(type, id), data[type][id])
                    keys += 1
                }
            }
            logger?.trace({
                keys
            }, 'updated cache')
            await store.set(data)
        },
        async clear() {
            cache.flushAll()
            await store.clear?.call(store)
        }
    }
}

const addTransactionCapability = (state, logger, {
    maxCommitRetries,
    delayBetweenTriesMs
}) => {


    let dbQueriesInTransaction = 0
    let transactionCache = {}
    let mutations = {}
    let transactionsInProgress = 0
    return {
        get: async (type, ids) => {
            if (isInTransaction()) {
                const dict = transactionCache[type]
                const idsRequiringFetch = dict ?
                    ids.filter(item => typeof dict[item] === 'undefined') :
                    ids

                if (idsRequiringFetch.length) {
                    dbQueriesInTransaction += 1
                    const result = await state.get(type, idsRequiringFetch)
                    transactionCache[type] || (transactionCache[type] = {})
                    Object.assign(transactionCache[type], result)
                }
                return ids.reduce((dict, id) => {
                    const value = transactionCache[type]?. [id]
                    if (value) {
                        dict[id] = value
                    }
                    return dict
                }, {})
            } else {
                return state.get(type, ids)
            }
        },
        set: data => {
            if (isInTransaction()) {
                logger.trace({
                    types: Object.keys(data)
                }, 'caching in transaction')
                for (const key in data) {
                    transactionCache[key] = transactionCache[key] || {}
                    Object.assign(transactionCache[key], data[key])
                    mutations[key] = mutations[key] || {}
                    Object.assign(mutations[key], data[key])
                }
            } else {
                return state.set(data)
            }
        },
        isInTransaction,
        async transaction(work) {
            let result
            transactionsInProgress += 1
            if (transactionsInProgress === 1) {
                logger.trace('entering transaction')
            }
            try {
                result = await work()

                if (transactionsInProgress === 1) {
                    if (Object.keys(mutations).length) {
                        logger.trace('committing transaction')


                        let tries = maxCommitRetries
                        while (tries) {
                            tries -= 1
                            try {
                                await state.set(mutations)
                                logger.trace({
                                    dbQueriesInTransaction
                                }, 'committed transaction')
                                break
                            } catch (error) {
                                logger.warn(`failed to commit ${Object.keys(mutations).length} mutations, tries left=${tries}`)
                                await generics_1.delay(delayBetweenTriesMs)
                            }
                        }
                    } else {
                        logger.trace('no mutations in transaction')
                    }
                }
            } finally {
                transactionsInProgress -= 1
                if (transactionsInProgress === 0) {
                    transactionCache = {}
                    mutations = {}
                    dbQueriesInTransaction = 0
                }
            }
            return result
        }
    }

    function isInTransaction() {
        return transactionsInProgress > 0
    }
}
const initAuthCreds = () => {
    const identityKey = crypto_2.Curve.generateKeyPair()
    return {
        noiseKey: crypto_2.Curve.generateKeyPair(),
        pairingEphemeralKeyPair: crypto_2.Curve.generateKeyPair(),
        signedIdentityKey: identityKey,
        signedPreKey: crypto_2.signedKeyPair(identityKey, 1),
        registrationId: generics_1.generateRegistrationId(),
        advSecretKey: crypto_1.randomBytes(32).toString('base64'),
        processedHistoryMessages: [],
        nextPreKeyId: 1,
        firstUnuploadedPreKeyId: 1,
        accountSyncCounter: 0,
        accountSettings: {
            unarchiveChats: false
        },
        registered: false,
        pairingCode: undefined,
        lastPropHash: undefined,
        routingInfo: undefined
    }
}
module.exports = {
    makeCacheableSignalKeyStore,
    addTransactionCapability,
    initAuthCreds
}