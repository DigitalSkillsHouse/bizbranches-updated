"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileJson, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface FileEntry {
  key: string;
  label: string;
  file: string;
  table: string;
  requiredFields: string[];
  forbiddenFields: string[];
}

const FILES: FileEntry[] = [
  { key: "categories", label: "Categories", file: "categories.json", table: "categories + subcategories", requiredFields: ["name"], forbiddenFields: ["category", "phone", "address"] },
  { key: "cities", label: "Cities", file: "cities.json", table: "cities", requiredFields: ["name"], forbiddenFields: ["category", "phone", "address", "rating"] },
  { key: "businesses", label: "Businesses", file: "businesses.json", table: "businesses", requiredFields: ["name", "slug", "category", "city"], forbiddenFields: [] },
  { key: "reviews", label: "Reviews", file: "reviews.json", table: "reviews", requiredFields: ["businessId", "rating"], forbiddenFields: ["category", "city", "slug"] },
  { key: "users", label: "Users", file: "users.json", table: "users", requiredFields: ["name"], forbiddenFields: ["category", "city", "businessId", "rating"] },
];

type ValidationResult = { valid: true } | { valid: false; reason: string };

async function validateFileForSlot(file: File, entry: FileEntry): Promise<ValidationResult> {
  try {
    const text = await file.slice(0, 50000).text();
    let arr: unknown[];
    try {
      const full = text.endsWith("]") ? text : text + "]";
      arr = JSON.parse(full);
    } catch {
      try {
        const bracketIdx = text.indexOf("},{");
        if (bracketIdx < 0) return { valid: false, reason: "Not valid JSON" };
        const partial = text.substring(0, bracketIdx + 1) + "]";
        arr = JSON.parse(partial);
      } catch {
        return { valid: false, reason: "Not valid JSON" };
      }
    }
    if (!Array.isArray(arr) || arr.length === 0) return { valid: false, reason: "Empty array" };

    const first = arr[0] as Record<string, unknown>;
    const keys = Object.keys(first);

    for (const req of entry.requiredFields) {
      if (!keys.includes(req)) {
        return { valid: false, reason: `Missing required field "${req}". This doesn't look like ${entry.label} data.` };
      }
    }
    for (const forbidden of entry.forbiddenFields) {
      if (keys.includes(forbidden)) {
        return { valid: false, reason: `Found unexpected field "${forbidden}". This looks like a different collection — not ${entry.label}.` };
      }
    }
    return { valid: true };
  } catch {
    return { valid: false, reason: "Could not read file" };
  }
}

export default function AdminImportPage() {
  const [secret, setSecret] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({
    categories: null, cities: null, businesses: null, reviews: null, users: null,
  });
  const [validations, setValidations] = useState<Record<string, ValidationResult | null>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message?: string;
    stats?: Record<string, number>;
    files_saved?: string[];
    collections_imported?: string[];
    errors?: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = useCallback(async (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setResult(null);
    setError(null);

    if (!file) {
      setValidations((prev) => ({ ...prev, [key]: null }));
      return;
    }

    const entry = FILES.find((f) => f.key === key)!;
    const vResult = await validateFileForSlot(file, entry);
    setValidations((prev) => ({ ...prev, [key]: vResult }));
  }, []);

  const hasValidationErrors = Object.entries(validations).some(
    ([key, v]) => files[key] && v && !v.valid
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) { setError("Admin secret is required."); return; }
    const hasAny = Object.values(files).some(Boolean);
    if (!hasAny) { setError("Upload at least one JSON file."); return; }
    if (hasValidationErrors) { setError("Fix validation errors before importing."); return; }

    setLoading(true);
    setResult(null);
    setError(null);

    const formData = new FormData();
    formData.append("admin_secret", secret.trim());
    FILES.forEach(({ key }) => {
      const file = files[key];
      if (file) formData.append(key, file);
    });

    try {
      const res = await fetch("/api/admin/import-mongodb", {
        method: "POST",
        headers: { "X-Admin-Secret": secret.trim() },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setResult({
          ok: true,
          message: data.message ?? "Import completed",
          stats: data.stats ?? {},
          files_saved: data.files_saved ?? [],
          collections_imported: data.collections_imported ?? [],
          errors: data.errors ?? [],
        });
      } else {
        setResult({ ok: false, message: data.error ?? `Error ${res.status}` });
        setError(data.error ?? res.statusText);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setError(msg);
      setResult({ ok: false, message: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Import MongoDB Data to MySQL
          </CardTitle>
          <CardDescription>
            Upload your MongoDB-exported JSON files. Each file is validated before import to make sure it goes into the correct table.
            Uses ON DUPLICATE KEY UPDATE — existing records are updated, not duplicated.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="secret">Admin Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Your ADMIN_SECRET from server .env"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                autoComplete="off"
                className="font-mono"
              />
            </div>

            <div className="space-y-4">
              <Label>JSON Files (upload one or more)</Label>
              <p className="text-xs text-muted-foreground">
                Import order: Categories → Cities → Businesses → Reviews → Users.
                Upload businesses together with (or after) categories/cities for best results.
              </p>

              {FILES.map(({ key, label, file, table }) => {
                const v = validations[key];
                const hasFile = !!files[key];
                const isValid = v?.valid === true;
                const isInvalid = hasFile && v && !v.valid;

                return (
                  <div
                    key={key}
                    className={`rounded-lg border p-3 space-y-2 ${
                      isInvalid ? "border-red-400 bg-red-50 dark:bg-red-950/20" :
                      isValid ? "border-green-400 bg-green-50 dark:bg-green-950/20" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{label}</span>
                      <span className="text-xs text-muted-foreground">{file} → {table}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        type="file"
                        accept=".json,application/json"
                        onChange={(e) => onFileChange(key, e.target.files?.[0] ?? null)}
                        className="flex-1"
                      />
                      {isValid && <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />}
                      {isInvalid && <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />}
                    </div>
                    {isInvalid && v && !v.valid && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {v.reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {result && (
              <Alert variant={result.ok ? "default" : "destructive"}>
                {result.ok ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">{result.message}</p>
                    {result.ok && result.stats && (
                      <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                        {JSON.stringify(result.stats, null, 2)}
                      </pre>
                    )}
                    {result.ok && result.files_saved && result.files_saved.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Files saved: {result.files_saved.join(", ")}
                      </p>
                    )}
                    {result.ok && result.collections_imported && result.collections_imported.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Collections imported: {result.collections_imported.join(", ")}
                      </p>
                    )}
                    {result.errors && result.errors.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-red-600">Errors during import:</p>
                        <ul className="text-xs text-red-600 list-disc pl-4 mt-1 max-h-40 overflow-auto">
                          {result.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading || hasValidationErrors} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing… (large files may take a few minutes)
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Start Import
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
