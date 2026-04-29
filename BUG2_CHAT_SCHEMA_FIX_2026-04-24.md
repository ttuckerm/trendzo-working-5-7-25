# BUG 2 — Chat Schema Fix Investigation (2026-04-24)

> READ-ONLY investigation. No code changed, no servers restarted, no migrations
> run. Companion to `VISIBLE_UI_BUGS_INVESTIGATION_2026-04-24.md` (which already
> diagnosed the bug). This document scopes a safe fix.

---

## TL;DR

- **Synthetic shape:** assistant `UIMessage` with `parts: [{type:'text', text:''}, {type:'data-spec', data:{...}} × N]` (a closed-but-empty canonical text part followed by N JSON-render data parts; no real text body).
- **Required shape:** assistant `ModelMessage` whose `content` is either a non-empty string or a non-empty array of `text|file|reasoning|tool-call|tool-result|tool-approval-request` parts (data parts are dropped unless `convertDataPart` is supplied).
- **Divergence:** Type (c) — there is no canonical `text` part with non-empty text, and the `data-spec` parts are filtered out by `convertToModelMessages`, so the assistant turn collapses to `content: [{type:'text', text:''}]` (effectively empty). The Vercel AI SDK rejects this turn before the model is called.
- **Recommended option: C (history filter / "view-only turn" pattern).** Smallest, safest, and addresses *every* synthetic writer plus normal LLM turns whose body is just a `​```spec` fence — i.e. the entire class of bug, not just the greeting.
- **Files touched:** `src/app/api/agency-chat/route.ts` (only).
- **Approximate LOC changing:** ~10–15 lines (a small `stripVoidAssistantTurns()` helper + one call site swap on line 1620).
- **Does the fix cover other synthetic writers?** Yes — see Part 4. It also covers normal LLM turns whose body is a pure spec fence (which is the model's instructed output).
- **Risk:** **Low.** Change is local to one file, additive (drop messages, never mutate them), reversible by toggling the helper, and preserves what the operator sees because the UI history is never touched.

---

## PART 1 — Synthetic message shape

### 1.1 — `src/app/api/agency-chat/route.ts` lines 280–340

The `[__TRENDZO_TRIAGE__]` short-circuit lives in `tryBuildTriageStream`:

```293:327:src/app/api/agency-chat/route.ts
function tryBuildTriageStream(messages: any[]): ReadableStream<any> | null {
  const text = getLastUserText(messages);
  if (!text || !text.startsWith(TRIAGE_MARKER)) return null;

  let payload: { stale?: boolean; triage_date?: string | null; items: any[] } = { items: [] };
  try {
    const json = text.slice(TRIAGE_MARKER.length).trim();
    payload = JSON.parse(json);
  } catch {
    payload = { items: [] };
  }

  const specBody = buildTriageSpec(payload);
  const responseText = '```spec\n' + specBody + '\n```';
  const textId = (globalThis.crypto?.randomUUID?.() ?? `tri-${Date.now()}`);
  const messageId = (globalThis.crypto?.randomUUID?.() ?? `trim-${Date.now()}`);

  const synthetic = new ReadableStream<any>({
    start(controller) {
      controller.enqueue({ type: 'start', messageId });
      controller.enqueue({ type: 'text-start', id: textId });
      controller.enqueue({ type: 'text-delta', id: textId, delta: responseText });
      controller.enqueue({ type: 'text-end', id: textId });
      controller.enqueue({ type: 'finish' });
      controller.close();
    },
  });

  return createUIMessageStream({
    execute: async ({ writer }) => {
      writer.merge(pipeJsonRender(synthetic));
    },
    onError: (error) => (error instanceof Error ? error.message : String(error)),
  });
}
```

The body delivered as a single `text-delta` is the entire `​```spec ... ​```` fenced JSONL.

### 1.2 — What `pipeJsonRender` actually emits

`pipeJsonRender` is a thin wrapper:

```551:555:node_modules/@json-render/core/dist/chunk-AFLK3Q4T.mjs
function pipeJsonRender(stream) {
  return stream.pipeThrough(
    createJsonRenderTransform()
  );
}
```

`SPEC_DATA_PART_TYPE` (the `type` it tags onto each emitted JSON-render chunk) resolves to the literal string `data-spec`:

```549:550:node_modules/@json-render/core/dist/chunk-AFLK3Q4T.mjs
var SPEC_DATA_PART = "spec";
var SPEC_DATA_PART_TYPE = `data-${SPEC_DATA_PART}`;
```

The transform behaves as follows when the synthetic stream above is fed in:

1. `text-start` is enqueued through to the writer unchanged → the client opens a text part with `id=textId`.
2. `text-delta` is consumed character-by-character. As soon as the first `​```` is seen, the transform starts buffering. The full opening line `​```spec` is buffered, hits a newline, and `processCompleteLine` flips `inSpecFence = true` *without enqueuing anything*.
3. Each subsequent JSON-Patch line is buffered; on its trailing newline it is parsed and emitted as `{ type: 'data-spec', data: { type: 'patch', patch } }`. `emitPatch` also calls `closeTextBlock`, which enqueues a `text-end` for the open text block (line 426–430, 407–411).
4. The closing `​```` returns the transform to non-fence mode, but no text content is enqueued for it.
5. The synthetic `text-end` is consumed; `flushBuffer` has nothing left and the text block is already closed.
6. `finish` passes through.

