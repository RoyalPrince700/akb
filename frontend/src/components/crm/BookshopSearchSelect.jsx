import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Plus, Search } from "lucide-react";

import { listBookshops } from "../../services/api";
import { capitalizeWords } from "../../utils/textFormat";
import AddBookshopModal from "./AddBookshopModal";
import { formatSchoolLocation } from "./SchoolSearchSelect";

const matchesBookshopSearch = (bookshop, searchTerm) => {
  const query = searchTerm.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return [bookshop.bookshopName, bookshop.address, bookshop.state, bookshop.phoneNumber]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
};

const RECENT_BOOKSHOPS_KEY = "akb_recent_bookshops";

const getBookshopKey = (bookshop) =>
  bookshop?._id ||
  `${bookshop?.bookshopName || ""}|${bookshop?.state || ""}|${bookshop?.address || ""}`.toLowerCase();

const loadRecentBookshops = () => {
  try {
    const stored = sessionStorage.getItem(RECENT_BOOKSHOPS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentBookshops = (bookshops) => {
  try {
    sessionStorage.setItem(RECENT_BOOKSHOPS_KEY, JSON.stringify(bookshops.slice(0, 25)));
  } catch (error) {
    console.warn("[BookshopSearchSelect] Could not persist recent bookshops", error);
  }
};

const mergeBookshopOptions = (primary = [], secondary = []) => {
  const merged = new Map();

  [...primary, ...secondary].forEach((bookshop) => {
    const key = getBookshopKey(bookshop);
    if (key) {
      merged.set(key, bookshop);
    }
  });

  return Array.from(merged.values());
};

const BookshopSearchSelect = ({
  id,
  name,
  value,
  onChange,
  onSchoolSelect,
  placeholder = "Search bookshop name...",
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
  const [savedBookshops, setSavedBookshops] = useState(() => loadRecentBookshops());
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [searchError, setSearchError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const rememberBookshop = (bookshop) => {
    if (!bookshop?.bookshopName) {
      return;
    }

    setSavedBookshops((current) => {
      const next = mergeBookshopOptions([bookshop], current);
      saveRecentBookshops(next);
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

      try {
        const data = await listBookshops(params);
        const bookshops = data.bookshops || [];

        if (active) {
          setOptions(bookshops);
        }
      } catch (error) {
        const message =
          error.response?.data?.message ||
          error.message ||
          "Could not load bookshops from the server.";

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
    const merged = mergeBookshopOptions(options, savedBookshops);
    const filtered = merged.filter((bookshop) => matchesBookshopSearch(bookshop, searchTerm));

    return filtered.sort((left, right) =>
      (left.bookshopName || "").localeCompare(right.bookshopName || "", undefined, {
        sensitivity: "base",
      })
    );
  }, [options, savedBookshops, searchTerm]);

  const applyBookshopSelection = (bookshop) => {
    const bookshopName = capitalizeWords(bookshop.bookshopName || "");
    setSearchTerm(bookshopName);
    onChange(bookshopName);
    onSchoolSelect?.({
      ...bookshop,
      schoolName: bookshopName,
      address: capitalizeWords(bookshop.address || ""),
      location: formatSchoolLocation(bookshop),
    });
    rememberBookshop(bookshop);
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

  const handleBookshopAdded = (bookshop, message) => {
    rememberBookshop(bookshop);
    setRefreshKey((current) => current + 1);
    setAddMessage(message || "Bookshop added to the directory.");
    setSearchError("");
    applyBookshopSelection(bookshop);
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

        {addMessage && <p className="mt-1 text-xs text-emerald-700">{addMessage}</p>}

        <button
          type="button"
          onClick={handleOpenAddModal}
          disabled={disabled}
          className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800 disabled:opacity-70"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Bookshop not listed? Add new bookshop
        </button>

        {open && !disabled && (
          <div
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white py-2 shadow-xl shadow-slate-900/10"
          >
            {loading ? (
              <p className="px-4 py-3 text-sm text-slate-500">Searching bookshops...</p>
            ) : searchError ? (
              <p className="px-4 py-3 text-sm text-red-700">{searchError}</p>
            ) : visibleOptions.length === 0 ? (
              <p className="px-4 py-3 text-sm text-slate-500">
                {searchTerm.trim()
                  ? "No bookshops match this search."
                  : "Start typing to search bookshops."}
              </p>
            ) : (
              visibleOptions.map((bookshop) => (
                <button
                  key={bookshop._id || getBookshopKey(bookshop)}
                  type="button"
                  role="option"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => applyBookshopSelection(bookshop)}
                  className="block w-full px-4 py-3 text-left transition hover:bg-emerald-50"
                >
                  <p className="text-sm font-semibold text-slate-950">
                    {capitalizeWords(bookshop.bookshopName)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {[formatSchoolLocation(bookshop), bookshop.phoneNumber]
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
                Add new bookshop
              </button>
            </div>
          </div>
        )}
      </div>

      <AddBookshopModal
        isOpen={addModalOpen}
        initialBookshopName={searchTerm}
        onClose={() => setAddModalOpen(false)}
        onBookshopAdded={handleBookshopAdded}
      />
    </>
  );
};

export default BookshopSearchSelect;
