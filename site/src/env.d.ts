declare global {
  interface Window {
    $: JQueryStatic;
    jQuery: JQueryStatic;
  }

  namespace NodeJS {
    interface ProcessEnv {
      readonly SITE_URL?: string;
      readonly BASE_PATH?: string;
    }
  }
}

export {};
