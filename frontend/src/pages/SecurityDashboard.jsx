import { useCallback, useEffect, useRef, useState } from "react";

import PanelLayout from "../layouts/PanelLayout";
import {
  listEnrolledFaces,
  listTodayAttendance,
  markAttendancePunch,
} from "../services/api";
import {
  captureVideoFrameBlob,
  getFaceDescriptorFromInput,
  indexMatchableStaff,
  loadFaceModels,
  matchFaceDescriptor,
} from "../utils/faceRecognition";

const NEXT_STAFF_DELAY_MS = 2500;
const POST_SUCCESS_COOLDOWN_MS = 800;

const formatTime = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString("en-NG", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZone: "Africa/Lagos",
  });
};

/**
 * Security attendance kiosk — queue mode:
 * scan face → server auto in/out → success → next staff.
 */
const SecurityDashboard = () => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const matchableRef = useRef([]);
  const busyRef = useRef(false);
  const nextTimerRef = useRef(null);
  const cooldownUntilRef = useRef(0);
  /** When true, effect attaches camera if video is available and not in success UI */
  const [cameraDesired, setCameraDesired] = useState(true);

  const [modelsReady, setModelsReady] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [enrolled, setEnrolled] = useState([]);
  const [matchableCount, setMatchableCount] = useState(0);
  const [today, setToday] = useState([]);
  const [loadingGallery, setLoadingGallery] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attendanceTaken, setAttendanceTaken] = useState(null);
  const [manualUserId, setManualUserId] = useState("");
  const [showManual, setShowManual] = useState(false);

  const setMatchableIndex = useCallback((staffList) => {
    const indexed = indexMatchableStaff(staffList);
    matchableRef.current = indexed;
    setMatchableCount(indexed.length);
  }, []);

  const clearNextTimer = useCallback(() => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOn(false);
  }, []);

  const refreshToday = useCallback(async () => {
    try {
      const data = await listTodayAttendance();
      setToday(data.records || []);
    } catch {
      setToday([]);
    }
  }, []);

  const loadGallery = useCallback(async () => {
    setLoadingGallery(true);
    try {
      const data = await listEnrolledFaces();
      const staff = data.staff || [];
      setEnrolled(staff);
      setMatchableIndex(staff);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load enrolled faces.");
      setEnrolled([]);
      setMatchableIndex([]);
    } finally {
      setLoadingGallery(false);
    }
  }, [setMatchableIndex]);

  useEffect(() => {
    let cancelled = false;

    loadFaceModels()
      .then(() => {
        if (!cancelled) setModelsReady(true);
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Face recognition models failed to load. You can still select staff manually."
          );
        }
      });

    loadGallery();
    refreshToday();

    return () => {
      cancelled = true;
      clearNextTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [loadGallery, refreshToday, clearNextTimer]);

  // Keep camera lifecycle out of render: attach when desired and success UI is cleared
  useEffect(() => {
    if (!modelsReady || !cameraDesired || attendanceTaken) return undefined;

    let cancelled = false;

    (async () => {
      try {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraOn(true);
        setError((prev) =>
          prev.startsWith("Unable to access the camera") ? "" : prev
        );
      } catch {
        if (!cancelled) {
          setCameraOn(false);
          setCameraDesired(false);
          setError(
            "Unable to access the camera. Allow camera permission or use manual select."
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [modelsReady, cameraDesired, attendanceTaken]);

  const prepareNextStaff = useCallback(() => {
    clearNextTimer();
    setError("");
    setManualUserId("");
    setAttendanceTaken(null);
    setCameraDesired(true);
  }, [clearNextTimer]);

  const recordAttendance = async ({ userId, confidence, snapshotBlob }) => {
    const data = await markAttendancePunch({
      type: "auto",
      userId,
      matchConfidence: confidence,
      snapshotBlob,
    });

    const punchType =
      data.punchType || (data.attendance?.checkOutAt ? "out" : "in");
    const punchTime =
      punchType === "out"
        ? data.attendance?.checkOutAt
        : data.attendance?.checkInAt;

    return {
      name: data.attendance?.name || "Staff",
      staffId: data.attendance?.staffId || "",
      punchType,
      punchLabel: punchType === "out" ? "Checked out" : "Checked in",
      time: punchTime,
      timeLabel: formatTime(punchTime),
      confidence,
      message: data.message,
    };
  };

  const finishSuccess = async (result) => {
    setCameraDesired(false);
    stopCamera();
    setAttendanceTaken(result);
    cooldownUntilRef.current = Date.now() + POST_SUCCESS_COOLDOWN_MS;
    await refreshToday();

    clearNextTimer();
    nextTimerRef.current = setTimeout(() => {
      prepareNextStaff();
    }, NEXT_STAFF_DELAY_MS);
  };

  const scanAndTakeAttendance = async () => {
    if (busyRef.current) return;
    if (Date.now() < cooldownUntilRef.current) return;

    setError("");

    if (!modelsReady) {
      setError("Face models are still loading.");
      return;
    }
    if (!cameraOn || !videoRef.current) {
      setError("Start the camera first.");
      return;
    }
    if (!matchableRef.current.length) {
      setError(
        "No staff with face descriptors enrolled. Refresh enrollments or use manual select."
      );
      return;
    }

    busyRef.current = true;
    setBusy(true);

    try {
      // Hot path: one detection + match against pre-indexed descriptors only
      const descriptor = await getFaceDescriptorFromInput(videoRef.current);
      if (!descriptor) {
        setError("No face detected. Ask the person to face the camera.");
        return;
      }

      const best = matchFaceDescriptor(descriptor, matchableRef.current);
      if (!best) {
        setError(
          "No matching enrolled staff found. Try again or use manual select below."
        );
        return;
      }

      let snapshotBlob = null;
      try {
        snapshotBlob = await captureVideoFrameBlob(videoRef.current, 0.85);
      } catch {
        snapshotBlob = null;
      }

      setCameraDesired(false);
      stopCamera();

      const result = await recordAttendance({
        userId: best._id,
        confidence: best.confidence,
        snapshotBlob,
      });

      result.confidence = best.confidence;
      await finishSuccess(result);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Attendance failed."
      );
      setCameraDesired(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const submitManualAttendance = async () => {
    if (busyRef.current) return;
    if (Date.now() < cooldownUntilRef.current) return;

    if (!manualUserId) {
      setError("Select a staff member for manual attendance.");
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError("");

    try {
      let snapshotBlob = null;
      if (cameraOn && videoRef.current) {
        try {
          snapshotBlob = await captureVideoFrameBlob(videoRef.current, 0.85);
        } catch {
          snapshotBlob = null;
        }
      }

      setCameraDesired(false);
      stopCamera();

      const result = await recordAttendance({
        userId: manualUserId,
        confidence: null,
        snapshotBlob,
      });

      await finishSuccess(result);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Attendance failed."
      );
      setCameraDesired(true);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <PanelLayout title="Security · Attendance">
      <div className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold tracking-[-0.03em] text-slate-950">
                Gate scan
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Scan once — check-in or check-out is chosen automatically for
                today (Africa/Lagos). Punch times come from the server.
              </p>
            </div>
            <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
              {matchableCount}/{enrolled.length} matchable · models{" "}
              {modelsReady ? "ready" : "loading"}
            </p>
          </div>

          {error && (
            <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}

          <div className="relative mt-5 overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
            {/* Video stays mounted so camera restart can attach stream after success */}
            <video
              ref={videoRef}
              muted
              playsInline
              className={`aspect-[4/3] w-full object-cover ${
                attendanceTaken ? "invisible absolute inset-0 h-full w-full" : ""
              }`}
            />
            {attendanceTaken && (
              <div className="flex aspect-[4/3] w-full flex-col items-center justify-center bg-gradient-to-b from-emerald-50 to-white px-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500 text-3xl font-bold text-white shadow-lg shadow-emerald-500/30">
                  ✓
                </div>
                <p className="mt-5 text-2xl font-bold tracking-tight text-emerald-900">
                  Attendance taken
                </p>
                <p className="mt-2 text-lg font-semibold text-slate-950">
                  {attendanceTaken.name}
                </p>
                <p className="text-sm text-slate-600">
                  {attendanceTaken.staffId}
                  {attendanceTaken.confidence != null
                    ? ` · ${Math.round(attendanceTaken.confidence * 100)}% match`
                    : ""}
                </p>
                <p className="mt-4 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-900">
                  {attendanceTaken.punchLabel} · {attendanceTaken.timeLabel}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Server time · Africa/Lagos
                </p>
                <button
                  type="button"
                  onClick={prepareNextStaff}
                  className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-blue-600"
                >
                  Next staff
                </button>
                <p className="mt-2 text-xs text-slate-500">
                  Camera restarts automatically in a moment
                </p>
              </div>
            )}
          </div>

          {!attendanceTaken && (
            <>
              <div className="mt-4 flex flex-wrap gap-2">
                {!cameraOn ? (
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setCameraDesired(true);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-blue-600"
                  >
                    Start camera
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setCameraDesired(false);
                      stopCamera();
                    }}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                  >
                    Stop camera
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy || !cameraOn}
                  onClick={scanAndTakeAttendance}
                  className="inline-flex h-11 flex-1 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(15,23,42,0.08),0_8px_18px_rgba(15,23,42,0.1)] transition hover:bg-blue-600 disabled:opacity-50 sm:min-w-[12rem]"
                >
                  {busy ? "Recording…" : "Scan & take attendance"}
                </button>
                <button
                  type="button"
                  onClick={loadGallery}
                  className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                >
                  Refresh enrollments
                </button>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => setShowManual((open) => !open)}
                  className="text-sm font-semibold text-slate-600 underline-offset-2 transition hover:text-slate-950 hover:underline"
                >
                  {showManual
                    ? "Hide manual fallback"
                    : "Manual staff (if face match fails)"}
                </button>

                {showManual && (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="min-w-0 flex-1">
                      <label className="text-sm font-medium text-slate-700">
                        Staff
                      </label>
                      <select
                        value={manualUserId}
                        onChange={(e) => setManualUserId(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
                      >
                        <option value="">Select enrolled staff…</option>
                        {enrolled.map((person) => (
                          <option key={person._id} value={person._id}>
                            {person.name} ({person.staffId})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      disabled={busy || !manualUserId}
                      onClick={submitManualAttendance}
                      className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-blue-600 disabled:opacity-50"
                    >
                      {busy ? "Recording…" : "Take attendance"}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        <section className="rounded-[28px] border border-slate-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.05),0_18px_48px_rgba(15,23,42,0.08)]">
          <h2 className="text-xl font-bold tracking-tight text-slate-950">
            Today at the gate
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Read-only feed for Africa/Lagos business day. Historical times cannot
            be edited here.
          </p>

          {loadingGallery && enrolled.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">Loading…</p>
          ) : today.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">No punches yet today.</p>
          ) : (
            <ul className="mt-5 max-h-[32rem] space-y-3 overflow-y-auto">
              {today.map((record) => (
                <li
                  key={record._id}
                  className="rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-3"
                >
                  <p className="font-semibold text-slate-950">{record.name}</p>
                  <p className="text-xs text-slate-500">
                    {record.staffId} · {record.department || "—"}
                  </p>
                  <p className="mt-2 text-sm text-slate-700">
                    In {formatTime(record.checkInAt)} · Out{" "}
                    {formatTime(record.checkOutAt)}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {record.status} · facial
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PanelLayout>
  );
};

export default SecurityDashboard;
