/**
 * Event Bus for inter-app communication
 * Simple pub/sub system with type-safe event handling
 */

type EventHandler = (data: unknown) => void;
type Unsubscribe = () => void;

/**
 * EventBus class for managing application events
 */
export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  /**
   * Subscribe to an event
   * @param event - The event name to listen for
   * @param handler - The handler function to call when the event is emitted
   * @returns A function to unsubscribe from the event
   */
  on(event: string, handler: EventHandler): Unsubscribe {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const handlers = this.listeners.get(event)!;
    handlers.add(handler);

    // Return unsubscribe function
    return () => {
      handlers.delete(handler);
      // Clean up empty event sets to prevent memory leaks
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  /**
   * Emit an event to all subscribers
   * @param event - The event name to emit
   * @param data - The data to pass to handlers
   */
  emit(event: string, data: unknown): void {
    const handlers = this.listeners.get(event);
    if (!handlers) {
      return;
    }

    // Call all handlers with the data
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Error in event handler for "${event}":`, error);
      }
    });
  }

  /**
   * Remove all listeners for a specific event
   * @param event - The event name to clear
   */
  clear(event: string): void {
    this.listeners.delete(event);
  }

  /**
   * Remove all listeners for all events
   */
  clearAll(): void {
    this.listeners.clear();
  }

  /**
   * Get the number of listeners for an event
   * Useful for testing and debugging
   * @param event - The event name
   * @returns The number of listeners
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

/**
 * Global event bus instance
 */
export const eventBus = new EventBus();
