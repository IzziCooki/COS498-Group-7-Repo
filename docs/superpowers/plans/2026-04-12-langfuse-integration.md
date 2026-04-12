# Langfuse Observability Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Langfuse tracing to all Claude API calls so every agent turn, tool execution, and classification call is visible in the Langfuse dashboard with token usage, latency, and metadata.

**Architecture:** Initialize OpenTelemetry with the Langfuse span processor at server startup (before any other imports). Wrap each Claude `messages.create()` call and each tool execution in `startActiveObservation()` spans. The outer trace covers the full agent turn; nested spans cover individual LLM calls and tool invocations. Gracefully degrade when Langfuse keys are absent (no tracing, no errors).

**Tech Stack:** `@langfuse/tracing`, `@langfuse/otel`, `@opentelemetry/sdk-node`, existing Node.js/Express/Anthropic SDK stack.

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `server/core/langfuseInit.js` | Initialize OTel SDK with Langfuse span processor; export `sdk` for shutdown |
| Modify | `server/config.js` | Add `langfuseSecretKey`, `langfusePublicKey`, `langfuseBaseUrl` from env |
| Modify | `server/index.js:1` | Import `langfuseInit` as very first line; add `sdk.shutdown()` to SIGTERM handler |
| Modify | `server/core/agentOrchestrator.js:1,441-477` | Import `startActiveObservation`; wrap Claude calls and tool executions in spans |
| Modify | `server/core/taskClassifier.js:1,41-47` | Import `startActiveObservation`; wrap classification call in a span |
| Modify | `.env.example` | Add `LANGFUSE_SECRET_KEY`, `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_BASE_URL` |

---

### Task 1: Install dependencies and update config

**Files:**
- Modify: `package.json` (npm install handles this)
- Modify: `server/config.js:1-10`
- Modify: `.env.example:1-4`

- [ ] **Step 1: Install Langfuse and OTel packages**

Run:
```bash
npm install @langfuse/tracing @langfuse/otel @opentelemetry/sdk-node
```

Expected: packages added to `package.json` dependencies, `node_modules` updated, no errors.

- [ ] **Step 2: Add Langfuse env vars to config.js**

In `server/config.js`, add the three Langfuse keys to the config object:

```js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const config = {
  port: process.env.PORT || 3001,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  langfuseSecretKey: process.env.LANGFUSE_SECRET_KEY || '',
  langfusePublicKey: process.env.LANGFUSE_PUBLIC_KEY || '',
  langfuseBaseUrl: process.env.LANGFUSE_BASE_URL || 'https://us.cloud.langfuse.com',
};

module.exports = config;
```

- [ ] **Step 3: Update .env.example with Langfuse placeholders**

```
ANTHROPIC_API_KEY=your_api_key_here
GEMINI_API_KEY=your_api_key_here
MOCK_MODE=true
PORT=3001
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json server/config.js .env.example
git commit -m "feat: add langfuse dependencies and config"
```

---

### Task 2: Create langfuseInit.js and wire it into server startup

**Files:**
- Create: `server/core/langfuseInit.js`
- Modify: `server/index.js:1,125-127`

- [ ] **Step 1: Create server/core/langfuseInit.js**

```js
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
```

- [ ] **Step 2: Import langfuseInit as the very first line in server/index.js**

Add this as line 1 of `server/index.js`, before all other imports:

```js
const { sdk: langfuseSdk } = require('./core/langfuseInit');
```

The full top of the file becomes:

```js
const { sdk: langfuseSdk } = require('./core/langfuseInit');
const http = require('http');
const path = require('path');
const express = require('express');
// ... rest unchanged
```

- [ ] **Step 3: Add graceful Langfuse shutdown to SIGTERM handler**

Replace the existing SIGTERM handler in `server/index.js` (line 125-127):

```js
process.on('SIGTERM', () => {
  const shutdown = langfuseSdk ? langfuseSdk.shutdown() : Promise.resolve();
  shutdown.finally(() => {
    wss.close(() => { server.close(() => process.exit(0)); });
  });
});
```

- [ ] **Step 4: Verify existing tests still pass**

Run:
```bash
npm test
```

