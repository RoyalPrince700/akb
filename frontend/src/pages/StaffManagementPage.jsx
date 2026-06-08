import { useCallback, useEffect, useState } from "react";

import StaffFormModal from "../components/StaffFormModal";
import { useAuth } from "../context/AuthContext";
import PanelLayout from "../layouts/PanelLayout";
import {
  createStaffMember,
  deleteStaffMember,
  listStaff,
  updateStaffMember,
  updateStaffStatus,
} from "../services/api";

const StaffManagementPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [staff, setStaff] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = { page, limit: 10 };
      if (search.trim()) params.search = search.trim();
      if (department.trim()) params.department = department.trim();
      if (statusFilter !== "") params.isActive = statusFilter;
      if (isAdmin && roleFilter) params.role = roleFilter;

      const data = await listStaff(params);
      setStaff(data.staff);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load staff.");
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [department, isAdmin, page, roleFilter, search, statusFilter]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    fetchStaff();
  };

  const openCreateModal = () => {
    setEditingStaff(null);
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingStaff(member);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingStaff(null);
  };

  const handleFormSubmit = async (formData, isEdit) => {
    setSaving(true);
    setError("");

    try {
      if (isEdit) {
        const payload = {
          name: formData.name,
          email: formData.email,
          department: formData.department,
          position: formData.position,
          role: formData.role,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await updateStaffMember(editingStaff._id, payload);
      } else {
        await createStaffMember({
          name: formData.name,
          email: formData.email,
          staffId: formData.staffId,
          password: formData.password,
          department: formData.department,
          position: formData.position,
          role: formData.role,
        });
      }
      closeModal();
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save staff member.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (member) => {
    if (!window.confirm(
      `Are you sure you want to ${member.isActive ? "deactivate" : "activate"} ${member.name}?`
    )) {
      return;
    }

    try {
      await updateStaffStatus(member._id, !member.isActive);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update staff status.");
    }
  };

  const handleDelete = async (member) => {
    if (!window.confirm(`Delete ${member.name}? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteStaffMember(member._id);
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete staff member.");
    }
  };

  return (
    <PanelLayout title="Staff Management">
      {!isAdmin && (
        <p className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You have read-only access. Only administrators can create, edit,
          activate, deactivate, or delete staff accounts.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {isAdmin ? "All users" : "All staff"}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {pagination.total} user{pagination.total !== 1 ? "s" : ""}
            </p>
          </div>
          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
            >
              Add user
            </button>
          )}
        </div>

        <form
          className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={handleSearchSubmit}
        >
          <input
            type="search"
            placeholder="Search name, ID, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600 sm:col-span-2"
          />
          <input
            type="text"
            placeholder="Filter by department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600"
          />
          {isAdmin && (
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600"
            >
              <option value="">All roles</option>
              <option value="staff">Staff</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>
          )}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-blue-600"
          >
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button
            type="submit"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 lg:col-span-5 lg:w-fit"
          >
            Apply filters
          </button>
        </form>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">
              Loading staff...
            </p>
          ) : staff.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No staff members found.
            </p>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Name</th>
                  <th className="pb-3 pr-4 font-medium">Staff ID</th>
                  <th className="pb-3 pr-4 font-medium">Department</th>
                  <th className="pb-3 pr-4 font-medium">Position</th>
                  <th className="pb-3 pr-4 font-medium">Role</th>
                  <th className="pb-3 pr-4 font-medium">Status</th>
                  {isAdmin && (
                    <th className="pb-3 font-medium text-right">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {staff.map((member) => (
                  <tr
                    key={member._id}
                    className="border-b border-slate-100 last:border-0"
                  >
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {member.name}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{member.staffId}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {member.department}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {member.position}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                          member.role === "admin"
                            ? "bg-amber-100 text-amber-900"
                            : member.role === "hr"
                              ? "bg-violet-100 text-violet-900"
                              : "bg-blue-100 text-blue-900"
                        }`}
                      >
                        {member.role || "staff"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          member.isActive !== false
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {member.isActive !== false ? "Active" : "Inactive"}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(member)}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(member)}
                            disabled={member._id === user?._id}
                            className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {member.isActive !== false
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(member)}
                            disabled={member._id === user?._id}
                            className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
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

        {pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {pagination.page} of {pagination.pages}
            </span>
            <button
              type="button"
              disabled={page >= pagination.pages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {isAdmin && (
        <StaffFormModal
          staff={editingStaff}
          isOpen={modalOpen}
          onClose={closeModal}
          onSubmit={handleFormSubmit}
          saving={saving}
          currentUserId={user?._id}
        />
      )}
    </PanelLayout>
  );
};

export default StaffManagementPage;
