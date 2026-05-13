import React, { useEffect, useState } from "react";
import { REMOTE_URL, LOCAL_URL } from "../config/api";

interface Settings {
  apiUrl: string;
}

const PRESETS = [
  { label: "Production server (IP)",    value: REMOTE_URL },
  { label: "Local Docker stack",        value: LOCAL_URL  },
];

const ElectronSettings: React.FC = () => {
  const [settings, setSettings]       = useState<Settings>({ apiUrl: REMOTE_URL });
  const [customUrl, setCustomUrl]     = useState("");
  const [useCustom, setUseCustom]     = useState(false);
  const [status, setStatus]           = useState<"idle" | "testing" | "ok" | "fail">("idle");
  const [saved, setSaved]             = useState(false);
  const [statusMsg, setStatusMsg]     = useState("");

  const api = (window as any).electronAPI;

  useEffect(() => {
    if (!api) return;
    api.getSettings().then((s: Settings) => {
      setSettings(s);
      const isPreset = PRESETS.some((p) => p.value === s.apiUrl);
      if (!isPreset) {
        setUseCustom(true);
        setCustomUrl(s.apiUrl);
      }
    });
  }, []);

  const activeUrl = useCustom ? customUrl : settings.apiUrl;

  const handlePreset = (value: string) => {
    setUseCustom(false);
    setSettings((s) => ({ ...s, apiUrl: value }));
    setStatus("idle");
    setSaved(false);
  };

  const handleTest = async () => {
    setStatus("testing");
    setStatusMsg("");
    const result = await api.testConnection(activeUrl);
    if (result.ok) {
      setStatus("ok");
      setStatusMsg("Connection successful.");
    } else {
      setStatus("fail");
      setStatusMsg(result.error || `HTTP ${result.status}`);
    }
  };

  const handleSave = async () => {
    const newSettings = { ...settings, apiUrl: activeUrl };
    await api.saveSettings(newSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!api) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <p className="text-gray-500">Settings are only available in the desktop application.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <div className="max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Connection Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
          Choose which backend server this desktop app connects to. A restart is needed after saving.
        </p>

        {/* Preset buttons */}
        <div className="space-y-3 mb-6">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handlePreset(preset.value)}
              className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                !useCustom && settings.apiUrl === preset.value
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-emerald-300"
              }`}
            >
              <span className="block font-medium text-gray-800 dark:text-gray-200">{preset.label}</span>
              <span className="block text-xs text-gray-400 font-mono mt-0.5">{preset.value}</span>
            </button>
          ))}

          {/* Custom URL option */}
          <button
            onClick={() => { setUseCustom(true); setStatus("idle"); setSaved(false); }}
            className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
              useCustom
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-emerald-300"
            }`}
          >
            <span className="block font-medium text-gray-800 dark:text-gray-200">Custom URL</span>
            <span className="block text-xs text-gray-400 mt-0.5">Enter your own backend address</span>
          </button>
        </div>

        {useCustom && (
          <input
            type="url"
            value={customUrl}
            onChange={(e) => { setCustomUrl(e.target.value); setStatus("idle"); setSaved(false); }}
            placeholder="http://192.168.x.x:5000/graphql"
            className="w-full mb-6 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                       bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm
                       focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        )}

        {/* Active URL display */}
        <div className="mb-6 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
          <span className="text-xs text-gray-500 dark:text-gray-400 block">Active endpoint</span>
          <span className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">{activeUrl}</span>
        </div>

        {/* Status */}
        {status !== "idle" && (
          <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${
            status === "testing" ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400" :
            status === "ok"      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" :
                                   "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
          }`}>
            {status === "testing" ? "Testing connection…" : statusMsg}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={handleTest}
            disabled={status === "testing"}
            className="flex-1 py-2 px-4 rounded-lg border border-emerald-500 text-emerald-600
                       hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all
                       disabled:opacity-50 text-sm font-medium"
          >
            Test Connection
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700
                       text-white text-sm font-medium transition-all"
          >
            {saved ? "Saved!" : "Save & Restart"}
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400 text-center">
          Changes take effect after restarting the application.
        </p>
      </div>
    </div>
  );
};

export default ElectronSettings;
