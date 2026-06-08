import { useEffect, useState } from "react";

const emptyForm = {
  name: "",
  email: "",
  staffId: "",
  password: "",
  department: "",
  position: "",
  role: "staff",
};

const StaffFormModal = ({
  staff,
  isOpen,
  onClose,
  onSubmit,
  saving,
  currentUserId,
}) => {
  const [formData, setFormData] = useState(emptyForm);
  const isEdit = Boolean(staff);
  const isSelf = isEdit && staff?._id === currentUserId;

  useEffect(() => {
    if (staff) {
      setFormData({
        name: staff.name || "",
        email: staff.email || "",
        staffId: staff.staffId || "",
        password: "",
        department: staff.department || "",
        position: staff.position || "",
        role: staff.role || "staff",
      });
    } else {
      setFormData(emptyForm);
    }
  }, [staff, isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData, isEdit);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
        <h2 className="text-xl font-bold text-slate-950">
          {isEdit ? "Edit Staff Member" : "Create Staff Account"}
        </h2>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name" className="text-sm font-medium text-slate-700">
              Full name
            </label>
            <input
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none focus:border-blue-600"
              placeholder="staff@example.com"
            />
          </div>

          {!isEdit && (
            <div>
              <label
                htmlFor="staffId"
                className="text-sm font-medium text-slate-700"
              >
                Staff ID
              </label>
              <input
                id="staffId"
                name="staffId"
                required
                value={formData.staffId}
                onChange={handleChange}
                className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 uppercase text-slate-950 outline-none focus:border-blue-600"
              />
            </div>
          )}

          <div>
            <label
              htmlFor="department"
              className="text-sm font-medium text-slate-700"
            >
              Department
            </label>
            <input
              id="department"
              name="department"
              required
              value={formData.department}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label
              htmlFor="position"
              className="text-sm font-medium text-slate-700"
            >
              Position
            </label>
            <input
              id="position"
              name="position"
              required
              value={formData.position}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label htmlFor="role" className="text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              disabled={isSelf}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none focus:border-blue-600 disabled:bg-slate-100"
            >
              <option value="staff">Staff</option>
              <option value="hr">HR</option>
              <option value="admin">Admin</option>
            </select>
            <p className="mt-1 text-xs text-slate-500">
              {isSelf
                ? "You cannot change your own role."
                : "HR and admin users can access the management panel. Staff use the learning dashboard only."}
            </p>
          </div>

          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-slate-700"
            >
              {isEdit ? "New password (optional)" : "Password"}
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required={!isEdit}
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : isEdit ? "Save changes" : "Create staff"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffFormModal;
