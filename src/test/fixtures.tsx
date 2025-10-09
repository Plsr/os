/**
 * Test fixtures for application system
 * These provide reusable test data for various components
 */

import type { AppDefinition, AppInstance } from "@/system/types";

/**
 * Mock app component for testing
 */
function MockAppComponent() {
  return <div data-testid="mock-app">Mock App Content</div>;
}

/**
 * Mock app definition fixture
 */
export const mockAppDefinition: AppDefinition = {
  id: "test-app",
  name: "Test App",
  icon: "🧪",
  window: {
    defaultSize: { width: 600, height: 400 },
    minSize: { width: 400, height: 300 },
    resizable: true,
  },
  component: MockAppComponent,
};

/**
 * Mock app instance fixture
 */
export const mockAppInstance: AppInstance = {
  instanceId: "instance-1",
  appId: "test-app",
  windowId: "window-1",
  data: undefined,
};

/**
 * Mock window data fixture
 */
export const mockWindowData = {
  id: "window-1",
  title: "Test Window",
  x: 100,
  y: 100,
  width: 600,
  height: 400,
  zIndex: 1,
};

/**
 * Utility to create unique IDs for tests
 */
let idCounter = 0;
export function generateTestId(prefix: string = "test"): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Reset the ID counter (useful between tests)
 */
export function resetTestIds(): void {
  idCounter = 0;
}

