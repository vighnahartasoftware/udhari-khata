import { useEffect, useState } from 'react';
import { db } from '../dexie';

export interface DexieStatus {
  isReady: boolean;
  isOpen: boolean;
  error: Error | null;
}

export function useDexieStatus(): DexieStatus {
  const [status, setStatus] = useState<DexieStatus>({
    isReady: false,
    isOpen: db.isOpen(),
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    db.open()
      .then(() => {
        if (isMounted) {
          setStatus({
            isReady: true,
            isOpen: true,
            error: null,
          });
        }
      })
      .catch((err: Error) => {
        if (isMounted) {
          setStatus({
            isReady: false,
            isOpen: false,
            error: err,
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return status;
}
