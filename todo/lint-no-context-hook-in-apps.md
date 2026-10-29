# Lint rule: apps can't use the context hooks

## Why

Apps get the OS API in exactly one way: the `context` prop on `AppProps`. `useApplicationContext()` and `useApplicationContextInternal()` exist for system components (`Window`, `Desktop`) only.

If a component deep inside an app needs the context, the app is badly structured. The fix is to restructure the app, not to reach for a hook. A lint rule makes that boundary hard to cross by accident. See [AppContext](../docs/app-context.md#getting-the-context).

## What

Add an ESLint rule, scoped to `src/apps/**`, that reports any import of `useApplicationContext` or `useApplicationContextInternal`. It has to catch both:

- the `@/system` barrel and `@/system/useApplicationContext`, and
- relative paths that reach the same modules, such as `../../system`.

`no-restricted-imports` should be enough, using `paths` for the alias imports and `patterns` with `importNames` for the relative ones. A rough sketch for `eslint.config.js`:

```js
{
  files: ['src/apps/**/*.{ts,tsx}'],
  rules: {
    'no-restricted-imports': ['error', {
      paths: ['@/system', '@/system/useApplicationContext'].map((name) => ({
        name,
        importNames: ['useApplicationContext', 'useApplicationContextInternal'],
        message: 'Apps use the `context` prop from AppProps, not the context hooks.',
      })),
      patterns: [{
        group: ['**/system', '**/system/useApplicationContext'],
        importNames: ['useApplicationContext', 'useApplicationContextInternal'],
        message: 'Apps use the `context` prop from AppProps, not the context hooks.',
      }],
    }],
  },
}
```

## Done when

- `pnpm lint` fails on a file in `src/apps/` that imports either hook, through the alias or a relative path.
- `pnpm lint` still passes when an app imports types (`AppProps`, `AppDefinition`) from `@/system`.
- `pnpm lint` still passes when system components outside `src/apps/` use the hooks.
- The error message points to the `context` prop.

## Notes

- `src/apps/` doesn't exist yet. Either land this together with the first app (Notes), or add a throwaway fixture file to check that the rule fires.
- The hooks still need to be exported from `@/system`, because system components use them. That's why this is a lint rule and not a change to the barrel exports.
