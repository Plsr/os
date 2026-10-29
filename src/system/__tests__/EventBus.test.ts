import { describe, it, expect, vi, beforeEach } from "vitest";
import { EventBus } from "../EventBus";

describe("EventBus", () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe("on and emit", () => {
    it("should call handler when event is emitted", () => {
      const handler = vi.fn();
      eventBus.on("test-event", handler);

      eventBus.emit("test-event", { message: "hello" });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({ message: "hello" });
    });

    it("should not call handler for different event", () => {
      const handler = vi.fn();
      eventBus.on("event-a", handler);

      eventBus.emit("event-b", { message: "hello" });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should call multiple handlers for same event", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBus.on("test-event", handler1);
      eventBus.on("test-event", handler2);
      eventBus.on("test-event", handler3);

      eventBus.emit("test-event", "data");

      expect(handler1).toHaveBeenCalledWith("data");
      expect(handler2).toHaveBeenCalledWith("data");
      expect(handler3).toHaveBeenCalledWith("data");
    });

    it("should handle emitting event with no listeners", () => {
      expect(() => {
        eventBus.emit("no-listeners", "data");
      }).not.toThrow();
    });

    it("should pass any type of data", () => {
      const handler = vi.fn();
      eventBus.on("test-event", handler);

      eventBus.emit("test-event", null);
      eventBus.emit("test-event", undefined);
      eventBus.emit("test-event", 42);
      eventBus.emit("test-event", "string");
      eventBus.emit("test-event", { complex: "object" });
      eventBus.emit("test-event", ["array", "data"]);

      expect(handler).toHaveBeenCalledTimes(6);
    });
  });

  describe("unsubscribe", () => {
    it("should stop calling handler after unsubscribe", () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on("test-event", handler);

      eventBus.emit("test-event", "first");
      expect(handler).toHaveBeenCalledTimes(1);

      unsubscribe();

      eventBus.emit("test-event", "second");
      expect(handler).toHaveBeenCalledTimes(1); // Still only 1 call
    });

    it("should only unsubscribe the specific handler", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const unsubscribe1 = eventBus.on("test-event", handler1);
      eventBus.on("test-event", handler2);

      unsubscribe1();

      eventBus.emit("test-event", "data");

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it("should be safe to call unsubscribe multiple times", () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on("test-event", handler);

      unsubscribe();
      unsubscribe();
      unsubscribe();

      expect(() => {
        eventBus.emit("test-event", "data");
      }).not.toThrow();
      expect(handler).not.toHaveBeenCalled();
    });

    it("should clean up empty event sets to prevent memory leaks", () => {
      const handler = vi.fn();
      const unsubscribe = eventBus.on("test-event", handler);

      expect(eventBus.listenerCount("test-event")).toBe(1);

      unsubscribe();

      expect(eventBus.listenerCount("test-event")).toBe(0);
    });
  });

  describe("error handling", () => {
    it("should catch errors in handlers and continue", () => {
      const errorHandler = vi.fn(() => {
        throw new Error("Handler error");
      });
      const goodHandler = vi.fn();
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      eventBus.on("test-event", errorHandler);
      eventBus.on("test-event", goodHandler);

      eventBus.emit("test-event", "data");

      expect(errorHandler).toHaveBeenCalled();
      expect(goodHandler).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it("should log error with event name", () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Test error");

      eventBus.on("my-event", () => {
        throw error;
      });

      eventBus.emit("my-event", "data");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error in event handler for "my-event":',
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe("listenerCount", () => {
    it("should return 0 for events with no listeners", () => {
      expect(eventBus.listenerCount("no-listeners")).toBe(0);
    });

    it("should return correct count for events with listeners", () => {
      eventBus.on("test-event", () => {});
      expect(eventBus.listenerCount("test-event")).toBe(1);

      eventBus.on("test-event", () => {});
      expect(eventBus.listenerCount("test-event")).toBe(2);

      eventBus.on("test-event", () => {});
      expect(eventBus.listenerCount("test-event")).toBe(3);
    });

    it("should decrement count after unsubscribe", () => {
      const unsubscribe1 = eventBus.on("test-event", () => {});
      const unsubscribe2 = eventBus.on("test-event", () => {});

      expect(eventBus.listenerCount("test-event")).toBe(2);

      unsubscribe1();
      expect(eventBus.listenerCount("test-event")).toBe(1);

      unsubscribe2();
      expect(eventBus.listenerCount("test-event")).toBe(0);
    });
  });

  describe("clear", () => {
    it("should remove all listeners for a specific event", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on("test-event", handler1);
      eventBus.on("test-event", handler2);

      expect(eventBus.listenerCount("test-event")).toBe(2);

      eventBus.clear("test-event");

      expect(eventBus.listenerCount("test-event")).toBe(0);
      eventBus.emit("test-event", "data");
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it("should not affect other events", () => {
      const handlerA = vi.fn();
      const handlerB = vi.fn();

      eventBus.on("event-a", handlerA);
      eventBus.on("event-b", handlerB);

      eventBus.clear("event-a");

      eventBus.emit("event-a", "data");
      eventBus.emit("event-b", "data");

      expect(handlerA).not.toHaveBeenCalled();
      expect(handlerB).toHaveBeenCalled();
    });

    it("should be safe to clear non-existent event", () => {
      expect(() => {
        eventBus.clear("non-existent");
      }).not.toThrow();
    });
  });

  describe("clearAll", () => {
    it("should remove all listeners for all events", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const handler3 = vi.fn();

      eventBus.on("event-a", handler1);
      eventBus.on("event-b", handler2);
      eventBus.on("event-c", handler3);

      expect(eventBus.listenerCount("event-a")).toBe(1);
      expect(eventBus.listenerCount("event-b")).toBe(1);
      expect(eventBus.listenerCount("event-c")).toBe(1);

      eventBus.clearAll();

      expect(eventBus.listenerCount("event-a")).toBe(0);
      expect(eventBus.listenerCount("event-b")).toBe(0);
      expect(eventBus.listenerCount("event-c")).toBe(0);

      eventBus.emit("event-a", "data");
      eventBus.emit("event-b", "data");
      eventBus.emit("event-c", "data");

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
      expect(handler3).not.toHaveBeenCalled();
    });

    it("should be safe to call on empty event bus", () => {
      expect(() => {
        eventBus.clearAll();
      }).not.toThrow();
    });
  });

  describe("memory management", () => {
    it("should not create duplicate handlers for same function", () => {
      const handler = vi.fn();

      eventBus.on("test-event", handler);
      eventBus.on("test-event", handler);
      eventBus.on("test-event", handler);

      // Set only stores unique values, so should be 1
      expect(eventBus.listenerCount("test-event")).toBe(1);

      eventBus.emit("test-event", "data");
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe("complex scenarios", () => {
    it("should handle unsubscribing during event emission", () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn(() => {
        // Unsubscribe self during execution
        unsubscribe2?.();
      });
      const handler3 = vi.fn();

      eventBus.on("test-event", handler1);
      const unsubscribe2 = eventBus.on("test-event", handler2);
      eventBus.on("test-event", handler3);

      eventBus.emit("test-event", "data");

      // All handlers should still be called in this emission
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
      expect(handler3).toHaveBeenCalledTimes(1);

      // But handler2 should not be called in next emission
      eventBus.emit("test-event", "data");
      expect(handler1).toHaveBeenCalledTimes(2);
      expect(handler2).toHaveBeenCalledTimes(1); // Still 1
      expect(handler3).toHaveBeenCalledTimes(2);
    });

    it("should support multiple events and cross-communication", () => {
      const results: string[] = [];

      eventBus.on("step-1", () => {
        results.push("step-1");
        eventBus.emit("step-2", null);
      });

      eventBus.on("step-2", () => {
        results.push("step-2");
        eventBus.emit("step-3", null);
      });

      eventBus.on("step-3", () => {
        results.push("step-3");
      });

      eventBus.emit("step-1", null);

      expect(results).toEqual(["step-1", "step-2", "step-3"]);
    });
  });
});