Expected: All existing tests pass. The langfuseInit module is not loaded during tests (tests mock their own dependencies), so no interference.

- [ ] **Step 5: Commit**

```bash
git add server/core/langfuseInit.js server/index.js
git commit -m "feat: initialize langfuse tracing at server startup"
```

---

### Task 3: Instrument agentOrchestrator.js with Langfuse tracing

**Files:**
- Modify: `server/core/agentOrchestrator.js:1,441-487`

This is the largest change. We wrap three things:
1. The entire agent turn in a top-level trace (`pc-pal-agent-turn`)
2. Each `client.messages.create()` call in a `claude-chat` span
3. Each tool execution in a `tool-<name>` span

- [ ] **Step 1: Add the langfuse tracing import at the top of agentOrchestrator.js**

Add after the existing imports (after line 13):

```js
let startActiveObservation;
try {
  startActiveObservation = require('@langfuse/tracing').startActiveObservation;
} catch {
  // Langfuse not available — use passthrough
  startActiveObservation = async (_name, fn) => fn({ update: () => {} });
}
```

This gracefully falls back to a no-op if the package isn't installed or OTel isn't initialized.

- [ ] **Step 2: Replace the Claude API call block (lines 441-487) with traced version**

Replace the try block inside `processMessage` that starts with `let response = await client.messages.create(...)` and ends before `// Step 8: Filter response`. The full replacement:

```js
    try {
      await startActiveObservation('pc-pal-agent-turn', async (trace) => {
        trace.update({
          input: text,
          metadata: { userId, sessionId, taskType: classification?.taskType, topic: classification?.topic },
        });

        let response = await startActiveObservation('claude-chat', async (span) => {
          span.update({
            input: JSON.stringify(messages.slice(-2)),
            metadata: { model: CLAUDE_MODEL, round: 0 },
          });

          const res = await client.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 1024,
            system: systemPrompt,
            messages,
            tools,
          });

          span.update({
            output: JSON.stringify(res.content),
            usage: {
              input_tokens: res.usage?.input_tokens,
              output_tokens: res.usage?.output_tokens,
            },
          });

          return res;
        });

        let toolRounds = 0;
        while (hasToolUse(response.content) && toolRounds < MAX_TOOL_ROUNDS) {
          toolRounds += 1;

          const toolResults = [];
          for (const block of response.content) {
            if (block.type !== 'tool_use') continue;

            await startActiveObservation(`tool-${block.name}`, async (toolSpan) => {
              toolSpan.update({ input: JSON.stringify(block.input) });

              const { result: fcResult, safetyAlert: alert, guideId: fcGuideId, stepSequence: fcStep } =
                handleFunctionCall(block.name, block.input, userId, sessionId);

              if (alert) safetyAlert = alert;
              if (fcGuideId) guideId = fcGuideId;
              if (fcStep) stepSequence = fcStep;

              toolSpan.update({ output: fcResult });
              toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: fcResult });
            });
          }

          messages.push({ role: 'assistant', content: response.content });
          messages.push({ role: 'user', content: toolResults });

          response = await startActiveObservation('claude-chat', async (span) => {
            span.update({
              metadata: { model: CLAUDE_MODEL, round: toolRounds },
            });

            const res = await client.messages.create({
              model: CLAUDE_MODEL,
              max_tokens: 1024,
              system: systemPrompt,
              messages,
              tools,
            });

            span.update({
              output: JSON.stringify(res.content),
              usage: {
                input_tokens: res.usage?.input_tokens,
                output_tokens: res.usage?.output_tokens,
              },
            });

            return res;
          });
        }

        if (toolRounds >= MAX_TOOL_ROUNDS) {
          console.error(`[agentOrchestrator] Tool loop hit max (${MAX_TOOL_ROUNDS}) for user ${userId}`);
        }

        finalTextResponse = extractTextFromContent(response.content);

        trace.update({
          output: finalTextResponse,
          metadata: { toolRounds },
        });
      });
    } catch (err) {
      console.error('[agentOrchestrator] Claude API error:', err.message);
      return { response: FALLBACK_RESPONSE, safetyAlert: null, guideId: null, stepSequence: null };
    }
```

