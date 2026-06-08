import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import MaterialFormModal from "../components/MaterialFormModal";
import { useAuth } from "../context/AuthContext";
import PanelLayout from "../layouts/PanelLayout";
import courses from "../courses";
import {
  createMaterial,
  deleteMaterial,
  listMaterials,
  updateMaterial,
} from "../services/api";

const MaterialsManagementPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = {};
      if (statusFilter) {
        params.status = statusFilter;
      }
      const data = await listMaterials(params);
      setMaterials(data.materials || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load materials.");
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const openCreateModal = () => {
    setEditingMaterial(null);
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingMaterial(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingMaterial(null);
  };

  const handleFormSubmit = async (payload, isEdit) => {
    setSaving(true);
    setError("");

    try {
      if (isEdit) {
        await updateMaterial(editingMaterial._id, payload);
      } else {
        await createMaterial(payload);
      }
      closeModal();
      fetchMaterials();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save material.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteMaterial(item._id);
      fetchMaterials();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete material.");
    }
  };

  return (
    <PanelLayout title="Learning Materials">
      {!isAdmin && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access. Administrators can add, edit, and remove
          uploaded materials.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-950">Built-in courses</h2>
        <p className="mt-1 text-sm text-slate-600">
          Chapter content is managed in the frontend course folders. Staff access
          these from the home page and courses list.
        </p>
        <ul className="mt-4 divide-y divide-slate-100">
          {courses.map((course) => (
            <li
              key={course.id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-semibold text-slate-950">{course.title}</p>
                <p className="text-sm text-slate-600">{course.shortDescription}</p>
              </div>
              <Link
                to={`/courses/${course.id}`}
                className="text-sm font-semibold text-blue-700 hover:text-blue-800"
              >
                View course →
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Uploaded materials</h2>
            <p className="mt-1 text-sm text-slate-600">
              Supplementary resources stored in the database
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Add material
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600"
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">
              Loading materials...
            </p>
          ) : materials.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No uploaded materials yet.
              {isAdmin ? " Add one to publish supplementary content." : ""}
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Title</th>
                  <th className="pb-3 pr-4 font-medium">Category</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  <th className="pb-3 pr-4 font-medium">File</th>
                  {isAdmin && (
                    <th className="pb-3 font-medium text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {materials.map((item) => (
                  <tr
                    key={item._id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 pr-4">
                      <p className="font-medium text-slate-950">{item.title}</p>
                      {item.description && (
                        <p className="mt-0.5 line-clamp-2 text-slate-600">
                          {item.description}
                        </p>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{item.category}</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          item.status === "published"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      {item.file?.url ? (
                        <a
                          href={item.file.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-semibold text-blue-700 hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {isAdmin && (
        <MaterialFormModal
          material={editingMaterial}
          isOpen={modalOpen}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
          saving={saving}
        />
      )}
    </PanelLayout>
  );
};

export default MaterialsManagementPage;
