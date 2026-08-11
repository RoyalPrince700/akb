/**
 * Face matching (client-side via @vladmandic/face-api):
 * - Admin enrollment: live webcam capture → face detect → 128-d descriptor + still → store on user
 * - Security kiosk: live camera match against pre-indexed enrolled descriptors → auto punch
 * - Server stores attendance punch times only (never client clock)
 *
 * Models load once from jsDelivr CDN (never re-fetch per scan).
 *
 * Gate matching thresholds (kiosk):
 * - FACE_MATCH_THRESHOLD 0.5 — Euclidean distance max for a hit (stricter than 0.55 reduces false IDs)
 * - TinyFaceDetector inputSize 320 — latency/accuracy balance for gate webcams
 * - scoreThreshold 0.5 — drop weak detections so we do not waste a recognition pass
 *
 * Hot path: only staff with stored faceDescriptor arrays. Photo-URL re-embedding is slow
 * and must not run on the kiosk scan path.
 */

import * as faceapi from "@vladmandic/face-api";

const MODEL_URL =
  "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";

/** Max Euclidean distance for a positive match (lower = stricter). */
export const FACE_MATCH_THRESHOLD = 0.5;

/** Detector input size used by getFaceDescriptorFromInput (kiosk + enrollment). */
export const FACE_DETECTOR_INPUT_SIZE = 320;

/** Min face detection confidence before computing a descriptor. */
export const FACE_DETECTOR_SCORE_THRESHOLD = 0.5;

let modelsLoadPromise = null;

export const loadFaceModels = () => {
  if (!modelsLoadPromise) {
    modelsLoadPromise = Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]).catch((error) => {
      modelsLoadPromise = null;
      throw error;
    });
  }

  return modelsLoadPromise;
};

const detectorOptions = () =>
  new faceapi.TinyFaceDetectorOptions({
    inputSize: FACE_DETECTOR_INPUT_SIZE,
    scoreThreshold: FACE_DETECTOR_SCORE_THRESHOLD,
  });

/**
 * Staff who can be matched on the kiosk hot path (pre-stored 128-d vectors only).
 * Call once after listEnrolledFaces and reuse until enrollments refresh.
 */
export const indexMatchableStaff = (staffList = []) =>
  (Array.isArray(staffList) ? staffList : []).filter(
    (person) =>
      Array.isArray(person?.faceDescriptor) && person.faceDescriptor.length > 0
  );

export const getFaceDescriptorFromInput = async (input) => {
  await loadFaceModels();

  const detection = await faceapi
    .detectSingleFace(input, detectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection?.descriptor) {
    return null;
  }

  return Array.from(detection.descriptor);
};

export const loadImageElement = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load face image"));
    img.src = src;
  });

/** Descriptor from a Blob (e.g. live-captured JPEG frame). */
export const getFaceDescriptorFromBlob = async (blob) => {
  const objectUrl = URL.createObjectURL(blob);
  try {
    const img = await loadImageElement(objectUrl);
    return getFaceDescriptorFromInput(img);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

export const getFaceDescriptorFromFile = async (file) =>
  getFaceDescriptorFromBlob(file);

export const euclideanDistance = (a, b) => {
  if (!a?.length || !b?.length || a.length !== b.length) {
    return Number.POSITIVE_INFINITY;
  }

  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
};

/**
 * @param {number[]} queryDescriptor
 * @param {Array<{ faceDescriptor: number[], [key: string]: any }>} candidates
 * @param {number} threshold
 */
export const matchFaceDescriptor = (
  queryDescriptor,
  candidates,
  threshold = FACE_MATCH_THRESHOLD
) => {
  if (!queryDescriptor?.length || !candidates?.length) {
    return null;
  }

  let best = null;

  for (const candidate of candidates) {
    if (!candidate.faceDescriptor?.length) {
      continue;
    }

    const distance = euclideanDistance(queryDescriptor, candidate.faceDescriptor);
    if (distance <= threshold && (!best || distance < best.distance)) {
      best = {
        ...candidate,
        distance,
        confidence: Math.max(0, Math.min(1, 1 - distance)),
      };
    }
  }

  return best;
};

export const captureVideoFrameBlob = (videoEl, quality = 0.9) =>
  new Promise((resolve, reject) => {
    if (!videoEl?.videoWidth) {
      reject(new Error("Camera is not ready"));
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to capture frame"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality
    );
  });
