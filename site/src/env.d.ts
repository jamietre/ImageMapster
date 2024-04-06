/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      readonly SITE_URL: string;
      readonly BASE_PATH: string;
    }
  }
}
