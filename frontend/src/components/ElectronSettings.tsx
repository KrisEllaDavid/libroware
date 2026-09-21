import React, { useEffect, useState } from "react";
import { REMOTE_URL, LOCAL_URL } from "../config/api";
import {
  Alert,
  Button,
  Card,
  CardBody,
  CardFooter,
  EmptyState,
  Icon,
  Input,
  PageHeader,
  cn,
} from "./ui";

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
      <div className="app-shell page">
        <EmptyState
          icon="settings"
          title="Desktop only"
          description="Connection settings are available in the Libroware desktop application."
        />
      </div>
    );
  }

  /** One selectable endpoint. A radio in substance, so it behaves like one. */
  const Option: React.FC<{
    selected: boolean;
    onSelect: () => void;
    title: string;
    detail: string;
    mono?: boolean;
  }> = ({ selected, onSelect, title, detail, mono }) => (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg border p-3.5 text-left transition-all duration-200 ease-soft active:scale-[0.995]",
        selected
          ? "border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-950/40"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-800"
      )}
    >
      {/* The control itself, not just a coloured border — a tinted panel alone
          doesn't say "chosen" the way a filled radio does. */}
      <span
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          selected
            ? "border-emerald-600 bg-emerald-600"
            : "border-gray-300 dark:border-gray-600"
        )}
        aria-hidden="true"
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </span>
        <span
          className={cn(
            "mt-0.5 block break-all text-xs text-gray-500 dark:text-gray-400",
            mono && "font-mono"
          )}
        >
          {detail}
        </span>
      </span>
    </button>
  );

  return (
    <div className="app-shell page max-w-2xl">
      <PageHeader
        icon="settings"
        eyebrow="Desktop"
        title="Connection settings"
        description="Choose which backend server this desktop app connects to. The app needs a restart after saving."
      />

      <Card>
        <CardBody className="space-y-5">
          <div role="radiogroup" aria-label="Backend server" className="space-y-2.5">
            {PRESETS.map((preset) => (
              <Option
                key={preset.value}
                selected={!useCustom && settings.apiUrl === preset.value}
                onSelect={() => handlePreset(preset.value)}
                title={preset.label}
                detail={preset.value}
                mono
              />
            ))}

            <Option
              selected={useCustom}
              onSelect={() => { setUseCustom(true); setStatus("idle"); setSaved(false); }}
              title="Custom URL"
              detail="Point the app at your own backend address"
            />
          </div>

          {useCustom && (
            <div className="animate-slide-down">
              <Input
                type="url"
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                label="Backend address"
                value={customUrl}
                onChange={(e) => { setCustomUrl(e.target.value); setStatus("idle"); setSaved(false); }}
                placeholder="http://192.168.x.x:5000/graphql"
                className="font-mono"
              />
            </div>
          )}

          <div className="rounded-lg border border-gray-200 bg-gray-50 px-3.5 py-3 dark:border-gray-700 dark:bg-gray-800/60">
            <p className="text-2xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Active endpoint
            </p>
            <p className="mt-1 break-all font-mono text-sm text-gray-800 dark:text-gray-200">
              {activeUrl}
            </p>
          </div>

          {status !== "idle" && (
            <Alert
              tone={status === "ok" ? "success" : status === "fail" ? "danger" : "info"}
            >
              {status === "testing" ? "Testing connection…" : statusMsg}
            </Alert>
          )}

          {saved && (
            <Alert tone="success" title="Saved">
              Restart Libroware for the new endpoint to take effect.
            </Alert>
          )}
        </CardBody>

        <CardFooter className="justify-end">
          <Button
            icon="refresh"
            onClick={handleTest}
            loading={status === "testing"}
          >
            Test connection
          </Button>
          <Button variant="primary" icon="check" onClick={handleSave}>
            {saved ? "Saved" : "Save and restart"}
          </Button>
        </CardFooter>
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <Icon name="info" size={13} />
        Changes take effect after restarting the application.
      </p>
    </div>
  );
};

export default ElectronSettings;
