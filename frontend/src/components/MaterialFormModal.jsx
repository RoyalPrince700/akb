import { useEffect, useState } from "react";

const emptyForm = {
  title: "",
  description: "",
  category: "General",
  audience: "staff",
  status: "draft",
  courseSlug: "",
  fileUrl: "",
};

const MaterialFormModal = ({ material, isOpen, onClose, onSubmit, saving }) => {
  const [formData, setFormData] = useState(emptyForm);
  const isEdit = Boolean(material);

  useEffect(() => {
    if (material) {
      setFormData({
        title: material.title || "",
        description: material.description || "",
        category: material.category || "General",
        audience: material.audience || "staff",
        status: material.status || "draft",
        courseSlug: material.courseSlug || "",
        fileUrl: material.file?.url || "",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [material, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      category: formData.category.trim(),
      audience: formData.audience,
      status: formData.status,
      courseSlug: formData.courseSlug.trim(),
    };

    if (formData.fileUrl.trim()) {
      payload.file = {
        url: formData.fileUrl.trim(),
        originalName: formData.title.trim(),
        fileType: "link",
      };
    }

    onSubmit(payload, isEdit);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-blue-900/10">
        <h2 className="text-xl font-bold text-slate-950">
          {isEdit ? "Edit Material" : "Add Material"}
        </h2>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="title" className="text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="title"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="text-sm font-medium text-slate-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="category"
                className="text-sm font-medium text-slate-700"
              >
                Category
              </label>
              <input
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>
            <div>
              <label
                htmlFor="courseSlug"
                className="text-sm font-medium text-slate-700"
              >
                Course slug (optional)
              </label>
              <input
                id="courseSlug"
                name="courseSlug"
                placeholder="ai-for-staff"
                value={formData.courseSlug}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="audience"
                className="text-sm font-medium text-slate-700"
              >
                Audience
              </label>
              <select
                id="audience"
                name="audience"
                value={formData.audience}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="staff">Staff</option>
                <option value="hr">HR</option>
                <option value="all">All</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="status"
                className="text-sm font-medium text-slate-700"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="fileUrl" className="text-sm font-medium text-slate-700">
              File URL (optional)
            </label>
            <input
              id="fileUrl"
              name="fileUrl"
              type="url"
              placeholder="https://..."
              value={formData.fileUrl}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-full bg-blue-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : isEdit ? "Save changes" : "Add material"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialFormModal;
