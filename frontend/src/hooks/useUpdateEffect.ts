import { EffectCallback, useEffect, useRef } from 'react';

/**
 * A hook that calls effect only if dependencies are changed. It does not call
 * the effect on mount.
 *
 * @param effect function to be called
 * @param deps dependencies
 */
export default function useUpdateEffect(effect: EffectCallback, deps: any[]) {
  const isMountedRef = useRef(false);

  useEffect(() => {
    if (isMountedRef.current) {
      return effect();
    } else {
      isMountedRef.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
};
