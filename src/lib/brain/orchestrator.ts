import { providers } from "./providers";

export async function orchestrate(input: OrchestrateInput) {
  if (!process.env.FF_INTEL_ORCHESTRATOR || providers.length < 2) {
    return singleProviderCall(input, providers[0]); // fallback
  }
  // fan-out then aggregate
  const traceId = crypto.randomUUID();
  const results = await Promise.allSettled(
    providers.map(p => callProvider(p, input, traceId))
  );
  return aggregate(results, traceId);
}
