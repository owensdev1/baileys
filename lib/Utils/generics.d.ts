import {
    AxiosRequestConfig
} from 'axios'
import {
    ILogger
} from './logger'
import {
    proto
} from '../../WAProto'
import {
    BaileysEventEmitter,
    BaileysEventMap,
    BrowsersMap,
    ConnectionState,
    WACallUpdateType,
    WAVersion
} from '../Types'
import {
    BinaryNode
} from '../WABinary'
export declare const Browsers: BrowsersMap
export declare const getPlatformId: (browser: string) => any
export declare const BufferJSON: {
    replacer: (k: any, value: any) => any
    reviver: (_: any, value: any) => any
}
export declare const getKeyAuthor: (key: proto.IMessageKey | undefined | null, meId ? : string) => string
export declare const writeRandomPadMax16: (msg: Uint8Array) => Buffer
export declare const unpadRandomMax16: (e: Uint8Array | Buffer) => Uint8Array
export declare const encodeWAMessage: (message: proto.IMessage) => Buffer
export declare const encodeNewsletterMessage: (message: proto.IMessage) => Uint8Array
export declare const generateRegistrationId: () => number
export declare const encodeBigEndian: (e: number, t ? : number) => Uint8Array
export declare const toNumber: (t: Long | number | null | undefined) => number

export declare const unixTimestampSeconds: (date ? : Date) => number
export type DebouncedTimeout = ReturnType < typeof debouncedTimeout >
    export declare const debouncedTimeout: (intervalMs ? : number, task ? : () => void) => {
        start: (newIntervalMs ? : number, newTask ? : () => void) => void
        cancel: () => void
        setTask: (newTask: () => void) => () => void
        setInterval: (newInterval: number) => number
    }
export declare const delay: (ms: number) => Promise < void >
    export declare const delayCancellable: (ms: number) => {
        delay: Promise < void >
            cancel: () => void
    }
export declare function promiseTimeout < T > (ms: number | undefined, promise: (resolve: (v: T) => void, reject: (error: any) => void) => void): Promise < T >
    export declare const generateMessageID: (userId ? : string) => string
export declare function bindWaitForEvent < T extends keyof BaileysEventMap > (ev: BaileysEventEmitter, event: T): (check: (u: BaileysEventMap[T]) => boolean | undefined, timeoutMs ? : number) => Promise < void >
    export declare const bindWaitForConnectionUpdate: (ev: BaileysEventEmitter) => (check: (u: Partial < ConnectionState > ) => boolean | undefined, timeoutMs ? : number) => Promise < void >
        export declare const printQRIfNecessaryListener: (ev: BaileysEventEmitter, logger: ILogger) => void

export declare const fetchLatestBaileysVersion: (options ? : AxiosRequestConfig < {} > ) => Promise < {
        version: WAVersion
        isLatest: boolean
        error ? : undefined
    } | {
        version: WAVersion
        isLatest: boolean
        error: any
    } >

    export declare const fetchLatestWaWebVersion: (options: AxiosRequestConfig < {} > ) => Promise < {
            version: WAVersion
            isLatest: boolean
            error ? : undefined
        } | {
            version: WAVersion
            isLatest: boolean
            error: any
        } >

        export declare const generateMdTagPrefix: () => string

export declare const getStatusFromReceiptType: (type: string | undefined) => proto.WebMessageInfo.Status

export declare const getErrorCodeFromStreamError: (node: BinaryNode) => {
    reason: string
    statusCode: number
}
export declare const getCallStatusFromNode: ({
    tag,
    attrs
}: BinaryNode) => WACallUpdateType
export declare const getCodeFromWSError: (error: Error) => number

export declare const isWABusinessPlatform: (platform: string) => boolean
export declare function trimUndefined(obj: {
    [_: string]: any
}): {
    [_: string]: any
}
export declare function bytesToCrockford(buffer: Buffer): string
export declare function toUnicodeEscape(text: string): string
export declare function fromUnicodeEscape(escapedText: string): string
export declare function asciiEncode(text: string): string
export declare function asciiDecode(...codes: string[]): string[]