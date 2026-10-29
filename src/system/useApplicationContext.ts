/**
 * Application Context hooks
 * Kept apart from the provider so ApplicationContext.tsx only exports a component
 */

import { createContext, useContext } from "react";
import type { AppContext, AppInstance, AppDefinition } from "./types";

/**
 * Extended context that includes instance management
 * This is internal to the ApplicationContext
 */
export interface ApplicationContextValue extends AppContext {
  instances: Map<string, AppInstance>;
  registerInstance: (instance: AppInstance) => void;
  unregisterInstance: (instanceId: string) => void;
  getAppDefinition: (appId: string) => AppDefinition | undefined;
}

// Create the context with undefined default (will be provided by provider)
export const ApplicationContext = createContext<
  ApplicationContextValue | undefined
>(undefined);

/**
 * Hook to access the application context
 * For system components only. Apps receive the context through AppProps
 */
export function useApplicationContext(): AppContext {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error(
      "useApplicationContext must be used within an ApplicationProvider"
    );
  }

  // Return only the public API, not the internal methods
  return {
    openApp: context.openApp,
    closeApp: context.closeApp,
    emit: context.emit,
    on: context.on,
    focusWindow: context.focusWindow,
  };
}

/**
 * Hook to access the full internal context (for system components)
 * This includes instance management methods
 */
export function useApplicationContextInternal(): ApplicationContextValue {
  const context = useContext(ApplicationContext);
  if (!context) {
    throw new Error(
      "useApplicationContextInternal must be used within an ApplicationProvider"
    );
  }
  return context;
}