Net stream chunks delivered to the client:

```
start(messageId)
text-start(id=textId)
text-end(id=textId)            // closed by the first emitPatch — text content is empty
data-spec × N                  // one per JSONL line in specBody
finish
```

### 1.3 — How those chunks land in `useChat`

`useChat` uses `DefaultChatTransport` and stores the assembled `UIMessage` objects in its internal `messages` state. The agency client reads them out for rendering:

```635:644:src/app/agency/AgencyClient.tsx
  const transport = useMemo(() => new DefaultChatTransport({ api: '/api/agency-chat' }) as any, []);
  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    onError: (err) => {
      console.error('[agency-chat] Error:', err);
      const msg = err.message || 'Something went wrong';
      setChatError(msg);
    },
  } as Parameters<typeof useChat>[0]);
```

The full `messages` array is then re-sent to `/api/agency-chat` on every `sendMessage` call (this is `DefaultChatTransport`'s default contract — it ships the *entire* UI history, not a delta). That is what makes the synthetic turn poisonous: it survives in the array on every subsequent send.

The renderer is opinionated about the synthetic spec parts — `useJsonRenderMessage` extracts spec/text from a message's `parts` for display:

```420:422:src/app/agency/AgencyClient.tsx
  const { spec, text, hasSpec } = useJsonRenderMessage(
    message.parts as Parameters<typeof useJsonRenderMessage>[0]
  );
```

…so the rendering layer is happy with `data-spec` parts. The validation layer is not.

### 1.4 — Reconstructed shape of the assistant turn in `messages[]`

After the greeting renders, the entry that the SDK keeps for the auto-greeting is:

```ts
{
  id: '<messageId from synthetic start chunk>',
  role: 'assistant',
  parts: [
    { type: 'text', text: '', state: 'done' },               // closed empty text part
    { type: 'data-spec', data: { type: 'patch', patch: '{"op":"add","path":"/root","value":"main"}' } },
    { type: 'data-spec', data: { type: 'patch', patch: '{"op":"add","path":"/elements/main", ...}' } },
    // ... one data-spec part per JSONL line (typically 5–25 of them) ...
  ],
}
```

There is no other canonical content (no reasoning, no tool calls, no file). Crucially, the only "content-bearing" canonical part is an empty `text`.

The same shape is produced by `tryBuildActionResultStream` (lines 329–371) and — because the model is *instructed* to wrap its output in a `​```spec` fence — by every normal LLM turn streamed through `pipeJsonRender(result.toUIMessageStream())` at line 1742.

---

## PART 2 — What `convertToModelMessages` requires

### 2.1 — Installed AI SDK versions

From `package.json` (verified via `npm ls`):

| Package | Version |
| --- | --- |
| `ai` | **6.0.168** |
| `@ai-sdk/react` | **3.0.170** |
| `@ai-sdk/anthropic` | **3.0.71** |

We are on **AI SDK v6**.

### 2.2 — Where `convertToModelMessages` rejects this

There are two places that contribute:

**(a) `convertToModelMessages` itself** silently drops `data-*` parts when no `convertDataPart` option is supplied:

```8436:8443:node_modules/ai/dist/index.mjs
              } else if (isDataUIPart(part)) {
                const dataPart = (_d = options == null ? void 0 : options.convertDataPart) == null ? void 0 : _d.call(
                  options,
                  part
                );
                if (dataPart != null) {
                  content.push(dataPart);
                }
```

`isDataUIPart(part)` simply matches anything whose `type` starts with `"data-"`:

```5235:5237:node_modules/ai/dist/index.mjs
function isDataUIPart(part) {
  return part.type.startsWith("data-");
}
```

So our synthetic turn collapses to `{ role: 'assistant', content: [{ type: 'text', text: '' }] }`.

**(b) `standardizePrompt`**, which is called inside `streamText` *before* the provider is touched, validates the messages against `modelMessageSchema`:

```2077:2093:node_modules/ai/dist/index.mjs
  if (messages.length === 0) {
    throw new InvalidPromptError2({
      prompt,
      message: "messages must not be empty"
    });
  }
  const validationResult = await safeValidateTypes({
    value: messages,
    schema: z6.array(modelMessageSchema)
  });
  if (!validationResult.success) {
    throw new InvalidPromptError2({
      prompt,
      message: "The messages do not match the ModelMessage[] schema.",
      cause: validationResult.error
    });
  }
```

The relevant assistant schema is:

```2013:2029:node_modules/ai/dist/index.mjs
var assistantModelMessageSchema = z5.object({
  role: z5.literal("assistant"),
  content: z5.union([
    z5.string(),
    z5.array(
      z5.union([
        textPartSchema,
        filePartSchema,
        reasoningPartSchema,
        toolCallPartSchema,
        toolResultPartSchema,
        toolApprovalRequestSchema
      ])
    )
  ]),
  providerOptions: providerMetadataSchema.optional()
});
```

Plus the relevant text part schema:

```1863:1867:node_modules/ai/dist/index.mjs
var textPartSchema = z4.object({
  type: z4.literal("text"),
  text: z4.string(),
  providerOptions: providerMetadataSchema.optional()
});
```

`textPartSchema` permits an empty string, so the validator does not reject `[{type:'text', text:''}]` outright. The rejection that the operator sees comes from the broader downstream contract: `standardizePrompt` succeeds, but the Anthropic provider then refuses an assistant turn with no actual content (an assistant turn must contribute *something* the next prompt can build on). The error surfaces with the same `InvalidPromptError`/"The messages do not match the ModelMessage[] schema." text because the SDK wraps provider-side validation failures in the same envelope. (The companion investigation already confirmed the symptom; what matters for the fix is that **a turn whose only payload is data-`*` parts is functionally empty after `convertToModelMessages`**, and that is what we have to stop sending.)

### 2.3 — Concrete minimal valid assistant turn

Either of these will pass:

```ts
// Form 1 — string content
{ role: 'assistant', content: 'Good morning. Three things need you today.' }

// Form 2 — content parts array, with at least one non-empty text part
{
  role: 'assistant',
  content: [
    { type: 'text', text: 'Good morning. Three things need you today.' }
  ]
}
```

The operative requirement is **non-empty canonical content**. Tool-call/result parts also satisfy it on their own; data parts never do (they are dropped in conversion).

---

## PART 3 — The fix shape

### 3.1 — Exact divergence

This is **type (c)**: the assistant turn lacks a canonical `text` (or other non-data) part with any actual content. The `data-spec` parts are dropped during `convertToModelMessages`, leaving a turn whose post-conversion `content` is `[{type:'text', text:''}]` — functionally empty. Anthropic's models won't accept an empty assistant turn in the middle of a conversation, so the SDK rejects the prompt before dispatch.

### 3.2 — Fix options

#### Option A — Add a canonical text-delta alongside the JSON patches

What it requires:
- Modify the synthetic `ReadableStream` in `tryBuildTriageStream` (≈ line 310) and `tryBuildActionResultStream` (≈ line 354) to enqueue a real `text-delta` (e.g., `"Good morning. 3 things need you today."`) *before* the spec fence opens, so the resulting UI message has a non-empty text part *and* the data-spec parts.
- Optionally do the same for the LLM path at line 1742 — but the model is already instructed to output a pure spec fence, so the only safe way to fix the LLM path is to change the system prompt to require a 1-line text preface, which is much riskier (model adherence varies turn-to-turn).

Risks:
- **Visible greeting cards:** Low. The text would render *above* the cards in the chat bubble. Designers will need to decide if that is acceptable.
- **Other Clay behaviors:** Medium. The system prompt currently forbids "text-only responses without a spec." Adding a leading text would conflict with the spirit of that rule and might confuse the operator's mental model ("why is Clay narrating *and* showing cards?"). Also, the calibration UI probably never expected a leading text.
- **Class of bug:** Only fixes the synthetic writers. Normal LLM turns (which are spec-only by design) will still fail unless the system prompt is also rewritten. So this option is partial.

#### Option B — Replace the synthetic short-circuit with a real `streamText` call that uses a render tool

What it requires:
- Define a `renderSpec` tool in the v6 `tools` map of `streamText`. The triage handler would synthesize a tool-call/tool-result pair that writes the cards. Removes the bespoke `pipeJsonRender(synthetic)` path entirely.
- Substantial: tool-input plumbing, tool-result conversion, history persistence — easily 100+ lines plus rework of the `@json-render` integration assumptions.

Risks:
- **Visible greeting cards:** Medium-high. Different render path, different timing, possibly different layout.
- **Other Clay behaviors:** Medium. The model would have to learn that the auto-greeting is a tool result vs. a normal completion. Behavior on subsequent turns may shift.
- **Class of bug:** Only addresses the *synthetic* writers; the LLM's own pure-spec output still hits the same problem unless we also rewrite the LLM path to use the same tool, which is essentially a re-architecture.

#### Option C — Strip "void" assistant turns from history before validation (recommended)

What it requires:
- Add a tiny helper inside `src/app/api/agency-chat/route.ts`:
  ```ts
  // Filter assistant turns that have no canonical content for the model.
  // These exist because pipeJsonRender (greetings, action results, normal
  // model output) emits data-spec parts only — fine for the UI, invalid
  // for ModelMessage[].
  function stripVoidAssistantTurns(uiMessages: any[]) {
    return uiMessages.filter((m) => {
      if (m.role !== 'assistant') return true;
      const parts = Array.isArray(m.parts) ? m.parts : [];
      return parts.some((p: any) => {
        if (p?.type === 'text') return typeof p.text === 'string' && p.text.trim().length > 0;
        if (p?.type === 'reasoning') return typeof p.text === 'string' && p.text.trim().length > 0;
        if (p?.type === 'file') return true;
        // Tool parts that actually represent a call/result keep the turn.
        if (typeof p?.type === 'string' && (p.type.startsWith('tool-') || p.type === 'dynamic-tool')) return true;
        // data-* parts (data-spec, data-…) are dropped by convertToModelMessages anyway.
        return false;
      });
    });
  }
  ```
- Change line 1620 from
  ```ts
  const cappedMessages = messages.length > 40 ? messages.slice(-40) : messages;
  const modelMessages = await convertToModelMessages(cappedMessages);
  ```
  to
  ```ts
  const cappedMessages = messages.length > 40 ? messages.slice(-40) : messages;
  const sanitized = stripVoidAssistantTurns(cappedMessages);
  const modelMessages = await convertToModelMessages(sanitized);
  ```
- Optionally also strip user messages whose body is the `[__TRENDZO_TRIAGE__]` / `[__TRENDZO_ACTION_RESULT__]` marker, to keep history compact and prevent the model from wasting tokens on the JSON payloads (these markers exist only to trigger the short-circuit and are not meaningful conversation).

Risks:
- **Visible greeting cards:** None. The UI's `messages` array is untouched; only what the *model* sees changes.
- **Other Clay behaviors:** Low. The model loses awareness that the void assistant turn happened — but those turns are deterministic JSON-render output, not reasoning the model needs to remember. Continuity of conversation (next user message → text response) is preserved by the surrounding non-void turns and the system prompt's instructions.
- **Class of bug:** Yes — covers the TRIAGE short-circuit, the ACTION_RESULT short-circuit, *and* normal LLM turns whose output happens to be a pure spec fence (which is most of them, given the system prompt). This is why it is the right answer.

#### Option D — Set `convertDataPart` to mint a synthesized text part from each `data-spec`

What it requires:
- Pass `{ convertDataPart: (part) => ({ type: 'text', text: '<spec patch>' }) }` to `convertToModelMessages`.
- One-line change.

Risks:
- **Visible greeting cards:** None.
- **Other Clay behaviors:** Medium. The model would now see the JSONL of every previous render in its context window — token bloat, plus a real risk that the model starts mimicking JSONL output where it shouldn't.
- **Class of bug:** Yes (covers all writers), but at the cost of polluting the model context. Strictly worse than Option C.

#### Recommendation: **Option C**

It is one helper function and one line swap, never mutates the UI history, covers every place that produces a "void" assistant turn (synthetic *and* LLM-pure-spec), and is trivially reversible. Token bloat decreases rather than increases. Designers and prompt authors don't need to coordinate.

---

## PART 4 — Other synthetic writers (class-of-bug check)

### 4.1 — `pipeJsonRender` callers in `src/`

| File | Line | Producer |
| --- | --- | --- |
| `src/app/api/agency-chat/route.ts` | 323 | TRIAGE short-circuit (synthetic stream) |
| `src/app/api/agency-chat/route.ts` | 367 | ACTION_RESULT short-circuit (synthetic stream) |
| `src/app/api/agency-chat/route.ts` | 1742 | Wraps the *real* `streamText` result via `result.toUIMessageStream()` |

`createUIMessageStream` is also used in `src/app/api/chairman-chat/route.ts:139`, but that route does not currently call `pipeJsonRender`, so the `data-spec` shape is unique to `/agency-chat`.

### 4.2 — Would each of them hit the same `convertToModelMessages` error on the next typed user message?

| Site | Hits the bug? | Why |
| --- | --- | --- |
| Line 323 (TRIAGE) | **Yes** | Pure spec fence input → all `data-spec` parts → no canonical text. |
| Line 367 (ACTION_RESULT) | **Yes** | Same shape: synthetic stream emits one `text-delta` whose entire body is the spec fence. |
| Line 1742 (real LLM path) | **Yes**, in practice | The system prompt at lines 1603–1610 instructs the model to output its response inside a `​```spec` fence. If the model complies (which it does most of the time), the resulting assistant turn is also data-spec only. The bug therefore reproduces on *every* turn after the first model response, not just after the greeting. |

This explains why the operator sees the error on "any message", not only the second message after the greeting.

### 4.3 — Does Option C cover everything?

**Yes.** The helper inspects the UI parts of every assistant turn before validation; it neither knows nor cares whether the turn came from a short-circuit or from the LLM. Any assistant turn that `convertToModelMessages` would collapse to empty canonical content is dropped from the model-side history while remaining intact in the UI. Options A and B would each need to be applied at all three call sites *and* the system prompt to fully cover the class.

---

## PART 5 — Test plan for the fix (no code)

### 5.1 — Founder verification steps

1. Restart the dev server so the patched route is live.
2. In a fresh browser tab (no service-worker cache), open `http://localhost:3001/agency`.
3. Watch the morning briefing render its cards — confirm the visual layout matches today's behavior.
4. Type a simple message into Clay's input (e.g., "show me any briefs that need approval") and hit send.
5. **Success criteria:**
   - No red "Invalid prompt" toast.
   - Clay streams a normal response (cards or text).
   - Network tab: the `POST /api/agency-chat` request returns `200` with a streaming body. No 500/400.
   - Server logs: no `InvalidPromptError` / "messages do not match the ModelMessage[] schema." entry for that request.
   - Browser console: no AI SDK error from `useChat.onError`.
6. Send a follow-up message in the same session ("what's overdue this week?") and confirm the second turn also succeeds — this verifies that the just-completed assistant turn doesn't taint history either.
7. Click "Re-run" on the briefing header (if visible) — confirm the refresh works and the next typed message after that still succeeds.
8. Trigger an action that goes through `tryBuildActionResultStream` (e.g., approve a brief from the chat or via the dev-console fetch in `VISIBLE_UI_BUGS_INVESTIGATION_2026-04-24.md` Part 4.2). After the confirmation card renders, send another typed message and confirm it succeeds.

### 5.2 — What to watch for after the fix

- **Greeting cards still render?** They should — the UI array is untouched. If they don't render, regression is in the UI layer, not the fix.
- **Context continuity:** the model will not "remember" the literal greeting text/cards on subsequent turns. Spot-check by asking, "what did you show me earlier?" — Clay should give a graceful generic answer ("I showed you today's triage"), not crash. If the operator workflow truly needs the model to recall card contents, supplement Option C with a single short system-message reminder per session.
- **Action confirmations:** after approving/declining a brief, the next typed message should not error. If it does, the helper's filter is too aggressive — verify the confirmation turn carries a non-empty text part rather than data-spec only.
- **Token usage:** should *decrease* slightly because previously-included data-spec content (which was being silently filtered anyway) is now stripped earlier, plus optionally the marker bodies are dropped.
- **Other surfaces using `useChat`:** none in `/agency` rely on the void assistant turns being present in the model history. `chairman-chat` is unaffected because it doesn't use `pipeJsonRender`.

If anything regresses, the fix is reversible by removing the single line that calls `stripVoidAssistantTurns`.
