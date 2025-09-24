"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SenderKeyState = void 0;

const sender_chain_key_1 = require("./sender-chain-key");
const sender_message_key_1 = require("./sender-message-key");

class SenderKeyState {
    constructor(
        id,
        iteration,
        chainKey,
        signatureKeyPair,
        signatureKeyPublic,
        signatureKeyPrivate,
        senderKeyStateStructure
    ) {
        this.MAX_MESSAGE_KEYS = 2000;

        if (senderKeyStateStructure) {
            // pastikan setiap field ada
            this.senderKeyStateStructure = {
                senderKeyId: senderKeyStateStructure.senderKeyId || id || 0,
                senderChainKey: senderKeyStateStructure.senderChainKey || {
                    iteration: iteration || 0,
                    seed: chainKey || Buffer.alloc(0)
                },
                senderSigningKey: senderKeyStateStructure.senderSigningKey || {
                    public: signatureKeyPublic || Buffer.alloc(0),
                    private: signatureKeyPrivate || undefined
                },
                senderMessageKeys: senderKeyStateStructure.senderMessageKeys || []
            };
        } else {
            if (signatureKeyPair) {
                signatureKeyPublic = signatureKeyPair.public;
                signatureKeyPrivate = signatureKeyPair.private;
            }

            chainKey =
                typeof chainKey === "string"
                    ? Buffer.from(chainKey, "base64")
                    : chainKey;

            const senderChainKeyStructure = {
                iteration: iteration || 0,
                seed: chainKey || Buffer.alloc(0)
            };

            const signingKeyStructure = {
                public:
                    typeof signatureKeyPublic === "string"
                        ? Buffer.from(signatureKeyPublic, "base64")
                        : signatureKeyPublic || Buffer.alloc(0)
            };

            if (signatureKeyPrivate) {
                signingKeyStructure.private =
                    typeof signatureKeyPrivate === "string"
                        ? Buffer.from(signatureKeyPrivate, "base64")
                        : signatureKeyPrivate;
            }

            this.senderKeyStateStructure = {
                senderKeyId: id || 0,
                senderChainKey: senderChainKeyStructure,
                senderSigningKey: signingKeyStructure,
                senderMessageKeys: []
            };
        }
    }

    getKeyId() {
        return this.senderKeyStateStructure.senderKeyId;
    }

    getSenderChainKey() {
        const chainKey = this.senderKeyStateStructure.senderChainKey || {
            iteration: 0,
            seed: Buffer.alloc(0)
        };
        return new sender_chain_key_1.SenderChainKey(
            chainKey.iteration,
            chainKey.seed
        );
    }

    setSenderChainKey(chainKey) {
        this.senderKeyStateStructure.senderChainKey = {
            iteration: chainKey.getIteration(),
            seed: chainKey.getSeed()
        };
    }

    getSigningKeyPublic() {
        const signingKey =
            this.senderKeyStateStructure.senderSigningKey || {};
        const publicKey = signingKey.public;

        if (publicKey instanceof Buffer) return publicKey;
        if (typeof publicKey === "string") return Buffer.from(publicKey, "base64");
        return Buffer.from(publicKey || []);
    }

    getSigningKeyPrivate() {
        const signingKey =
            this.senderKeyStateStructure.senderSigningKey || {};
        const privateKey = signingKey.private;

        if (!privateKey) return undefined;
        if (privateKey instanceof Buffer) return privateKey;
        if (typeof privateKey === "string")
            return Buffer.from(privateKey, "base64");
        return Buffer.from(privateKey || []);
    }

    hasSenderMessageKey(iteration) {
        if (!Array.isArray(this.senderKeyStateStructure.senderMessageKeys)) {
            return false;
        }
        return this.senderKeyStateStructure.senderMessageKeys.some(
            (key) => key.iteration === iteration
        );
    }

    addSenderMessageKey(senderMessageKey) {
        if (!Array.isArray(this.senderKeyStateStructure.senderMessageKeys)) {
            this.senderKeyStateStructure.senderMessageKeys = [];
        }

        this.senderKeyStateStructure.senderMessageKeys.push({
            iteration: senderMessageKey.getIteration(),
            seed: senderMessageKey.getSeed()
        });

        if (
            this.senderKeyStateStructure.senderMessageKeys.length >
            this.MAX_MESSAGE_KEYS
        ) {
            this.senderKeyStateStructure.senderMessageKeys.shift();
        }
    }

    removeSenderMessageKey(iteration) {
        if (!Array.isArray(this.senderKeyStateStructure.senderMessageKeys)) {
            return null;
        }

        const index =
            this.senderKeyStateStructure.senderMessageKeys.findIndex(
                (key) => key.iteration === iteration
            );

        if (index !== -1) {
            const messageKey =
                this.senderKeyStateStructure.senderMessageKeys[index];
            this.senderKeyStateStructure.senderMessageKeys.splice(index, 1);
            return new sender_message_key_1.SenderMessageKey(
                messageKey.iteration,
                messageKey.seed
            );
        }

        return null;
    }

    getStructure() {
        return this.senderKeyStateStructure;
    }
}

exports.SenderKeyState = SenderKeyState;