- [ ] **Step 3: Verify existing tests still pass**

Run:
```bash
npm test
```

Expected: All tests pass. The `startActiveObservation` import has a try/catch fallback, so even if `@langfuse/tracing` isn't available during tests, the passthrough no-op kicks in.

- [ ] **Step 4: Commit**

```bash
git add server/core/agentOrchestrator.js
git commit -m "feat: add langfuse tracing to agent orchestrator"
```

---

### Task 4: Instrument taskClassifier.js with Langfuse tracing

**Files:**
- Modify: `server/core/taskClassifier.js:1,40-48`

- [ ] **Step 1: Add the langfuse tracing import at the top of taskClassifier.js**

Add after the existing imports (after line 8):

```js
let startActiveObservation;
try {
  startActiveObservation = require('@langfuse/tracing').startActiveObservation;
} catch {
  startActiveObservation = async (_name, fn) => fn({ update: () => {} });
}
```

- [ ] **Step 2: Wrap the Claude API call in a trace span**

Replace the try block inside `classifyMessage` (lines 40-67) with:

```js
  try {
    return await startActiveObservation('task-classification', async (span) => {
      span.update({
        input: text,
        metadata: { model: CLAUDE_MODEL, profileSummary },
      });

      const response = await client.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      });

      const rawText = response.content[0]?.text?.trim() || '';
      const jsonText = rawText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(jsonText);
      } catch (parseErr) {
        console.error('[taskClassifier] Failed to parse Claude response:', rawText);
        span.update({ output: 'parse_error', metadata: { rawText } });
        return { taskType: 'unknown', topic: 'unclassified', urgency: 'low' };
      }

      const taskType = VALID_TASK_TYPES.includes(parsed.taskType) ? parsed.taskType : 'unknown';
      const topic = typeof parsed.topic === 'string' ? parsed.topic.slice(0, 100) : 'unclassified';
      const urgency = VALID_URGENCY.includes(parsed.urgency) ? parsed.urgency : 'low';

      span.update({
        output: JSON.stringify({ taskType, topic, urgency }),
        usage: {
          input_tokens: response.usage?.input_tokens,
          output_tokens: response.usage?.output_tokens,
        },
      });

      return { taskType, topic, urgency };
    });
  } catch (err) {
    console.error('[taskClassifier] Claude API error:', err.message);
    return { taskType: 'unknown', topic: 'unclassified', urgency: 'low' };
  }
```

- [ ] **Step 3: Run all tests**

Run:
```bash
npm test
```

Expected: All 30+ existing tests pass unchanged. The `startActiveObservation` wrapper is transparent — it calls the callback and returns its result.

- [ ] **Step 4: Commit**

```bash
git add server/core/taskClassifier.js
git commit -m "feat: add langfuse tracing to task classifier"
```

---

### Task 5: End-to-end verification

- [ ] **Step 1: Run the full test suite one final time**

Run:
```bash
npm test
```

Expected: All tests pass.

- [ ] **Step 2: Start the dev server and verify no startup errors**

Run:
```bash
npm run dev:server
```

Expected output includes:
```
[langfuse] LANGFUSE keys not set — tracing disabled
PC Pal server listening on port 3001
```

(The "tracing disabled" message is expected until real keys are added to `.env`.)

Verify the server still responds:
```bash
curl http://localhost:3001/api/health
```

Expected: `{"status":"ok","message":"PC Pal server running"}`

- [ ] **Step 3: Commit final state (if any cleanup needed)**

```bash
git add -A
git commit -m "feat: langfuse observability integration complete"
```

---

## Post-Integration: Activating Langfuse

Once keys are added to `.env`, every Claude API call will appear in the Langfuse dashboard under **Traces**. Each trace shows:

- **pc-pal-agent-turn** (top level) — full user interaction
  - **task-classification** — the classifier call with parsed result
  - **claude-chat** (round 0) — first LLM call
  - **tool-\*** — each tool execution (e.g., `tool-show_visual_guide`)
  - **claude-chat** (round 1..N) — follow-up LLM calls after tool results

Filter by `metadata.userId`, `metadata.taskType`, or time range in the Langfuse Metrics tab.
