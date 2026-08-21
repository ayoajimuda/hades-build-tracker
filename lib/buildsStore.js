const KEY = 'builds';
const EMPTY = [];

let cachedRaw = null;
let cachedValue = EMPTY;
const listeners = new Set();

function emit() {
  listeners.forEach((l) => l());
}

export function subscribe(listener) {
  listeners.add(listener);
  window.addEventListener('storage', emit);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', emit);
  };
}

export function getSnapshot() {
  const raw = localStorage.getItem(KEY);
  if (raw === cachedRaw) return cachedValue;
  cachedRaw = raw;
  try {
    cachedValue = raw ? JSON.parse(raw) : EMPTY;
  } catch {
    cachedValue = EMPTY;
  }
  return cachedValue;
}

export function getServerSnapshot() {
  return EMPTY;
}

export function saveBuilds(builds) {
  localStorage.setItem(KEY, JSON.stringify(builds));
  emit();
}

export function deleteBuild(slug) {
  saveBuilds(getSnapshot().filter((b) => b.slug !== slug));
}