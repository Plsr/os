/**
 * Integration tests for ApplicationContext
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, render, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { ApplicationProvider } from "../ApplicationContext";
import {
  useApplicationContext,
  useApplicationContextInternal,
} from "../useApplicationContext";
import type { AppDefinition } from "../types";
import { mockAppDefinition } from "@/test/fixtures";

// Helper function to create a test wrapper with ApplicationProvider
function createWrapper(
  appRegistry: Map<string, AppDefinition> = new Map(),
  callbacks: {
    onFocusWindow?: (windowId: string) => void;
    onOpenWindow?: (
      appId: string,
      instanceId: string,
      data?: unknown
    ) => string;
    onCloseWindow?: (windowId: string) => void;
  } = {}
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ApplicationProvider appRegistry={appRegistry} {...callbacks}>
        {children}
      </ApplicationProvider>
    );
  };
}

describe("ApplicationContext", () => {
  let appRegistry: Map<string, AppDefinition>;
  let onFocusWindowMock: ReturnType<typeof vi.fn>;
  let onOpenWindowMock: ReturnType<typeof vi.fn>;
  let onCloseWindowMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    appRegistry = new Map();
    appRegistry.set(mockAppDefinition.id, mockAppDefinition);
    onFocusWindowMock = vi.fn();
    onOpenWindowMock = vi.fn((_appId, instanceId) => `window-${instanceId}`);
    onCloseWindowMock = vi.fn();
  });

  describe("Provider initialization", () => {
    it("should provide context to children", () => {
      const wrapper = createWrapper(appRegistry);
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.openApp).toBeInstanceOf(Function);
      expect(result.current.closeApp).toBeInstanceOf(Function);
      expect(result.current.emit).toBeInstanceOf(Function);
      expect(result.current.on).toBeInstanceOf(Function);
      expect(result.current.focusWindow).toBeInstanceOf(Function);
    });

    it("should throw error when used outside provider", () => {
      // Suppress console.error for this test
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        renderHook(() => useApplicationContext());
      }).toThrow(
        "useApplicationContext must be used within an ApplicationProvider"
      );

      consoleErrorSpy.mockRestore();
    });

    it("should render children correctly", () => {
      const { getByText } = render(
        <ApplicationProvider appRegistry={appRegistry}>
          <div>Test Child</div>
        </ApplicationProvider>
      );

      expect(getByText("Test Child")).toBeDefined();
    });
  });

  describe("openApp", () => {
    it("should open an app and return instance ID", () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
      });
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      let instanceId: string;
      act(() => {
        instanceId = result.current.openApp(mockAppDefinition.id);
      });

      expect(instanceId!).toBeDefined();
      expect(typeof instanceId!).toBe("string");
      expect(instanceId!).toContain(mockAppDefinition.id);
      expect(onOpenWindowMock).toHaveBeenCalledWith(
        mockAppDefinition.id,
        instanceId!,
        undefined
      );
    });

    it("should open an app with initial data", () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
      });
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      const testData = { message: "hello" };
      let instanceId: string;
      act(() => {
        instanceId = result.current.openApp(mockAppDefinition.id, testData);
      });

      expect(onOpenWindowMock).toHaveBeenCalledWith(
        mockAppDefinition.id,
        instanceId!,
        testData
      );
    });

    it("should throw error for non-existent app", () => {
      const wrapper = createWrapper(appRegistry);
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      expect(() => {
        result.current.openApp("non-existent-app");
      }).toThrow('App with id "non-existent-app" not found in registry');
    });

    it("should create unique instance IDs for multiple instances of same app", () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
      });
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      let instanceId1: string, instanceId2: string, instanceId3: string;
      act(() => {
        instanceId1 = result.current.openApp(mockAppDefinition.id);
        instanceId2 = result.current.openApp(mockAppDefinition.id);
        instanceId3 = result.current.openApp(mockAppDefinition.id);
      });

      expect(instanceId1!).not.toBe(instanceId2!);
      expect(instanceId2!).not.toBe(instanceId3!);
      expect(instanceId1!).not.toBe(instanceId3!);
    });

    it("should register instance in internal context", async () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
      });
      const { result } = renderHook(() => useApplicationContextInternal(), {
        wrapper,
      });

      let instanceId: string;
      act(() => {
        instanceId = result.current.openApp(mockAppDefinition.id);
      });

      await waitFor(() => {
        expect(result.current.instances.has(instanceId!)).toBe(true);
      });

      const instance = result.current.instances.get(instanceId!);
      expect(instance).toBeDefined();
      expect(instance?.appId).toBe(mockAppDefinition.id);
      expect(instance?.instanceId).toBe(instanceId!);
    });
  });

  describe("closeApp", () => {
    it("should close an app instance", async () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
        onCloseWindow: onCloseWindowMock,
      });
      const { result } = renderHook(() => useApplicationContextInternal(), {
        wrapper,
      });

      let instanceId: string;
      act(() => {
        instanceId = result.current.openApp(mockAppDefinition.id);
      });

      await waitFor(() => {
        expect(result.current.instances.has(instanceId!)).toBe(true);
      });

      act(() => {
        result.current.closeApp(instanceId!);
      });

      await waitFor(() => {
        expect(result.current.instances.has(instanceId!)).toBe(false);
        expect(onCloseWindowMock).toHaveBeenCalled();
      });
    });

    it("should call onCloseWindow with correct window ID", async () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
        onCloseWindow: onCloseWindowMock,
      });
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      let instanceId: string;
      act(() => {
        instanceId = result.current.openApp(mockAppDefinition.id);
      });

      const expectedWindowId = `window-${instanceId!}`;

      act(() => {
        result.current.closeApp(instanceId!);
      });

      await waitFor(() => {
        expect(onCloseWindowMock).toHaveBeenCalledWith(expectedWindowId);
      });
    });

    it("should handle closing non-existent instance gracefully", () => {
      const consoleWarnSpy = vi
        .spyOn(console, "warn")
        .mockImplementation(() => {});
      const wrapper = createWrapper(appRegistry);
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      expect(() => {
        result.current.closeApp("non-existent-instance");
      }).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Instance "non-existent-instance" not found'
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe("Event bus integration", () => {
    it("should emit events", () => {
      const wrapper = createWrapper(appRegistry);
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      const handler = vi.fn();
      result.current.on("test-event", handler);

      result.current.emit("test-event", { message: "hello" });

      expect(handler).toHaveBeenCalledWith({ message: "hello" });
    });

    it("should subscribe to events", () => {
      const wrapper = createWrapper(appRegistry);
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      const handler = vi.fn();
      const unsubscribe = result.current.on("test-event", handler);

      result.current.emit("test-event", "data");
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      result.current.emit("test-event", "data");
      expect(handler).toHaveBeenCalledTimes(1); // Still 1, not called again
    });

    it("should support multiple subscribers", () => {
      const wrapper = createWrapper(appRegistry);
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      result.current.on("broadcast", handler1);
      result.current.on("broadcast", handler2);
      result.current.on("broadcast", handler3);

      result.current.emit("broadcast", "message");

      expect(handler1).toHaveBeenCalledWith("message");
      expect(handler2).toHaveBeenCalledWith("message");
      expect(handler3).toHaveBeenCalledWith("message");
    });

    it("should allow inter-app communication pattern", () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
      });
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      // Simulate App A listening for messages
      const appAHandler = vi.fn();
      result.current.on("app-message", appAHandler);

      // Simulate App B sending a message
      result.current.emit("app-message", {
        from: "app-b",
        text: "Hello App A!",
      });

      expect(appAHandler).toHaveBeenCalledWith({
        from: "app-b",
        text: "Hello App A!",
      });
    });
  });

  describe("focusWindow", () => {
    it("should call onFocusWindow callback", () => {
      const wrapper = createWrapper(appRegistry, {
        onFocusWindow: onFocusWindowMock,
      });
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      result.current.focusWindow("window-123");

      expect(onFocusWindowMock).toHaveBeenCalledWith("window-123");
    });

    it("should handle missing callback gracefully", () => {
      const wrapper = createWrapper(appRegistry);
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      expect(() => {
        result.current.focusWindow("window-123");
      }).not.toThrow();
    });
  });

  describe("Instance management", () => {
    it("should track multiple app instances", async () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
      });
      const { result } = renderHook(() => useApplicationContextInternal(), {
        wrapper,
      });

      let id1: string, id2: string, id3: string;
      act(() => {
        id1 = result.current.openApp(mockAppDefinition.id);
        id2 = result.current.openApp(mockAppDefinition.id);
        id3 = result.current.openApp(mockAppDefinition.id);
      });

      await waitFor(() => {
        expect(result.current.instances.size).toBe(3);
      });

      expect(result.current.instances.has(id1!)).toBe(true);
      expect(result.current.instances.has(id2!)).toBe(true);
      expect(result.current.instances.has(id3!)).toBe(true);
    });

    it("should properly clean up instances when closed", async () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
        onCloseWindow: onCloseWindowMock,
      });
      const { result } = renderHook(() => useApplicationContextInternal(), {
        wrapper,
      });

      let id1: string, id2: string, id3: string;
      act(() => {
        id1 = result.current.openApp(mockAppDefinition.id);
        id2 = result.current.openApp(mockAppDefinition.id);
        id3 = result.current.openApp(mockAppDefinition.id);
      });

      await waitFor(() => {
        expect(result.current.instances.size).toBe(3);
      });

      act(() => {
        result.current.closeApp(id2!);
      });

      await waitFor(() => {
        expect(result.current.instances.size).toBe(2);
      });

      expect(result.current.instances.has(id1!)).toBe(true);
      expect(result.current.instances.has(id2!)).toBe(false);
      expect(result.current.instances.has(id3!)).toBe(true);
    });

    it("should store instance data correctly", async () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
      });
      const { result } = renderHook(() => useApplicationContextInternal(), {
        wrapper,
      });

      const testData = { config: "test" };
      let instanceId: string;
      act(() => {
        instanceId = result.current.openApp(mockAppDefinition.id, testData);
      });

      await waitFor(() => {
        const instance = result.current.instances.get(instanceId!);
        expect(instance?.data).toEqual(testData);
      });
    });
  });

  describe("getAppDefinition", () => {
    it("should return app definition from registry", () => {
      const wrapper = createWrapper(appRegistry);
      const { result } = renderHook(() => useApplicationContextInternal(), {
        wrapper,
      });

      const appDef = result.current.getAppDefinition(mockAppDefinition.id);

      expect(appDef).toBe(mockAppDefinition);
    });

    it("should return undefined for non-existent app", () => {
      const wrapper = createWrapper(appRegistry);
      const { result } = renderHook(() => useApplicationContextInternal(), {
        wrapper,
      });

      const appDef = result.current.getAppDefinition("non-existent");

      expect(appDef).toBeUndefined();
    });
  });

  describe("Hook boundaries", () => {
    it("useApplicationContext should not expose internal methods", () => {
      const wrapper = createWrapper(appRegistry);
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      // Public methods should exist
      expect(result.current.openApp).toBeDefined();
      expect(result.current.closeApp).toBeDefined();
      expect(result.current.emit).toBeDefined();
      expect(result.current.on).toBeDefined();
      expect(result.current.focusWindow).toBeDefined();

      // Internal methods should not exist
      expect(
        (result.current as unknown as { instances?: unknown }).instances
      ).toBeUndefined();
      expect(
        (result.current as unknown as { registerInstance?: unknown })
          .registerInstance
      ).toBeUndefined();
      expect(
        (result.current as unknown as { unregisterInstance?: unknown })
          .unregisterInstance
      ).toBeUndefined();
      expect(
        (result.current as unknown as { getAppDefinition?: unknown })
          .getAppDefinition
      ).toBeUndefined();
    });

    it("useApplicationContextInternal should expose all methods", () => {
      const wrapper = createWrapper(appRegistry);
      const { result } = renderHook(() => useApplicationContextInternal(), {
        wrapper,
      });

      // Public methods
      expect(result.current.openApp).toBeDefined();
      expect(result.current.closeApp).toBeDefined();
      expect(result.current.emit).toBeDefined();
      expect(result.current.on).toBeDefined();
      expect(result.current.focusWindow).toBeDefined();

      // Internal methods
      expect(result.current.instances).toBeDefined();
      expect(result.current.registerInstance).toBeDefined();
      expect(result.current.unregisterInstance).toBeDefined();
      expect(result.current.getAppDefinition).toBeDefined();
    });
  });

  describe("Complex scenarios", () => {
    it("should handle rapid open and close operations", async () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
        onCloseWindow: onCloseWindowMock,
      });
      const { result } = renderHook(() => useApplicationContextInternal(), {
        wrapper,
      });

      const ids: string[] = [];
      act(() => {
        for (let i = 0; i < 10; i++) {
          ids.push(result.current.openApp(mockAppDefinition.id));
        }
      });

      await waitFor(() => {
        expect(result.current.instances.size).toBe(10);
      });

      // Close every other instance
      act(() => {
        for (let i = 0; i < ids.length; i += 2) {
          result.current.closeApp(ids[i]);
        }
      });

      await waitFor(() => {
        expect(result.current.instances.size).toBe(5);
      });
    });

    it("should support app opening another app", () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
      });
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      let appAInstance: string, appBInstance: string;
      act(() => {
        // App A opens
        appAInstance = result.current.openApp(mockAppDefinition.id);
        // App A opens App B (same app for test purposes)
        appBInstance = result.current.openApp(mockAppDefinition.id, {
          openedBy: appAInstance,
        });
      });

      expect(appAInstance!).toBeDefined();
      expect(appBInstance!).toBeDefined();
      expect(appBInstance!).not.toBe(appAInstance!);
    });

    it("should maintain event subscriptions across instance lifecycle", () => {
      const wrapper = createWrapper(appRegistry, {
        onOpenWindow: onOpenWindowMock,
        onCloseWindow: onCloseWindowMock,
      });
      const { result } = renderHook(() => useApplicationContext(), { wrapper });

      const handler = vi.fn();
      result.current.on("persistent-event", handler);

      let id1: string, id2: string;
      act(() => {
        id1 = result.current.openApp(mockAppDefinition.id);
      });
      result.current.emit("persistent-event", "message1");
      expect(handler).toHaveBeenCalledTimes(1);

      act(() => {
        result.current.closeApp(id1!);
        id2 = result.current.openApp(mockAppDefinition.id);
      });
      result.current.emit("persistent-event", "message2");
      expect(handler).toHaveBeenCalledTimes(2);

      act(() => {
        result.current.closeApp(id2!);
      });
    });
  });
});
