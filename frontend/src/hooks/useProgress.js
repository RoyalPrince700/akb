import { useCallback, useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { completeChapter, getCourseProgress } from "../services/api";
import { isCourseFullyComplete } from "../utils/courseProgress";

const getUserId = (user) => {
  if (!user) return null;
  const id = user.id ?? user._id;
  return id != null ? String(id) : null;
};

const progressKey = (userId, courseId) => `progress_${userId}_${courseId}`;

const readLocalProgress = (user, courseId) => {
  const userId = getUserId(user);
  if (!userId || !courseId) return [];

  try {
    const stored = localStorage.getItem(progressKey(userId, courseId));
    if (stored) return JSON.parse(stored);

    const legacy = localStorage.getItem(`progress_undefined_${courseId}`);
    if (legacy) {
      localStorage.setItem(progressKey(userId, courseId), legacy);
      localStorage.removeItem(`progress_undefined_${courseId}`);
      return JSON.parse(legacy);
    }

    return [];
  } catch {
    return [];
  }
};

const writeLocalProgress = (user, courseId, chapters) => {
  const userId = getUserId(user);
  if (!userId || !courseId) return;
  localStorage.setItem(progressKey(userId, courseId), JSON.stringify(chapters));
};

export const useProgress = (courseId) => {
  const { user, token, updateUser } = useAuth();
  const [progress, setProgress] = useState(() => readLocalProgress(user, courseId));
  const [courseCompleted, setCourseCompleted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [lastCompletion, setLastCompletion] = useState(null);

  useEffect(() => {
    if (!getUserId(user) || !courseId) {
      setProgress([]);
      setCourseCompleted(false);
      setIsReady(true);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const local = readLocalProgress(user, courseId);
      setProgress(local);
      setCourseCompleted(isCourseFullyComplete(courseId, local));

      if (token) {
        try {
          const data = await getCourseProgress(courseId);
          if (!cancelled) {
            const chapters = data.completedChapters ?? [];
            setProgress(chapters);
            writeLocalProgress(user, courseId, chapters);
            setCourseCompleted(
              data.courseCompleted ??
                isCourseFullyComplete(courseId, chapters)
            );
          }
        } catch {
          /* keep local progress */
        }
      }

      if (!cancelled) setIsReady(true);
    };

    setIsReady(false);
    load();

    return () => {
      cancelled = true;
    };
  }, [user, courseId, token]);

  const markChapterCompleted = useCallback(
    async (chapterId) => {
      const userId = getUserId(user);
      if (!userId || !courseId) return null;

      setProgress((prev) => {
        if (prev.includes(chapterId)) return prev;
        const next = [...prev, chapterId];
        writeLocalProgress(user, courseId, next);
        setCourseCompleted(isCourseFullyComplete(courseId, next));
        return next;
      });

      if (!token) return null;

      try {
        const result = await completeChapter(courseId, chapterId);
        const chapters = result.completedChapters ?? [];
        setProgress(chapters);
        writeLocalProgress(user, courseId, chapters);
        setCourseCompleted(
          result.courseCompleted ?? isCourseFullyComplete(courseId, chapters)
        );
        setLastCompletion(result);

        if (result.totalGems != null) {
          updateUser({ gems: result.totalGems });
        }

        return result;
      } catch {
        return null;
      }
    },
    [user, courseId, token, updateUser]
  );

  const clearLastCompletion = useCallback(() => {
    setLastCompletion(null);
  }, []);

  return {
    clearLastCompletion,
    courseCompleted,
    isReady,
    lastCompletion,
    markChapterCompleted,
    progress,
  };
};
