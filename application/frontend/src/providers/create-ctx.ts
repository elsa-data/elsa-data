import React, { Provider } from "react";

/**
 * A neat function for creating providers that makes the downstream users not have to deal with
 * 'undefined' content.
 */
export function createCtx<ContextType>(): readonly [
  () => ContextType,
  Provider<ContextType | undefined>,
] {
  const ctx = React.createContext<ContextType | undefined>(undefined);
  function useCtx() {
    const c = React.useContext(ctx);
    if (typeof c === "undefined")
      throw new Error("useCtx must be inside a Provider with a value");
    return c;
  }
  return [useCtx, ctx.Provider] as const;
}
