/**
 * Application Context Provider
 * Provides the OS API to all applications and manages app instances
 */

import {
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { AppInstance, AppDefinition } from "./types";
import { eventBus } from "./EventBus";
import {
  ApplicationContext,
  type ApplicationContextValue,
} from "./useApplicationContext";

/**
 * Props for the ApplicationProvider
 */
interface ApplicationProviderProps {
  children: ReactNode;
  /**
   * Registry of available applications
   * Maps app ID to app definition
   */
  appRegistry: Map<string, AppDefinition>;
  /**
   * Callback when a window should be focused
   */
  onFocusWindow?: (windowId: string) => void;
  /**
   * Callback when an app should be opened
   * Returns the window ID that was created
   */
  onOpenWindow?: (appId: string, instanceId: string, data?: unknown) => string;
  /**
   * Callback when a window should be closed
   */
  onCloseWindow?: (windowId: string) => void;
}

/**
 * Application Provider Component
 * Wrap your app with this to provide the OS API to all applications
 */
export function ApplicationProvider({
  children,
  appRegistry,
  onFocusWindow,
  onOpenWindow,
  onCloseWindow,
}: ApplicationProviderProps) {
  // Map of instanceId -> AppInstance
  const [instances, setInstances] = useState<Map<string, AppInstance>>(
    new Map()
  );

  /**
   * Get an app definition from the registry
   */
  const getAppDefinition = useCallback(
    (appId: string): AppDefinition | undefined => {
      return appRegistry.get(appId);
    },
    [appRegistry]
  );

  /**
   * Register a new app instance
   */
  const registerInstance = useCallback((instance: AppInstance) => {
    setInstances((prev) => {
      const next = new Map(prev);
      next.set(instance.instanceId, instance);
      return next;
    });
  }, []);

  /**
   * Unregister an app instance
   */
  const unregisterInstance = useCallback((instanceId: string) => {
    setInstances((prev) => {
      const next = new Map(prev);
      next.delete(instanceId);
      return next;
    });
  }, []);

  /**
   * Open an application
   */
  const openApp = useCallback(
    (appId: string, data?: unknown): string => {
      const appDef = getAppDefinition(appId);
      if (!appDef) {
        throw new Error(`App with id "${appId}" not found in registry`);
      }

      // Generate unique instance ID
      const instanceId = `${appId}-${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}`;

      // Let the parent create the window and get back the window ID
      const windowId = onOpenWindow
        ? onOpenWindow(appId, instanceId, data)
        : `window-${instanceId}`;

      // Create and register the instance
      const instance: AppInstance = {
        instanceId,
        appId,
        windowId,
        data,
      };

      registerInstance(instance);

      return instanceId;
    },
    [getAppDefinition, onOpenWindow, registerInstance]
  );

  /**
   * Close an application instance
   */
  const closeApp = useCallback(
    (instanceId: string) => {
      const instance = instances.get(instanceId);
      if (!instance) {
        console.warn(`Instance "${instanceId}" not found`);
        return;
      }

      // Notify parent to close the window
      if (onCloseWindow) {
        onCloseWindow(instance.windowId);
      }

      // Unregister the instance
      unregisterInstance(instanceId);
    },
    [instances, onCloseWindow, unregisterInstance]
  );

  /**
   * Emit an event on the event bus
   */
  const emit = useCallback((event: string, data: unknown) => {
    eventBus.emit(event, data);
  }, []);

  /**
   * Subscribe to an event on the event bus
   */
  const on = useCallback((event: string, handler: (data: unknown) => void) => {
    return eventBus.on(event, handler);
  }, []);

  /**
   * Focus a window
   */
  const focusWindow = useCallback(
    (windowId: string) => {
      if (onFocusWindow) {
        onFocusWindow(windowId);
      }
    },
    [onFocusWindow]
  );

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo<ApplicationContextValue>(
    () => ({
      instances,
      registerInstance,
      unregisterInstance,
      getAppDefinition,
      openApp,
      closeApp,
      emit,
      on,
      focusWindow,
    }),
    [
      instances,
      registerInstance,
      unregisterInstance,
      getAppDefinition,
      openApp,
      closeApp,
      emit,
      on,
      focusWindow,
    ]
  );

  return (
    <ApplicationContext.Provider value={contextValue}>
      {children}
    </ApplicationContext.Provider>
  );
}
