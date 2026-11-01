import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * false during server rendering and while this component hydrates, true afterwards.
 * Components inside a <Suspense> boundary may hydrate after auth state is already
 * known on the client — gating on this keeps the first client render identical to
 * the server HTML (no hydration mismatch).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
