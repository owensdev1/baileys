"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeNoiseHandler = void 0;

const boom_1 = require("@hapi/boom");
const WAProto_1 = require("../../WAProto");
const Defaults_1 = require("../Defaults");
const WABinary_1 = require("../WABinary");
const crypto_1 = require("./crypto");

const generateIV = (counter) => {
    const iv = new ArrayBuffer(12);
    new DataView(iv).setUint32(8, counter);
    return new Uint8Array(iv);
};

const makeNoiseHandler = ({ keyPair: { private: privateKey, public: publicKey }, NOISE_HEADER, mobile, logger, routingInfo }) => {
    logger = logger.child({ class: 'ns' });

    const authenticate = (data) => {
        if (!isFinished) {
            hash = (0, crypto_1.sha256)(Buffer.concat([hash, data]));
        }
    };

    const encrypt = (plaintext) => {
        const result = (0, crypto_1.aesEncryptGCM)(plaintext, encKey, generateIV(writeCounter), hash);
        writeCounter += 1;
        authenticate(result);
        return result;
    };

    const decrypt = (ciphertext) => {
        const iv = generateIV(isFinished ? readCounter : writeCounter);
        const result = (0, crypto_1.aesDecryptGCM)(ciphertext, decKey, iv, hash);
        if (isFinished) {
            readCounter += 1;
        } else {
            writeCounter += 1;
        }
        authenticate(ciphertext);
        return result;
    };

    const localHKDF = (data) => {
        const key = (0, crypto_1.hkdf)(Buffer.from(data), 64, { salt, info: '' });
        return [key.slice(0, 32), key.slice(32)];
    };

    const mixIntoKey = (data) => {
        const [write, read] = localHKDF(data);
        salt = write;
        encKey = read;
        decKey = read;
        readCounter = 0;
        writeCounter = 0;
    };

    const finishInit = () => {
        const [write, read] = localHKDF(new Uint8Array(0));
        encKey = write;
        decKey = read;
        hash = Buffer.from([]);
        readCounter = 0;
        writeCounter = 0;
        isFinished = true;
    };

    const data = Buffer.from(Defaults_1.NOISE_MODE);
    let hash = Buffer.from(data.length === 32 ? data : (0, crypto_1.sha256)(data));
    let salt = hash;
    let encKey = hash;
    let decKey = hash;
    let readCounter = 0;
    let writeCounter = 0;
    let isFinished = false;
    let sentIntro = false;
    let inBytes = Buffer.alloc(0);

    authenticate(NOISE_HEADER);
    authenticate(publicKey);

    return {
        encrypt,
        decrypt,
        authenticate,
        mixIntoKey,
        finishInit,
        processHandshake: ({ serverHello }, noiseKey) => {
            authenticate(serverHello.ephemeral);
            mixIntoKey(crypto_1.Curve.sharedKey(privateKey, serverHello.ephemeral));
            const decStaticContent = decrypt(serverHello.static);
            mixIntoKey(crypto_1.Curve.sharedKey(privateKey, decStaticContent));
            const certDecoded = decrypt(serverHello.payload);

            if (mobile) {
                WAProto_1.proto.CertChain.NoiseCertificate.decode(certDecoded);
            } else {
                const { intermediate: certIntermediate } = WAProto_1.proto.CertChain.decode(certDecoded);
                const { issuerSerial } = WAProto_1.proto.CertChain.NoiseCertificate.Details.decode(certIntermediate.details);
                if (issuerSerial !== Defaults_1.WA_CERT_DETAILS.SERIAL) {
                    throw new boom_1.Boom('certification match failed', { statusCode: 400 });
                }
            }

            const keyEnc = encrypt(noiseKey.public);
            mixIntoKey(crypto_1.Curve.sharedKey(noiseKey.private, serverHello.ephemeral));
            return keyEnc;
        },
        encodeFrame: (data) => {
            const dataLen = data.length ?? data.byteLength;

            if (isFinished) {
                data = encrypt(data);
            }

            let header;
            if (routingInfo) {
                const routingLen = routingInfo.length ?? routingInfo.byteLength;
                header = Buffer.alloc(7);
                header.write('ED', 0, 'utf8');
                header.writeUInt8(0, 2);
                header.writeUInt8(1, 3);
                header.writeUInt8(routingLen >> 16, 4);
                header.writeUInt16BE(routingLen & 0xffff, 5);
                header = Buffer.concat([header, routingInfo, NOISE_HEADER]);
            } else {
                header = Buffer.from(NOISE_HEADER);
            }

            const introSize = sentIntro ? 0 : header.length;
            const frame = Buffer.alloc(introSize + 3 + dataLen);

            if (!sentIntro) {
                header.copy(frame, 0);
                sentIntro = true;
            }

            frame.writeUInt8((dataLen >> 16) & 0xff, introSize);
            frame.writeUInt16BE(dataLen & 0xffff, introSize + 1);
            data.copy(frame, introSize + 3);

            return frame;
        },
        decodeFrame: (newData, onFrame) => {
            var _a;

            const getBytesSize = () => {
                if (inBytes.length >= 3) {
                    return (inBytes.readUInt8(0) << 16) | inBytes.readUInt16BE(1);
                }
            };

            inBytes = Buffer.concat([inBytes, newData]);
            logger.trace(`recv ${newData.length} bytes, total recv ${inBytes.length} bytes`);

            let size = getBytesSize();
            while (size && inBytes.length >= size + 3) {
                let frame = inBytes.slice(3, size + 3);
                inBytes = inBytes.slice(size + 3);

                if (isFinished) {
                    const result = decrypt(frame);
                    frame = (0, WABinary_1.decodeBinaryNode)(result);
                }

                logger.trace({ msg: (_a = frame?.attrs)?.id }, 'recv frame');
                onFrame(frame);
                size = getBytesSize();
            }
        }
    };
};

exports.makeNoiseHandler = makeNoiseHandler;
