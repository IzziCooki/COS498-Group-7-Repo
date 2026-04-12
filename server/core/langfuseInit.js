const { NodeSDK } = require('@opentelemetry/sdk-node');
const { LangfuseSpanProcessor } = require('@langfuse/otel');
const { langfuseSecretKey, langfusePublicKey, langfuseBaseUrl } = require('../config');

let sdk = null;
let spanProcessor = null;

if (langfuseSecretKey && langfusePublicKey) {
  spanProcessor = new LangfuseSpanProcessor({
    secretKey: langfuseSecretKey,
    publicKey: langfusePublicKey,
    baseUrl: langfuseBaseUrl,
  });
  sdk = new NodeSDK({
    spanProcessors: [spanProcessor],
  });
  sdk.start();
  console.log('[langfuse] Tracing initialized');
} else {
  console.warn('[langfuse] LANGFUSE keys not set — tracing disabled');
}

async function flushTraces() {
  if (spanProcessor) {
    await spanProcessor.forceFlush();
  }
}

module.exports = { sdk, flushTraces };
