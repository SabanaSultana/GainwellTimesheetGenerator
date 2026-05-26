import { useEffect } from 'react';

// Calls fn(false) immediately on mount and fn(true) every `interval` ms.
// Re-runs (resets interval + immediate fetch) whenever `fn` changes.
// Use fn(silent) pattern: silent=false shows loading, silent=true updates silently.
const usePolling = (fn, interval = 2000) => {
  useEffect(() => {
    fn(false);
    const id = setInterval(() => fn(true), interval);
    return () => clearInterval(id);
  }, [fn, interval]);
};

export default usePolling;
