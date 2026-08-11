import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, SwitchCamera, Trash2, X } from "lucide-react";

import {
  captureVideoFrameBlob,
  getFaceDescriptorFromBlob,
  loadFaceModels,
} from "../utils/faceRecognition";
import { clearStaffFace, enrollStaffFace } from "../services/api";

/** Prefer rear camera on touch/mobile when enrolling someone else. */
function getDefaultFacingMode() {
  if (typeof window === "undefined") return "user";
  const coarse =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  const narrow =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 768px)").matches;
  return coarse || narrow ? "environment" : "user";
}

function BtnSpinner({ className = "h-4 w-4" }) {
  return (
    <Loader2 className={`${className} shrink-0 animate-spin`} aria-hidden />
  );
}

/**
 * Admin-only face enrollment via live webcam (not file/gallery upload).
 * Capture frame in-browser → descriptor + still → POST /api/staff/:id/face.
 */
const FaceEnrollmentModal = ({ staff, isOpen, onClose, onSaved }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const facingModeRef = useRef(getDefaultFacingMode());
  const pendingActionRef = useRef(null);

  const [modelsReady, setModelsReady] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [facingMode, setFacingMode] = useState(getDefaultFacingMode);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState("");
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  /** @type {[null | 'capture' | 'enroll' | 'clear' | 'camera' | 'switch' | 'retake', Function]} */
  const [pendingAction, setPendingAction] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const busy = Boolean(pendingAction);

  const beginAction = useCallback((action) => {
    if (pendingActionRef.current) return false;
    pendingActionRef.current = action;
    setPendingAction(action);
    return true;
  }, []);

  const endAction = useCallback(() => {
    pendingActionRef.current = null;
    setPendingAction(null);
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

  const revokeCapturedPreview = useCallback(() => {
    setCapturedPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) {
        URL.revokeObjectURL(prev);
      }
      return "";
    });
  }, []);

  const clearCapture = useCallback(() => {
    revokeCapturedPreview();
    setCapturedBlob(null);
    setCapturedDescriptor(null);
  }, [revokeCapturedPreview]);

  const openCameraWithFacing = useCallback(async (mode, { silentFallback = false } = {}) => {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser does not support live camera access.");
        return false;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const tryGetStream = async (facing) => {
        return navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facing },
            width: { ideal: 720 },
            height: { ideal: 540 },
          },
          audio: false,
        });
      };

      let stream;
      let usedMode = mode;
      try {
        stream = await tryGetStream(mode);
      } catch (primaryErr) {
        if (mode === "environment") {
          stream = await tryGetStream("user");
          usedMode = "user";
          if (!silentFallback) {
            setInfo("Rear camera unavailable — using front camera.");
          }
        } else {
          throw primaryErr;
        }
      }

      streamRef.current = stream;
      facingModeRef.current = usedMode;
      setFacingMode(usedMode);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
      return true;
    } catch (err) {
      const name = err?.name || "";
      if (name === "NotAllowedError" || name === "PermissionDeniedError") {
        setError(
          "Camera permission denied. Allow camera access in the browser, then try Start camera."
        );
      } else if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setError("No camera found on this device.");
      } else {
        setError("Unable to start the camera. Check permissions and try again.");
      }
      setCameraOn(false);
      return false;
    }
  }, []);

  const startCamera = useCallback(
    async ({ trackBusy = true } = {}) => {
      if (trackBusy && !beginAction("camera")) return;
      try {
        await openCameraWithFacing(facingModeRef.current);
      } finally {
        if (trackBusy) endAction();
      }
    },
    [beginAction, endAction, openCameraWithFacing]
  );

  const switchCamera = useCallback(async () => {
    if (capturedBlob) return;
    if (!beginAction("switch")) return;
    const next = facingModeRef.current === "user" ? "environment" : "user";
    setInfo("");
    try {
      await openCameraWithFacing(next);
    } finally {
      endAction();
    }
  }, [beginAction, capturedBlob, endAction, openCameraWithFacing]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let cancelled = false;
    const defaultFacing = getDefaultFacingMode();
    facingModeRef.current = defaultFacing;
    setFacingMode(defaultFacing);
    setError("");
    setInfo("");
    clearCapture();
    setModelsReady(false);
    pendingActionRef.current = null;
    setPendingAction(null);

    loadFaceModels()
      .then(() => {
        if (!cancelled) {
          setModelsReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(
            "Could not load face recognition models. Check network access to the model CDN."
          );
        }
      });

    return () => {
      cancelled = true;
      stopCamera();
      clearCapture();
      pendingActionRef.current = null;
    };
  }, [clearCapture, isOpen, staff?._id, stopCamera]);

  // Auto-start camera once models are ready and modal is open
  useEffect(() => {
    if (!isOpen || !modelsReady || cameraOn || capturedBlob) {
      return undefined;
    }

    // Avoid stacking with user-triggered busy actions; still show spinner while opening.
    startCamera({ trackBusy: true });
    return undefined;
  }, [cameraOn, capturedBlob, isOpen, modelsReady, startCamera]);

  if (!isOpen || !staff) {
    return null;
  }

  const handleCapture = async () => {
    if (!beginAction("capture")) return;

    setError("");
    setInfo("");

    if (!modelsReady) {
      setError("Face models are still loading.");
      endAction();
      return;
    }
    if (!cameraOn || !videoRef.current) {
      setError("Start the camera first.");
      endAction();
      return;
    }

    try {
      const blob = await captureVideoFrameBlob(videoRef.current);
      const descriptor = await getFaceDescriptorFromBlob(blob);

      if (!descriptor) {
        setError(
          "No face detected in the frame. Position the staff member facing the camera and try again."
        );
        return;
      }

      revokeCapturedPreview();
      setCapturedBlob(blob);
      setCapturedDescriptor(descriptor);
      setCapturedPreviewUrl(URL.createObjectURL(blob));
      setInfo("Face captured. Review the still, then Enroll — or Retake.");
    } catch (err) {
      setError(err.message || "Failed to capture frame from camera.");
    } finally {
      endAction();
    }
  };

  const handleRetake = async () => {
    if (!beginAction("retake")) return;
    setError("");
    setInfo("");
    clearCapture();
    try {
      if (!cameraOn) {
        await openCameraWithFacing(facingModeRef.current);
      }
    } finally {
      endAction();
    }
  };

  const handleEnroll = async () => {
    if (!beginAction("enroll")) return;

    if (!capturedBlob || !capturedDescriptor) {
      setError("Capture a face from the live camera before enrolling.");
      endAction();
      return;
    }

    setError("");
    setInfo("");

    try {
      const formData = new FormData();
      formData.append("face", capturedBlob, "enrollment.jpg");
      formData.append("faceDescriptor", JSON.stringify(capturedDescriptor));

      const data = await enrollStaffFace(staff._id, formData);
      setInfo(data.message || "Face enrolled.");
      clearCapture();
      onSaved?.(data.staff);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to enroll face."
      );
    } finally {
      endAction();
    }
  };

  const handleClear = async () => {
    if (pendingActionRef.current) return;
    if (
      !window.confirm(
        `Clear enrolled face data for ${staff.name}? They will no longer match at the gate.`
      )
    ) {
      return;
    }

    if (!beginAction("clear")) return;
    setError("");
    try {
      const data = await clearStaffFace(staff._id);
      setInfo(data.message || "Face enrollment cleared.");
      clearCapture();
      onSaved?.(data.staff);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear face data.");
    } finally {
      endAction();
    }
  };

  const handleClose = () => {
    if (busy) return;
    stopCamera();
    clearCapture();
    onClose();
  };

  const canEnroll =
    Boolean(capturedBlob && capturedDescriptor) && modelsReady && !busy;
  const showClear = Boolean(staff.faceEnrolled || staff.facePhotoUrl);
  const mirrorPreview = facingMode === "user";
  const iconBtnClass =
    "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-50 disabled:opacity-50";
  const primaryBtnClass =
    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50 sm:w-auto sm:min-w-[8.5rem]";
  const secondaryBtnClass =
    "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50 sm:w-auto sm:min-w-[8.5rem]";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-slate-950/50 px-0 py-0 sm:items-center sm:px-4 sm:py-6">
      <div className="flex max-h-[100dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-white shadow-xl shadow-blue-900/10 sm:max-h-[90dvh] sm:rounded-3xl pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-bold text-slate-950">Face enrollment</h2>
            <p className="mt-0.5 truncate text-sm text-slate-600">
              {staff.name} · {staff.staffId}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {showClear ? (
              <button
                type="button"
                onClick={handleClear}
                disabled={busy}
                aria-label="Delete enrolled face"
                title="Delete enrolled face"
                aria-busy={pendingAction === "clear"}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-red-200 bg-white text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {pendingAction === "clear" ? (
                  <BtnSpinner className="h-5 w-5" />
                ) : (
                  <Trash2 className="h-5 w-5" aria-hidden />
                )}
              </button>
            ) : null}
            <button
              type="button"
              onClick={handleClose}
              disabled={busy}
              aria-label="Close"
              title="Close"
              className={iconBtnClass}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <p className="text-sm text-slate-600">
            Frame face → Capture → Enroll. Live camera only.
          </p>

          {!modelsReady && !error && (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <BtnSpinner className="h-4 w-4 text-slate-500" />
              Loading face models…
            </p>
          )}

          {error && (
            <p className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </p>
          )}
          {info && (
            <p className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              {info}
            </p>
          )}

          <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={`absolute inset-0 h-full w-full object-cover ${
                mirrorPreview ? "scale-x-[-1]" : ""
              } ${capturedPreviewUrl ? "opacity-0" : "opacity-100"}`}
            />
            {capturedPreviewUrl ? (
              <img
                src={capturedPreviewUrl}
                alt={`${staff.name} live capture preview`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}

            {(pendingAction === "capture" ||
              pendingAction === "camera" ||
              pendingAction === "switch") && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-950/40">
                <BtnSpinner className="h-10 w-10 text-white" />
              </div>
            )}

            {cameraOn && !capturedBlob ? (
              <button
                type="button"
                onClick={switchCamera}
                disabled={busy}
                aria-label={
                  facingMode === "user"
                    ? "Switch to rear camera"
                    : "Switch to front camera"
                }
                title={
                  facingMode === "user"
                    ? "Switch to rear camera"
                    : "Switch to front camera"
                }
                aria-busy={pendingAction === "switch"}
                className="absolute bottom-3 right-3 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-slate-950/60 text-white backdrop-blur-sm transition hover:bg-slate-950/80 disabled:opacity-50"
              >
                {pendingAction === "switch" ? (
                  <BtnSpinner className="h-5 w-5" />
                ) : (
                  <SwitchCamera className="h-5 w-5" aria-hidden />
                )}
              </button>
            ) : null}
          </div>

          {!capturedPreviewUrl && !cameraOn && modelsReady && !busy && (
            <p className="mt-3 text-center text-xs text-slate-500">
              Camera is off. Use Start camera to begin live enrollment.
            </p>
          )}

          {(staff.faceEnrolled || staff.facePhotoUrl) && !capturedBlob && (
            <p className="mt-3 text-center text-xs text-slate-500">
              Currently enrolled
              {staff.facePhotoUrl ? " — capture again to replace." : "."}
            </p>
          )}
        </div>

        <div className="border-t border-slate-100 px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            {!cameraOn && !capturedBlob ? (
              <button
                type="button"
                disabled={busy || !modelsReady}
                onClick={() => startCamera({ trackBusy: true })}
                aria-busy={pendingAction === "camera"}
                className={primaryBtnClass}
              >
                {pendingAction === "camera" ? (
                  <>
                    <BtnSpinner />
                    Starting…
                  </>
                ) : (
                  "Start camera"
                )}
              </button>
            ) : null}

            {cameraOn && !capturedBlob ? (
              <button
                type="button"
                disabled={busy || !modelsReady}
                onClick={handleCapture}
                aria-busy={pendingAction === "capture"}
                className={primaryBtnClass}
              >
                {pendingAction === "capture" ? (
                  <>
                    <BtnSpinner />
                    Capturing…
                  </>
                ) : (
                  "Capture"
                )}
              </button>
            ) : null}

            {capturedBlob ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={handleRetake}
                  aria-busy={pendingAction === "retake"}
                  className={secondaryBtnClass}
                >
                  {pendingAction === "retake" ? (
                    <>
                      <BtnSpinner />
                      Retake…
                    </>
                  ) : (
                    "Retake"
                  )}
                </button>
                <button
                  type="button"
                  disabled={!canEnroll}
                  onClick={handleEnroll}
                  aria-busy={pendingAction === "enroll"}
                  className={primaryBtnClass}
                >
                  {pendingAction === "enroll" ? (
                    <>
                      <BtnSpinner />
                      Enrolling…
                    </>
                  ) : (
                    "Enroll"
                  )}
                </button>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceEnrollmentModal;
