# AppContext

`AppContext` is the API the OS gives to running apps (`src/system/types.ts`). Through it an app can open and close apps, send and receive events, and focus windows. It's separate from [application configuration](application-configuration.md): the configuration describes an app before it runs, and `AppContext` is what the app uses while it runs.

`ApplicationProvider` (`src/system/ApplicationContext.tsx`) provides the context.

> **Status:** `ApplicationProvider` exists and has tests, but `App.tsx` doesn't render it yet.

## Getting the context

**Apps get the context in one way only: the `context` prop on `AppProps`.**

```tsx
function Notes({ context }: AppProps) {
  // use context.openApp, context.on, …
}
```

If a component deep inside an app seems to need the context, restructure the app rather than looking for another way in.

The hooks `useApplicationContext()` and `useApplicationContextInternal()` are for system components only, such as `Window` and `Desktop`. They throw if no `ApplicationProvider` is above them. A lint rule will stop apps from importing them (planned in [todo/lint-no-context-hook-in-apps.md](../todo/lint-no-context-hook-in-apps.md)).

Lifecycle hooks such as `onMount` and `onBeforeClose` receive the same context as an argument.

## Methods

### `openApp(appId, data?) => instanceId`

Opens a new instance of a registered app.

1. Looks up `appId` in the registry and throws `App with id "<appId>" not found in registry` if it isn't there.
2. Creates an `instanceId` in the form `<appId>-<timestamp>-<random>`.
3. Calls the provider's `onOpenWindow(appId, instanceId, data)`, which returns the `windowId`. If no `onOpenWindow` is set, the `windowId` becomes `window-<instanceId>`.
4. Registers the instance and returns its `instanceId`.

Every call creates a new instance. There's no "focus the window if it's already open" behavior at this level.

`data` reaches the new app as `initialData` once instances are rendered.

### `closeApp(instanceId)`

1. If the instance isn't known, logs a warning and returns.
2. Calls the provider's `onCloseWindow(windowId)`.
3. Unregisters the instance.

`closeApp` doesn't call the app's `onBeforeClose` hook yet. A window closed this way closes without asking the app.

### `emit(event, data)` / `on(event, handler) => unsubscribe`

These are a thin wrapper around the `eventBus` singleton in `src/system/EventBus.ts`.

- Events are plain string names, and `data` is `unknown`, so handlers need to narrow its type.
- `emit` calls every handler for the event. If a handler throws, the error is logged and the other handlers still run.
- `on` returns an unsubscribe function, and the bus forgets an event once its last handler unsubscribes.
- The bus is a single object for the whole module, so every `ApplicationProvider` shares it, including the ones in tests.

When an app closes, its subscriptions are **not** removed for it. Unsubscribe in the effect cleanup:

```tsx
function Inbox({ context }: AppProps) {
  const { on } = context;

  useEffect(() => {
    return on("mail:received", (data) => {
      // handle data
    });
  }, [on]);

  return null;
}
```

### `focusWindow(windowId)`

Passes the call to the provider's `onFocusWindow`. If none is set, it does nothing.

## `ApplicationProvider`

The provider keeps track of **instances** but doesn't own **windows**. Window position, size and z-order belong to the host (eventually `App.tsx`). The provider tells the host about changes through callbacks.

| Prop            | Type                                          | Purpose                                         |
| --------------- | --------------------------------------------- | ----------------------------------------------- |
| `appRegistry`   | `Map<string, AppDefinition>`                  | Every app that can be opened                    |
| `onOpenWindow`  | `(appId, instanceId, data?) => windowId`      | Create a window for a new instance and return its ID |
| `onCloseWindow` | `(windowId) => void`                          | Remove a window                                 |
| `onFocusWindow` | `(windowId) => void`                          | Bring a window to the front                     |

The provider stores instances as `Map<instanceId, AppInstance>`, where each `AppInstance` holds `instanceId`, `appId`, `windowId` and `data`.

## Internal hook

`useApplicationContextInternal()` returns the full value inside the provider. That's the public API plus:

| Member                         | Purpose                                     |
| ------------------------------ | ------------------------------------------- |
| `instances`                    | The current `Map<instanceId, AppInstance>`  |
| `registerInstance(instance)`   | Add an instance without opening a window    |
| `unregisterInstance(id)`       | Remove an instance without closing a window |
| `getAppDefinition(appId)`      | Look up an app definition in the registry   |

Only system components should use it. Like the public hook, it's off-limits to apps.
