import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileSpreadsheet, Download, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function ImportFromDriveModal({ onClose, onImported }) {
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    setLoadingFiles(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("googleDrive", { action: "list" });
      setFiles(res.data.files || []);
    } catch (e) {
      setError("Could not load Drive files: " + e.message);
    } finally {
      setLoadingFiles(false);
    }
  }

  async function handleImport() {
    if (!selectedFile) return;
    setImporting(true);
    setError(null);
    try {
      // Export CSV from Drive
      const res = await base44.functions.invoke("googleDrive", { action: "export", fileId: selectedFile.id });
      const rows = res.data.rows || [];
      if (rows.length === 0) {
        setError("No valid grant rows found. Make sure your sheet has a 'title' column.");
        setImporting(false);
        return;
      }
      // Bulk create funding opportunities
      await base44.entities.FundingOpportunities.bulkCreate(rows);
      setResult({ count: rows.length, fileName: selectedFile.name });
    } catch (e) {
      setError("Import failed: " + e.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <FileSpreadsheet size={16} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Import from Google Drive</h2>
              <p className="text-xs text-slate-400">Select a spreadsheet to import as funding opportunities</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5">
          {result ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <CheckCircle size={40} className="text-emerald-500" />
              <div>
                <p className="font-semibold text-slate-800">Import Successful!</p>
                <p className="text-sm text-slate-500 mt-1">
                  Added <span className="font-bold text-indigo-600">{result.count}</span> funding opportunities from <span className="font-medium">"{result.fileName}"</span>
                </p>
              </div>
              <button
                onClick={() => { onImported(); onClose(); }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* File list */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Your Spreadsheets</span>
                  <button onClick={loadFiles} className="text-slate-400 hover:text-slate-600 transition-colors">
                    <RefreshCw size={13} />
                  </button>
                </div>

                {loadingFiles ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-slate-400">
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm">Loading files…</span>
                  </div>
                ) : files.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-6">No spreadsheets found in your Drive.</p>
                ) : (
                  <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                    {files.map(file => (
                      <button
                        key={file.id}
                        onClick={() => setSelectedFile(file)}
                        className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                          selectedFile?.id === file.id
                            ? "border-indigo-400 bg-indigo-50"
                            : "border-slate-200 hover:border-slate-300 bg-white"
                        }`}
                      >
                        <FileSpreadsheet size={15} className={selectedFile?.id === file.id ? "text-indigo-500" : "text-green-500"} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
                          <p className="text-xs text-slate-400">{new Date(file.modifiedTime).toLocaleDateString()}</p>
                        </div>
                        {selectedFile?.id === file.id && (
                          <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Column hint */}
              <div className="mb-4 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-xs text-slate-500">
                <span className="font-semibold text-slate-600">Expected columns:</span> title, provider_name, type, value_amount, deadline, description, application_url, target_sectors, accepts_robotics_teams
              </div>

              <button
                onClick={handleImport}
                disabled={!selectedFile || importing}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-3 text-sm font-semibold text-white transition-colors"
              >
                {importing ? (
                  <><Loader2 size={15} className="animate-spin" /> Importing…</>
                ) : (
                  <><Download size={15} /> Import Selected Sheet</>
                )}
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}