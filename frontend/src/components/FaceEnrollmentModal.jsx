import { useCallback, useEffect, useRef, useState } from "react";

import {
  captureVideoFrameBlob,
  getFaceDescriptorFromBlob,
  loadFaceModels,
} from "../utils/faceRecognition";
import { clearStaffFace, enrollStaffFace } from "../services/api";

/**
 * Admin-only face enrollment via live webcam (not file/gallery upload).
 * Capture frame in-browser → descriptor + still → POST /api/staff/:id/face.
 */
const FaceEnrollmentModal = ({ staff, isOpen, onClose, onSaved }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [modelsReady, setModelsReady] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState("");
  const [capturedDescriptor, setCapturedDescriptor] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

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

  const startCamera = useCallback(async () => {
    setError("");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("This browser does not support live camera access.");
        return;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 540 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraOn(true);
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
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    let cancelled = false;
    setError("");
    setInfo("");
    clearCapture();
    setModelsReady(false);

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
    };
  }, [clearCapture, isOpen, staff?._id, stopCamera]);

  // Auto-start camera once models are ready and modal is open
  useEffect(() => {
    if (!isOpen || !modelsReady || cameraOn || capturedBlob) {
      return undefined;
    }

    startCamera();
    return undefined;
  }, [cameraOn, capturedBlob, isOpen, modelsReady, startCamera]);

  if (!isOpen || !staff) {
    return null;
  }

  const handleCapture = async () => {
    setError("");
    setInfo("");

    if (!modelsReady) {
      setError("Face models are still loading.");
      return;
    }
    if (!cameraOn || !videoRef.current) {
      setError("Start the camera first.");
      return;
    }

    setBusy(true);
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
      setInfo("Face captured. Review the still, then Enroll face — or Retake.");
    } catch (err) {
      setError(err.message || "Failed to capture frame from camera.");
    } finally {
      setBusy(false);
    }
  };

  const handleRetake = () => {
    setError("");
    setInfo("");
    clearCapture();
    if (!cameraOn) {
      startCamera();
    }
  };

  const handleEnroll = async () => {
    if (!capturedBlob || !capturedDescriptor) {
      setError("Capture a face from the live camera before enrolling.");
      return;
    }

    setBusy(true);
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
      setBusy(false);
    }
  };

  const handleClear = async () => {
    if (
      !window.confirm(
        `Clear enrolled face data for ${staff.name}? They will no longer match at the gate.`
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      const data = await clearStaffFace(staff._id);
      setInfo(data.message || "Face enrollment cleared.");
      clearCapture();
      onSaved?.(data.staff);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear face data.");
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    clearCapture();
    onClose();
  };

  const canEnroll =
    Boolean(capturedBlob && capturedDescriptor) && modelsReady && !busy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 px-4 py-6">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-blue-900/10">
        <h2 className="text-xl font-bold text-slate-950">Face enrollment</h2>
        <p className="mt-1 text-sm text-slate-600">
          {staff.name} · {staff.staffId}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Position staff face in the frame → Capture → Enroll. Live camera only
          (no photo from gallery).
        </p>

        {!modelsReady && !error && (
          <p className="mt-4 text-sm text-slate-500">Loading face models…</p>
        )}

        {error && (
          <p className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </p>
        )}
        {info && (
          <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {info}
          </p>
        )}

        <div className="mt-5 space-y-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-slate-200 bg-slate-950">
            <video
              ref={videoRef}
              muted
              playsInline
              autoPlay
              className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover ${
                capturedPreviewUrl ? "opacity-0" : "opacity-100"
              }`}
            />
            {capturedPreviewUrl ? (
              <img
                src={capturedPreviewUrl}
                alt={`${staff.name} live capture preview`}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : null}
          </div>

          {!capturedPreviewUrl && !cameraOn && modelsReady && (
            <p className="text-center text-xs text-slate-500">
              Camera is off. Use Start camera to begin live enrollment.
            </p>
          )}

          {(staff.faceEnrolled || staff.facePhotoUrl) && !capturedBlob && (
            <p className="text-center text-xs text-slate-500">
              Currently enrolled
              {staff.facePhotoUrl ? " — capture again to replace." : "."}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {!cameraOn ? (
              <button
                type="button"
                disabled={busy || !modelsReady}
                onClick={startCamera}
                className="rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
              >
                Start camera
              </button>
            ) : !capturedBlob ? (
              <button
                type="button"
                disabled={busy}
                onClick={stopCamera}
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Stop camera
              </button>
            ) : null}

            {!capturedBlob ? (
              <button
                type="button"
                disabled={busy || !cameraOn || !modelsReady}
                onClick={handleCapture}
                className="rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
              >
                {busy ? "Detecting…" : "Capture face"}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={handleRetake}
                className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Retake
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap justify-end gap-3">
          {staff.faceEnrolled || staff.facePhotoUrl ? (
            <button
              type="button"
              disabled={busy}
              onClick={handleClear}
              className="inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              Clear face
            </button>
          ) : null}
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Close
          </button>
          <button
            type="button"
            disabled={!canEnroll}
            onClick={handleEnroll}
            className="inline-flex items-center justify-center rounded-full bg-blue-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            {busy && capturedBlob ? "Saving…" : "Enroll face"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FaceEnrollmentModal;
