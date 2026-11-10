const path = require("path");
const { v2: cloudinary } = require("cloudinary");

const hasCloudinaryConfig =
  Boolean(process.env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(process.env.CLOUDINARY_API_KEY) &&
  Boolean(process.env.CLOUDINARY_API_SECRET);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const uploadBuffer = (buffer, options = {}) =>
  new Promise((resolve, reject) => {
    if (!hasCloudinaryConfig) {
      reject(
        Object.assign(new Error("Cloudinary is not configured on the server"), {
          statusCode: 503,
        })
      );
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || "akb/faces",
        resource_type: "image",
        overwrite: options.overwrite !== false,
        ...options,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });

const deleteAsset = async (publicId, resourceType = "image") => {
  if (!hasCloudinaryConfig || !publicId) {
    return null;
  }

  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

const extensionForMime = (mimeType) => {
  const map = {
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "text/plain": "txt",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[String(mimeType || "").toLowerCase()] || "";
};

const extensionForUpload = (originalName, mimeType) => {
  const fromName = path.extname(originalName || "").toLowerCase().replace(/^\./, "");
  if (fromName && /^[a-z0-9]{1,10}$/i.test(fromName)) {
    return fromName.toLowerCase();
  }
  return extensionForMime(mimeType);
};

const sanitizeAttachmentFilename = (name) =>
  String(name || "download")
    .replace(/[/\\?%*:|"<>]/g, "_")
    .trim()
    .slice(0, 180) || "download";

const deliveryUrlForAttachment = ({
  publicId,
  resourceType = "image",
  originalName = "",
  mimeType = "",
  fallbackUrl = "",
}) => {
  if (!hasCloudinaryConfig || !publicId) {
    return fallbackUrl || "";
  }

  const type = resourceType === "raw" ? "raw" : "image";
  const options = {
    resource_type: type,
    secure: true,
    type: "upload",
  };

  if (type === "raw") {
    const mime = String(mimeType || "").toLowerCase();
    const ext = extensionForUpload(originalName, mimeType);
    const isPdf =
      mime === "application/pdf" ||
      String(originalName || "")
        .toLowerCase()
        .endsWith(".pdf") ||
      ext === "pdf";

    if (!isPdf) {
      const filename = sanitizeAttachmentFilename(originalName);
      const hasExt = path.extname(filename);
      const downloadName = hasExt || !ext ? filename : `${filename}.${ext}`;
      options.flags = `attachment:${downloadName}`;
    }
  }

  try {
    return cloudinary.url(publicId, options);
  } catch {
    return fallbackUrl || "";
  }
};

module.exports = {
  cloudinary,
  deleteAsset,
  deliveryUrlForAttachment,
  extensionForUpload,
  hasCloudinaryConfig,
  uploadBuffer,
};
