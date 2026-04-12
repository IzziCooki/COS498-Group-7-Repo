const { NodeSDK } = require('@opentelemetry/sdk-node');
const { LangfuseSpanProcessor } = require('@langfuse/otel');
const { langfuseSecretKey, langfusePublicKey, langfuseBaseUrl } = require('../config');

let sdk = null;

if (langfuseSecretKey && langfusePublicKey) {
  sdk = new NodeSDK({
    spanProcessors: [
      new LangfuseSpanProcessor({
        secretKey: langfuseSecretKey,
        publicKey: langfusePublicKey,
        baseUrl: langfuseBaseUrl,
      }),
    ],
  });
  sdk.start();
  console.log('[langfuse] Tracing initialized');
} else {
  console.warn('[langfuse] LANGFUSE keys not set — tracing disabled');
}

module.exports = { sdk };
