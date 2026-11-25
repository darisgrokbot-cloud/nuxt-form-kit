/** Minimal stubs so runtime composables can load under Vitest (node). */
export function useNuxtApp() {
  return {}
}

export function useRuntimeConfig() {
  return { public: {} }
}

export function defineNuxtPlugin<T>(plugin: T): T {
  return plugin
}
