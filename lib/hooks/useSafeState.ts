/**
 * CRITICAL: This hook ensures stable state management patterns
 * DO NOT MODIFY without understanding the implications
 * 
 * Pattern: Use this hook for all state that might be updated after component unmount
 * This prevents memory leaks and race conditions
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Safe state hook with automatic cleanup
 * Prevents state updates after component unmount
 * 
 * @template T - State type
 * @param initialState - Initial state value
 * @returns [state, safeSetState] - State value and safe setter function
 */
export function useSafeState<T>(initialState: T | (() => T)) {
  const [state, setState] = useState<T>(initialState);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback((newState: T | ((prev: T) => T)) => {
    if (!isMountedRef.current) return;
    
    setState((prevState) => {
      if (!isMountedRef.current) return prevState;
      return typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prevState)
        : newState;
    });
  }, []);

  return [state, safeSetState] as const;
}

/**
 * Safe async operation hook
 * Automatically cancels async operations on unmount
 */
export function useSafeAsync() {
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();
    
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const createAbortSignal = useCallback(() => {
    if (!abortControllerRef.current) {
      abortControllerRef.current = new AbortController();
    }
    return abortControllerRef.current.signal;
  }, []);

  const isMounted = useCallback(() => isMountedRef.current, []);

  return { isMounted, createAbortSignal };
}

/**
 * Safe params resolver for Next.js 15+
 * Handles Promise-based params automatically
 */
export function useSafeParams<T extends Record<string, string | string[] | undefined>>(
  params: T | Promise<T>
): { params: T | null; loaded: boolean } {
  const [resolvedParams, setResolvedParams] = useState<T | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    
    const resolve = async () => {
      try {
        let result: T;
        
        // Check if params is a Promise (Next.js 15+)
        if (params && typeof params === 'object' && 'then' in params && typeof (params as any).then === 'function') {
          result = await params as T;
        } else {
          result = params as T;
        }
        
        if (isMountedRef.current) {
          setResolvedParams(result);
          setLoaded(true);
        }
      } catch (error: any) {
        console.error('Error resolving params:', error);
        if (isMountedRef.current) {
          setResolvedParams(null);
          setLoaded(true);
        }
      }
    };
    
    resolve();

    return () => {
      isMountedRef.current = false;
    };
  }, [params]);

  return { params: resolvedParams, loaded };
}
