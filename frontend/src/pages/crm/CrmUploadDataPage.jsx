import { useCallback, useEffect, useState } from "react";
import { FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from "xlsx";

import { nigerianStates } from "../../constants/crm";
import PanelLayout from "../../layouts/PanelLayout";
import { capitalizeWords } from "../../utils/textFormat";
import { importSchools, listSchools } from "../../services/api";

const COLUMN_ALIASES = {
  schoolName: [
    "name of school",
    "school name",
    "name",
    "school",
  ],
  address: ["address", "school address"],
  state: ["state"],
  phoneNumber: [
    "school telephone number",
    "telephone number",
    "phone number",
    "phone",
    "school phone",
  ],
};

const normalizeHeader = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const mapRowToSchool = (row) => {
  const normalizedRow = {};

  Object.entries(row).forEach(([key, value]) => {
    normalizedRow[normalizeHeader(key)] = String(value ?? "").trim();
  });

  const mapped = {};

  Object.entries(COLUMN_ALIASES).forEach(([field, aliases]) => {
    for (const alias of aliases) {
      if (normalizedRow[alias] !== undefined) {
        mapped[field] = normalizedRow[alias];
        break;
      }
    }
  });

  return mapped;
};

const parseSpreadsheetFile = async (file) => {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
  return rows.map(mapRowToSchool).filter((row) => row.schoolName || row.state || row.address);
};

const BATCH_SIZE_OPTIONS = [100, 300, 500, 1000];

const chunkRows = (rows, size) => {
  const chunks = [];

  for (let index = 0; index < rows.length; index += size) {
    chunks.push(rows.slice(index, index + size));
  }

  return chunks;
};

const CrmUploadDataPage = () => {
  const [schools, setSchools] = useState([]);
  const [previewRows, setPreviewRows] = useState([]);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [batchSize, setBatchSize] = useState(100);
  const [importProgress, setImportProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState("");

  const loadSchools = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await listSchools({
        limit: 100,
        search: search.trim() || undefined,
        state: stateFilter || undefined,
      });
      setSchools(data.schools || []);
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to load imported schools.");
      setSchools([]);
    } finally {
      setLoading(false);
    }
  }, [search, stateFilter]);

  useEffect(() => {
    loadSchools();
  }, [loadSchools]);

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setError("");
    setSuccessMessage("");
    setSelectedFileName(file.name);

    try {
      const parsedRows = await parseSpreadsheetFile(file);

      if (!parsedRows.length) {
        throw new Error(
          "No school records were found. Ensure the sheet includes columns for NAME OF SCHOOL, ADDRESS, STATE, and SCHOOL TELEPHONE NUMBER."
        );
      }

      setPreviewRows(parsedRows);
      setImportProgress(0);
    } catch (parseError) {
      setPreviewRows([]);
      setImportProgress(0);
      setError(parseError.response?.data?.message || parseError.message || "Failed to read the selected file.");
    } finally {
      event.target.value = "";
    }
  };

  const remainingRows = Math.max(previewRows.length - importProgress, 0);
  const nextBatchRows = previewRows.slice(importProgress, importProgress + batchSize);
  const importComplete = previewRows.length > 0 && importProgress >= previewRows.length;

  const handleImportBatch = async () => {
    if (!nextBatchRows.length) {
      setError("All records from this file have already been imported.");
      return;
    }

    setImporting(true);
    setError("");
    setSuccessMessage("");

    try {
      const result = await importSchools(nextBatchRows);
      const skippedCount = result.skipped?.length || 0;
      const importedCount = result.imported || 0;
      const insertedCount = result.inserted || 0;
      const updatedCount = result.updated || 0;
      const nextProgress = importProgress + nextBatchRows.length;
      const totalRemaining = Math.max(previewRows.length - nextProgress, 0);

      setImportProgress(nextProgress);

      const batchSummary = [
        `${importedCount} record(s) processed in this batch`,
        insertedCount ? `${insertedCount} new` : null,
        updatedCount ? `${updatedCount} updated` : null,
        skippedCount ? `${skippedCount} skipped` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      setSuccessMessage(
        totalRemaining
          ? `${batchSummary}. Progress: ${nextProgress} of ${previewRows.length}. ${totalRemaining} record(s) remaining — import the next batch when ready.`
          : `${batchSummary}. All ${previewRows.length} record(s) from this file have been processed.`
      );

      loadSchools();
    } catch (apiError) {
      setError(apiError.response?.data?.message || "Failed to import school records.");
    } finally {
      setImporting(false);
    }
  };

  const handleImportAllBatches = async () => {
    if (!previewRows.length || importComplete) {
      return;
    }

    setImporting(true);
    setError("");
    setSuccessMessage("");

    const batches = chunkRows(previewRows.slice(importProgress), batchSize);
    let processed = importProgress;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;

    try {
      for (const batch of batches) {
        const result = await importSchools(batch);
        processed += batch.length;
        totalInserted += result.inserted || 0;
        totalUpdated += result.updated || 0;
        totalSkipped += result.skipped?.length || 0;
        setImportProgress(processed);
        setSuccessMessage(
          `Importing... ${processed} of ${previewRows.length} record(s) processed.`
        );
      }

      setSuccessMessage(
        `Import complete. ${totalInserted + totalUpdated} record(s) processed (${totalInserted} new, ${totalUpdated} updated${totalSkipped ? `, ${totalSkipped} skipped` : ""}).`
      );
      loadSchools();
    } catch (apiError) {
      setError(
        apiError.response?.data?.message ||
          `Import stopped at ${processed} of ${previewRows.length}. You can continue with the next batch.`
      );
    } finally {
      setImporting(false);
    }
  };

  const handleResetImport = () => {
    setPreviewRows([]);
    setSelectedFileName("");
    setImportProgress(0);
    setSuccessMessage("");
    setError("");
  };

  return (
    <PanelLayout title="Upload Data">
      {error && (
        <p className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {successMessage && (
        <p className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </p>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-700">
              <FileSpreadsheet className="h-5 w-5" aria-hidden />
              <h2 className="text-xl font-bold text-slate-950">Import school directory</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Upload an existing Excel sheet to extract and store school details for the CRM.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50">
            <Upload className="h-4 w-4" aria-hidden />
            Select Excel file
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
              disabled={importing}
            />
          </label>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <p className="font-semibold text-slate-800">Expected columns</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>NAME OF SCHOOL</li>
            <li>ADDRESS</li>
            <li>STATE</li>
            <li>SCHOOL TELEPHONE NUMBER</li>
          </ul>
          <p className="mt-3">Supported formats: .xlsx, .xls, .csv</p>
        </div>

        {selectedFileName && (
          <p className="mt-4 text-sm text-slate-700">
            Selected file: <span className="font-semibold text-slate-950">{selectedFileName}</span>
          </p>
        )}

        {previewRows.length > 0 && (
          <div className="mt-6">
            <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Loaded {previewRows.length} record{previewRows.length === 1 ? "" : "s"}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {importComplete
                    ? "This file has been fully processed."
                    : `${remainingRows} record(s) remaining · ${importProgress} already processed`}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">Batch size</span>
                  <select
                    value={batchSize}
                    onChange={(event) => setBatchSize(Number(event.target.value))}
                    disabled={importing}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 sm:min-w-[140px]"
                  >
                    {BATCH_SIZE_OPTIONS.map((size) => (
                      <option key={size} value={size}>
                        {size} per batch
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={handleImportBatch}
                  disabled={importing || importComplete}
                  className="rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {importing
                    ? "Importing..."
                    : importComplete
                      ? "Import complete"
                      : `Import next ${Math.min(batchSize, remainingRows)}`}
                </button>

                {!importComplete && remainingRows > batchSize && (
                  <button
                    type="button"
                    onClick={handleImportAllBatches}
                    disabled={importing}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Import all remaining
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetImport}
                  disabled={importing}
                  className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Clear file
                </button>
              </div>
            </div>

            {!importComplete && (
              <div className="mb-4">
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                    style={{
                      width: `${previewRows.length ? (importProgress / previewRows.length) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Import in batches to avoid timeouts on large files (e.g. 9000+ rows).
                </p>
              </div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-4 py-3 font-medium">Name of school</th>
                    <th className="px-4 py-3 font-medium">Address</th>
                    <th className="px-4 py-3 font-medium">State</th>
                    <th className="px-4 py-3 font-medium">School telephone</th>
                  </tr>
                </thead>
                <tbody>
                  {(importComplete ? previewRows : nextBatchRows).slice(0, 10).map((row, index) => (
                    <tr key={`${row.schoolName}-${index}`} className="border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-medium text-slate-950">
                        {capitalizeWords(row.schoolName || "-")}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.address || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{row.state || "-"}</td>
                      <td className="px-4 py-3 text-slate-700">{row.phoneNumber || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(importComplete ? previewRows : nextBatchRows).length > 10 && (
              <p className="mt-2 text-xs text-slate-500">
                Showing the first 10 rows
                {importComplete ? " from this file." : " from the next batch."}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-emerald-900/5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Imported schools</h2>
            <p className="mt-1 text-sm text-slate-600">
              Schools previously uploaded into the CRM directory.
            </p>
          </div>
        </div>

        <form
          className="mt-5 grid gap-3 md:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            loadSchools();
          }}
        >
          <input
            type="search"
            placeholder="Search school, address, phone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          />
          <select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value)}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100"
          >
            <option value="">All states</option>
            {nigerianStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Apply filters
          </button>
        </form>

        <div className="mt-6 overflow-x-auto">
          {loading ? (
            <p className="py-8 text-center text-sm text-slate-600">Loading imported schools...</p>
          ) : schools.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-600">
              No schools imported yet. Upload an Excel file to get started.
            </p>
          ) : (
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 pr-4 font-medium">Name of school</th>
                  <th className="pb-3 pr-4 font-medium">Address</th>
                  <th className="pb-3 pr-4 font-medium">State</th>
                  <th className="pb-3 font-medium">School telephone</th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school) => (
                  <tr key={school._id} className="border-b border-slate-100 last:border-0">
                    <td className="py-3 pr-4 font-medium text-slate-950">
                      {capitalizeWords(school.schoolName)}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{school.address || "-"}</td>
                    <td className="py-3 pr-4 text-slate-700">{school.state}</td>
                    <td className="py-3 text-slate-700">{school.phoneNumber || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </PanelLayout>
  );
};

export default CrmUploadDataPage;
