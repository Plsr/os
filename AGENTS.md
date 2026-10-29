# AGENTS.md

A desktop-style "OS" running in the browser, built with React 19, TypeScript and Vite. Windows and icons are dragged with `@dnd-kit/core`.

## Commands

- `pnpm dev`: start the dev server
- `pnpm build`: type-check and build
- `pnpm lint`: run ESLint
- `pnpm test`: run Vitest in watch mode

## Layout

- `src/components/`: desktop shell UI (`Desktop`, `Window`, `DesktopIcon`)
- `src/system/`: application system (types, `EventBus`, `ApplicationContext`)
- `src/test/`: test setup, render helpers and fixtures

## Docs

Project documentation lives in [`docs/`](docs/). Read the relevant doc before changing the area it covers, and update it when behavior changes.

- [Application configuration](docs/application-configuration.md): how an app is defined, configured and registered
- [AppContext](docs/app-context.md): the API running apps use (opening apps, events, focus) and the `ApplicationProvider` behind it
