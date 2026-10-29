# Application configuration

An application is described by a single `AppDefinition` object (`src/system/types.ts`). The definition holds everything the OS needs to show the app: its identity, how its window should look, the React component to render and optional lifecycle hooks.

Every open window runs exactly one **instance** of an app. The same definition can back several instances at once, each with its own `instanceId` and its own state.

> **Status:** The types and the `ApplicationProvider` exist. They are not yet wired into `App.tsx`, which still uses a hardcoded `desktopApps` list. Fields marked _not yet used_ below are typed but nothing reads them yet.

## `AppDefinition`

| Field       | Type                      | Required | Purpose                                                  |
| ----------- | ------------------------- | -------- | -------------------------------------------------------- |
| `id`        | `string`                  | yes      | Unique app ID. It is the key in the registry and in `openApp(appId)`. |
| `name`      | `string`                  | yes      | Display name, used for the window title and icon label.  |
| `icon`      | `string`                  | yes      | An emoji or an image path.                               |
| `window`    | `WindowConfig`            | yes      | Window size and behavior. See below.                     |
| `component` | `ComponentType<AppProps>` | yes      | The React component rendered inside the window.          |
| `lifecycle` | `AppLifecycle`            | no       | Hooks called at key moments. See below.                  |

## `WindowConfig`

| Field         | Type                | Required | Notes          |
| ------------- | ------------------- | -------- | -------------- |
| `defaultSize` | `{ width, height }` | yes      | _Not yet used._ Windows are currently fixed at 500×350 in `App.tsx`, and the drag overlay in `Desktop.tsx` uses the same fixed size. |
| `minSize`     | `{ width, height }` | no       | _Not yet used._ |
| `maxSize`     | `{ width, height }` | no       | _Not yet used._ |
| `resizable`   | `boolean`           | no       | _Not yet used._ Windows can't be resized yet. |

The window's position isn't part of the configuration. The OS chooses it when the window opens and stores it in `App.tsx`.

## `AppLifecycle`

All hooks are optional. Each one receives the instance's `instanceId` and the `AppContext`.

| Hook            | When it runs                    | Return value                                  |
| --------------- | ------------------------------- | --------------------------------------------- |
| `onMount`       | The instance is mounted         | none                                          |
| `onUnmount`     | The instance is unmounted       | none                                          |
| `onBeforeClose` | Before the window closes        | `boolean \| Promise<boolean>`: return `false` to keep the window open |

_Not yet used:_ nothing calls these hooks yet. They are meant to be called by `Window` once it renders apps.

## What the component receives: `AppProps`

| Prop          | Type         | Purpose                                         |
| ------------- | ------------ | ----------------------------------------------- |
| `instanceId`  | `string`     | Unique ID of this instance                      |
| `windowId`    | `string`     | ID of the window hosting this instance          |
| `context`     | `AppContext` | The OS API. See [AppContext](app-context.md).   |
| `initialData` | `unknown`    | Optional data passed to `openApp(appId, data)` |

Apps manage their own state with `useState`, `useReducer` or an external store. The OS has no shared state of its own.

## Registering apps

`ApplicationProvider` takes a `Map<string, AppDefinition>` called `appRegistry`, keyed by app `id`. The planned home for that map is `src/apps/registry.ts`, with each app in `src/apps/<AppName>/`:

```
src/apps/
├── registry.ts        # builds the Map<string, AppDefinition>
└── Notes/
    ├── app.ts         # the AppDefinition
    └── index.tsx      # the component
```

_Not yet created._

## Example

```tsx
import type { AppDefinition, AppProps } from "@/system";

function Notes({ instanceId, context }: AppProps) {
  return <p>Notes instance {instanceId}</p>;
}

export const notesApp: AppDefinition = {
  id: "notes",
  name: "Notes",
  icon: "📝",
  window: {
    defaultSize: { width: 500, height: 350 },
    minSize: { width: 300, height: 200 },
    resizable: true,
  },
  component: Notes,
  lifecycle: {
    onBeforeClose: () => window.confirm("Discard unsaved notes?"),
  },
};
```
