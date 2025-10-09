/* eslint-disable react-refresh/only-export-components */
import { render } from "@testing-library/react";
import type { RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * Custom render function that wraps components with necessary providers
 * This will be extended once we have ApplicationContext and other providers
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  // Add custom options here as needed (currently empty but will be extended)
}

/**
 * Wrapper component for providers
 * Will be extended to include ApplicationContext and other providers
 * @internal
 */
function AllProviders({ children }: { children: ReactNode }) {
  // TODO: Add ApplicationContext.Provider when implemented
  return <>{children}</>;
}

/**
 * Custom render function with providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions
) {
  return render(ui, { wrapper: AllProviders, ...options });
}
