import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";

import useCaretSafeCapitalize from "../../hooks/useCaretSafeCapitalize";
import { listIndividuals } from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";
import AddIndividualModal from "./AddIndividualModal";
import { formatSchoolLocation } from "./SchoolSearchSelect";

const matchesIndividualSearch = (individual, searchTerm) => {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [individual.individualName, individual.address, individual.state, individual.phoneNumber]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
};

const RECENT_INDIVIDUALS_KEY = "akb_recent_individuals";

const getIndividualKey = (individual) =>
  individual?._id ||
  `${individual?.individualName || ""}|${individual?.state || ""}|${individual?.address || ""}`.toLowerCase();

const loadRecentIndividuals = () => {
  try {
    const stored = sessionStorage.getItem(RECENT_INDIVIDUALS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentIndividuals = (individuals) => {
  try {
    sessionStorage.setItem(RECENT_INDIVIDUALS_KEY, JSON.stringify(individuals.slice(0, 25)));
  } catch (error) {
    console.warn("[IndividualSearchSelect] Could not persist recent individuals", error);
  }
};

const mergeIndividualOptions = (primary = [], secondary = []) => {
  const merged = new Map();

  [...primary, ...secondary].forEach((individual) => {
    const key = getIndividualKey(individual);
    if (key) {
      merged.set(key, individual);
    }
  });

  return Array.from(merged.values());
};

const IndividualSearchSelect = ({
  id,
  name,
  value,
  onChange,
  onSchoolSelect,
  placeholder = "Search individual name...",
  required = false,
  disabled = false,
  className = "",
  inputClassName = "mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-slate-950 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100",
}) => {
  const listboxId = useId();
  const containerRef = useRef(null);
  const { inputRef, capitalizeInputValue } = useCaretSafeCapitalize();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState([]);
  const [savedIndividuals, setSavedIndividuals] = useState(() => loadRecentIndividuals());
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [searchError, setSearchError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const rememberIndividual = (individual) => {
    if (!individual?.individualName) {
      return;
    }

    setSavedIndividuals((current) => {
      const next = mergeIndividualOptions([individual], current);
      saveRecentIndividuals(next);
      return next;
    });
  };

  useEffect(() => {
    // Avoid resetting the caret while the user is mid-edit.
    if (inputRef.current && document.activeElement === inputRef.current) {
      return;
    }

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

      try {
        const data = await listIndividuals(params);
        const individuals = data.individuals || [];

        if (active) {
          setOptions(individuals);
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Could not load individuals from the server.";

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
    const merged = mergeIndividualOptions(options, savedIndividuals);
    const filtered = merged.filter((individual) =>
      matchesIndividualSearch(individual, searchTerm)
    );

    return filtered.sort((left, right) =>
      (left.individualName || "").localeCompare(right.individualName || "", undefined, {
        sensitivity: "base",
      })
    );
  }, [options, savedIndividuals, searchTerm]);

  const applyIndividualSelection = (individual) => {
    const individualName = capitalizeWords(individual.individualName || "");
    setSearchTerm(individualName);
    onChange(individualName);
    onSchoolSelect?.({
      ...individual,
      schoolName: individualName,
      address: capitalizeWords(individual.address || ""),
      location: formatSchoolLocation(individual),
    });
    rememberIndividual(individual);
    setOpen(false);
  };

  const handleInputChange = (event) => {
    const nextValue = capitalizeInputValue(event.target);
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

  const handleIndividualAdded = (individual, message) => {
    rememberIndividual(individual);
    setRefreshKey((current) => current + 1);
    setAddMessage(message || "Individual added to the directory.");
    setSearchError("");
    applyIndividualSelection(individual);
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
            ref={inputRef}
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

        {addMessage && <p className="mt-1 text-xs text-emerald-700">{addMessage}</p>}

        <button
          type="button"
          onClick={handleOpenAddModal}
          disabled={disabled}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 disabled:opacity-70"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Individual not listed? Add new individual
        </button>

        {open && !disabled && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10"
          >
            {loading ? (
              <p className="px-4 py-3 text-sm text-slate-500">Searching individuals...</p>
            ) : searchError ? (
              <p className="px-4 py-3 text-sm text-red-700">{searchError}</p>
            ) : visibleOptions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">
                {searchTerm.trim()
                  ? "No individuals match this search."
                  : "Start typing to search individuals."}
              </p>
            ) : (
              visibleOptions.map((individual) => (
                <button
                  key={individual._id || getIndividualKey(individual)}
                  type="button"
                  role="option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyIndividualSelection(individual)}
                  className="block w-full px-4 py-3 text-left transition hover:bg-emerald-50"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {capitalizeWords(individual.individualName)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[formatSchoolLocation(individual), individual.phoneNumber]
                      .filter(Boolean)
                      .join(" · ")}
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
                Add new individual
              </button>
            </div>
          </div>
        )}
      </div>

      <AddIndividualModal
        isOpen={addModalOpen}
        initialIndividualName={searchTerm}
        onClose={() => setAddModalOpen(false)}
        onIndividualAdded={handleIndividualAdded}
      />
    </>
  );
};

export default IndividualSearchSelect;
