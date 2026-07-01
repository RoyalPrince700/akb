import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";

import { listSchools } from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";
import AddSchoolModal from "./AddSchoolModal";

export const formatSchoolLocation = (school) => {
  const address = (school.address || "").trim();
  const state = (school.state || "").trim();

  if (address && state && !address.toLowerCase().includes(state.toLowerCase())) {
    return `${address}, ${state}`;
  }

  return address || state;
};

const matchesSchoolSearch = (school, searchTerm) => {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [school.schoolName, school.address, school.state, school.phoneNumber]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
};

const RECENT_SCHOOLS_KEY = "akb_recent_schools";

const getSchoolKey = (school) =>
  school?._id || `${school?.schoolName || ""}|${school?.state || ""}|${school?.address || ""}`.toLowerCase();

const loadRecentSchools = () => {
  try {
    const stored = sessionStorage.getItem(RECENT_SCHOOLS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentSchools = (schools) => {
  try {
    sessionStorage.setItem(RECENT_SCHOOLS_KEY, JSON.stringify(schools.slice(0, 25)));
  } catch (error) {
    console.warn("[SchoolSearchSelect] Could not persist recent schools", error);
  }
};

const mergeSchoolOptions = (primary = [], secondary = []) => {
  const merged = new Map();

  [...primary, ...secondary].forEach((school) => {
    const key = getSchoolKey(school);
    if (key) {
      merged.set(key, school);
    }
  });

  return Array.from(merged.values());
};

const SchoolSearchSelect = ({
  id,
  name,
  value,
  onChange,
  onSchoolSelect,
  placeholder = "Search school name...",
  required = false,
  disabled = false,
  className = "",
  inputClassName = "mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100",
}) => {
  const listboxId = useId();
  const containerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [savedSchools, setSavedSchools] = useState(() => loadRecentSchools());
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [searchError, setSearchError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const rememberSchool = (school) => {
    if (!school?.schoolName) {
      console.warn("[SchoolSearchSelect] rememberSchool skipped — missing schoolName", school);
      return;
    }

    setSavedSchools((current) => {
      const next = mergeSchoolOptions([school], current);
      saveRecentSchools(next);
      console.log("[SchoolSearchSelect] remembered school", {
        key: getSchoolKey(school),
        schoolName: school.schoolName,
        totalSaved: next.length,
      });
      return next;
    });
  };

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (!open || disabled) {
      return undefined;
    }

    let active = true;
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      setSearchError("");

      const params = {
        limit: 100,
        search: searchTerm.trim() || undefined,
      };

      console.log("[SchoolSearchSelect] fetching schools", params);

      try {
        const data = await listSchools(params);
        const schools = data.schools || [];

        console.log("[SchoolSearchSelect] fetch success", {
          searchTerm: searchTerm.trim(),
          apiCount: schools.length,
          total: data.pagination?.total,
          sample: schools.slice(0, 3).map((school) => ({
            id: school._id,
            schoolName: school.schoolName,
            state: school.state,
          })),
        });

        if (active) {
          setOptions(schools);
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Could not load schools from the server.";

        console.error("[SchoolSearchSelect] fetch failed", {
          searchTerm: searchTerm.trim(),
          message,
          status: error.response?.status,
          data: error.response?.data,
        });

        if (active) {
          setOptions([]);
          setSearchError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeoutId);
    };
  }, [disabled, open, refreshKey, searchTerm]);

  const visibleOptions = useMemo(() => {
    const merged = mergeSchoolOptions(options, savedSchools);
    const filtered = merged.filter((school) => matchesSchoolSearch(school, searchTerm));

    if (open) {
      console.log("[SchoolSearchSelect] visible options", {
        searchTerm: searchTerm.trim(),
        loading,
        searchError: searchError || null,
        apiOptions: options.length,
        savedSchools: savedSchools.length,
        merged: merged.length,
        visible: filtered.length,
        savedNames: savedSchools.map((school) => school.schoolName),
      });
    }

    return filtered.sort((left, right) =>
      (left.schoolName || "").localeCompare(right.schoolName || "", undefined, {
        sensitivity: "base",
      })
    );
  }, [loading, open, options, savedSchools, searchError, searchTerm]);

  const applySchoolSelection = (school) => {
    const schoolName = capitalizeWords(school.schoolName || "");
    setSearchTerm(schoolName);
    onChange(schoolName);
    onSchoolSelect?.({
      ...school,
      schoolName,
      address: capitalizeWords(school.address || ""),
      location: formatSchoolLocation(school),
    });
    rememberSchool(school);
    setOpen(false);
  };

  const handleInputChange = (event) => {
    const nextValue = capitalizeWords(event.target.value, { trim: false });
    setSearchTerm(nextValue);
    onChange(nextValue);
    setAddMessage("");
    setSearchError("");
    setOpen(true);
  };

  const handleOpenAddModal = () => {
    setOpen(false);
    setAddModalOpen(true);
  };

  const handleSchoolAdded = (school, message) => {
    console.log("[SchoolSearchSelect] school added from modal", {
      id: school?._id,
      schoolName: school?.schoolName,
      state: school?.state,
      address: school?.address,
      message,
    });

    rememberSchool(school);
    setRefreshKey((current) => current + 1);
    setAddMessage(message || "School added to the directory.");
    setSearchError("");
    applySchoolSelection(school);
  };

  return (
    <>
      <div ref={containerRef} className={`relative ${className}`}>
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <input
            id={id}
            name={name}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            autoComplete="off"
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            className={`${inputClassName} pl-10`}
          />
        </div>

        {addMessage && (
          <p className="mt-1 text-xs text-emerald-700">{addMessage}</p>
        )}

        <button
          type="button"
          onClick={handleOpenAddModal}
          disabled={disabled}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 disabled:opacity-70"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          School not listed? Add new school
        </button>

        {open && !disabled && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10"
          >
            {loading ? (
              <p className="px-4 py-3 text-sm text-slate-500">Searching schools...</p>
            ) : searchError ? (
              <p className="px-4 py-3 text-sm text-red-700">
                {searchError}
                <span className="mt-1 block text-xs text-red-600">
                  Check the browser console for [SchoolSearchSelect] logs. If the backend is down, restart it and confirm MongoDB is connected.
                </span>
              </p>
            ) : visibleOptions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">
                {searchTerm.trim()
                  ? "No schools match this search."
                  : "Start typing to search uploaded schools."}
              </p>
            ) : (
              visibleOptions.map((school) => (
                <button
                  key={school._id}
                  type="button"
                  role="option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applySchoolSelection(school)}
                  className="block w-full px-4 py-3 text-left transition hover:bg-emerald-50"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {capitalizeWords(school.schoolName)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[formatSchoolLocation(school), school.phoneNumber].filter(Boolean).join(" · ")}
                  </p>
                </button>
              ))
            )}

            <div className="border-t border-slate-100 px-2 pt-2">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={handleOpenAddModal}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
              >
                <Plus className="h-4 w-4 shrink-0" aria-hidden />
                Add new school
              </button>
            </div>
          </div>
        )}
      </div>

      <AddSchoolModal
        isOpen={addModalOpen}
        initialSchoolName={searchTerm}
        onClose={() => setAddModalOpen(false)}
        onSchoolAdded={handleSchoolAdded}
      />
    </>
  );
};

export default SchoolSearchSelect;
