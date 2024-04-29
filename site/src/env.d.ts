/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare var $: JQueryStatic;
declare var jQuery: JQueryStatic;

// TODO: Remove once Starlight supports media query change events
//       See src/components/starlight/theme-select.astro for details
declare const StarlightThemeProvider: {
  updatePickers(theme?: string): void;
};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly SITE_URL: string;
      readonly BASE_PATH: string;
    }
  }
}
