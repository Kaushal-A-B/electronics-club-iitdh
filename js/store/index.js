import { isLive } from '../config.js';

// one store for the whole app, picked once at startup
export let store;

export async function initStore() {
  if (isLive) {
    const { createLiveStore } = await import('./live.js');
    store = await createLiveStore();
  } else {
    const { createPreviewStore } = await import('./preview.js');
    store = await createPreviewStore();
  }
  await store.init();
  return store;
}
