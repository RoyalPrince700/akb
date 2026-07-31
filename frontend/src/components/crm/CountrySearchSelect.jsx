import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";

import useCaretSafeCapitalize from "../../hooks/useCaretSafeCapitalize";
import { listCountries } from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";
import AddCountryModal from "./AddCountryModal";

const matchesCountrySearch = (country, searchTerm) => {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return String(country.name || "")
    .toLowerCase()
    .includes(query);
};

const RECENT_COUNTRIES_KEY = "akb_recent_countries";

const getCountryKey = (country) =>
  country?._id || String(country?.name || "").toLowerCase();

const loadRecentCountries = () => {
  try {
    const stored = sessionStorage.getItem(RECENT_COUNTRIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentCountries = (countries) => {
  try {
    sessionStorage.setItem(RECENT_COUNTRIES_KEY, JSON.stringify(countries.slice(0, 25)));
  } catch {
    // Ignore storage failures (private mode, quota, etc.).
  }
};

const mergeCountryOptions = (primary = [], secondary = []) => {
  const merged = new Map();

  [...primary, ...secondary].forEach((country) => {
    const key = getCountryKey(country);
    if (key) {
      merged.set(key, country);
    }
  });

  return Array.from(merged.values());
};

const CountrySearchSelect = ({
  id,
  name,
  value,
  onChange,
  onCountrySelect,
  placeholder = "Search country...",
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
  const [savedCountries, setSavedCountries] = useState(() => loadRecentCountries());
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [searchError, setSearchError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const rememberCountry = (country) => {
    if (!country?.name) {
      return;
    }

    setSavedCountries((current) => {
      const next = mergeCountryOptions([country], current);
      saveRecentCountries(next);
      return next;
    });
  };

  useEffect(() => {
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
        const data = await listCountries(params);
        const countries = data.countries || [];

        if (active) {
          setOptions(countries);
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Could not load countries from the server.";

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
    const merged = mergeCountryOptions(options, savedCountries);
    const filtered = merged.filter((country) => matchesCountrySearch(country, searchTerm));

    return filtered.sort((left, right) =>
      (left.name || "").localeCompare(right.name || "", undefined, {
        sensitivity: "base",
      })
    );
  }, [options, savedCountries, searchTerm]);

  const applyCountrySelection = (country) => {
    const countryName = capitalizeWords(country.name || "");
    setSearchTerm(countryName);
    onChange(countryName);
    onCountrySelect?.({
      ...country,
      name: countryName,
    });
    rememberCountry(country);
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

  const handleCountryAdded = (country, message) => {
    rememberCountry(country);
    setRefreshKey((current) => current + 1);
    setAddMessage(message || "Country added to the directory.");
    setSearchError("");
    applyCountrySelection(country);
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
          Country not listed? Add new country
        </button>

        {open && !disabled && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10"
          >
            {loading ? (
              <p className="px-4 py-3 text-sm text-slate-500">Searching countries...</p>
            ) : searchError ? (
              <p className="px-4 py-3 text-sm text-red-700">{searchError}</p>
            ) : visibleOptions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">
                {searchTerm.trim()
                  ? "No countries match this search."
                  : "Start typing to search countries."}
              </p>
            ) : (
              visibleOptions.map((country) => (
                <button
                  key={getCountryKey(country)}
                  type="button"
                  role="option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyCountrySelection(country)}
                  className="block w-full px-4 py-3 text-left transition hover:bg-emerald-50"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {capitalizeWords(country.name)}
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
                Add new country
              </button>
            </div>
          </div>
        )}
      </div>

      <AddCountryModal
        isOpen={addModalOpen}
        initialCountryName={searchTerm}
        onClose={() => setAddModalOpen(false)}
        onCountryAdded={handleCountryAdded}
      />
    </>
  );
};

export default CountrySearchSelect;
