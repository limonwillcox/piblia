/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DONATE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
