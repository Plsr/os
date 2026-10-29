/**
 * System module exports
 * Central export point for all system-level functionality
 */

// Type definitions
export type {
  AppDefinition,
  AppInstance,
  AppContext,
  AppProps,
  WindowConfig,
  AppLifecycle,
} from "./types";

// Application Context
export { ApplicationProvider } from "./ApplicationContext";
export {
  useApplicationContext,
  useApplicationContextInternal,
} from "./useApplicationContext";

// Event Bus
export { EventBus, eventBus } from "./EventBus";
