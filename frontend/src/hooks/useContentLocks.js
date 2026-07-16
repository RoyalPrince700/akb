import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { listContentLocks } from "../services/api";

let locksCache = null;
let locksPromise = null;

const toMap = (locks = []) =>
  Object.fromEntries(locks.map((lock) => [lock.courseId, lock]));

export const invalidateContentLocksCache = () => {
  locksCache = null;
  locksPromise = null;
};

export const fetchContentLocksMap = async ({ force = false } = {}) => {
  if (!force && locksCache) {
    return locksCache;
  }

  if (!force && locksPromise) {
    return locksPromise;
  }

  locksPromise = listContentLocks()
    .then((data) => {
      locksCache = toMap(data.locks || []);
      return locksCache;
    })
    .catch((error) => {
      locksPromise = null;
      throw error;
    });

  return locksPromise;
};

export const useContentLocks = () => {
  const { token } = useAuth();
  const [locksByCourseId, setLocksByCourseId] = useState(locksCache || {});
  const [isReady, setIsReady] = useState(Boolean(locksCache));
  const [error, setError] = useState("");

  const refresh = useCallback(
    async ({ force = false } = {}) => {
      if (!token) {
        setLocksByCourseId({});
        setIsReady(true);
        setError("");
        return {};
      }

      if (!force && locksCache) {
        setLocksByCourseId(locksCache);
        setIsReady(true);
        setError("");
        return locksCache;
      }

      setIsReady(Boolean(locksCache));
      setError("");

      try {
        const map = await fetchContentLocksMap({ force });
        setLocksByCourseId(map);
        return map;
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load content locks.");
        if (!locksCache) {
          setLocksByCourseId({});
        }
        return locksCache || {};
      } finally {
        setIsReady(true);
      }
    },
    [token]
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const getLock = useCallback(
    (courseId) =>
      locksByCourseId[courseId] || {
        courseId,
        courseLocked: false,
        assessmentLocked: false,
      },
    [locksByCourseId]
  );

  return {
    error,
    getLock,
    isReady,
    locksByCourseId,
    refresh,
  };
};

export const useContentLock = (courseId) => {
  const { getLock, isReady, refresh, error } = useContentLocks();
  return {
    error,
    isReady,
    lock: getLock(courseId),
    refresh,
  };
};
