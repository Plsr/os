/**
 * Core type definitions for the application system
 */

import type { ComponentType } from "react";

/**
 * Window configuration for an application
 */
export interface WindowConfig {
  defaultSize: { width: number; height: number };
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
  resizable?: boolean;
}

/**
 * Application lifecycle hooks
 * All hooks are optional and called at key moments in the app lifecycle
 */
export interface AppLifecycle {
  /**
   * Called before the window closes
   * Return false to prevent the window from closing
   */
  onBeforeClose?: (
    instanceId: string,
    context: AppContext
  ) => boolean | Promise<boolean>;

  /**
   * Called when the app instance is mounted
   */
  onMount?: (instanceId: string, context: AppContext) => void;

  /**
   * Called when the app instance is unmounted
   */
  onUnmount?: (instanceId: string, context: AppContext) => void;
}

/**
 * Props passed to every application component
 */
export interface AppProps {
  /** Unique ID for this specific instance of the app */
  instanceId: string;

  /** ID of the window containing this app */
  windowId: string;

  /** OS context/API for interacting with the system */
  context: AppContext;

  /** Optional data passed when the app was opened */
  initialData?: unknown;
}

/**
 * Complete application definition
 * This defines everything about an application
 */
export interface AppDefinition {
  /** Unique identifier for this application */
  id: string;

  /** Display name of the application */
  name: string;

  /** Icon for the application (emoji or path) */
  icon: string;

  /** Window configuration */
  window: WindowConfig;

  /** The React component that renders this app's UI */
  component: ComponentType<AppProps>;

  /** Optional lifecycle hooks */
  lifecycle?: AppLifecycle;
}

/**
 * OS Context (Application API)
 * This is the interface apps use to interact with the operating system
 */
export interface AppContext {
  // App management
  /**
   * Open an application
   * @param appId - The ID of the app to open
   * @param data - Optional data to pass to the app
   * @returns The instance ID of the opened app
   */
  openApp: (appId: string, data?: unknown) => string;

  /**
   * Close an application instance
   * @param instanceId - The instance ID to close
   */
  closeApp: (instanceId: string) => void;

  // Inter-app communication
  /**
   * Emit an event to the event bus
   * @param event - The event name
   * @param data - The event data
   */
  emit: (event: string, data: unknown) => void;

  /**
   * Subscribe to an event on the event bus
   * @param event - The event name to listen for
   * @param handler - The handler function to call when the event is emitted
   * @returns A function to unsubscribe from the event
   */
  on: (event: string, handler: (data: unknown) => void) => () => void;

  // Window management
  /**
   * Focus a specific window
   * @param windowId - The window ID to focus
   */
  focusWindow: (windowId: string) => void;

  // Future: file system, notifications, etc.
}

/**
 * Internal representation of a running app instance
 * This is used internally by the OS to track running applications
 */
export interface AppInstance {
  /** Unique instance ID */
  instanceId: string;

  /** ID of the app this is an instance of */
  appId: string;

  /** ID of the window containing this instance */
  windowId: string;

  /** Optional data passed when the app was opened */
  data?: unknown;
}

