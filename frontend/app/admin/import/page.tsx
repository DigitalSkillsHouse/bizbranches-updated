"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileJson, Loader2, CheckCircle2, XCircle } from "lucide-react";

const FILES = [
  { key: "categories", label: "Categories (categories.json)", required: false },
  { key: "cities", label: "Cities (cities.json)", required: false },
  { key: "businesses", label: "Businesses (businesses.json)", required: false },
  { key: "reviews", label: "Reviews (reviews.json)", required: false },
  { key: "users", label: "Users (users.json)", required: false },
] as const;

export default function AdminImportPage() {
  const [secret, setSecret] = useState("");
  const [files, setFiles] = useState<Record<string, File | null>>({
    categories: null,
    cities: null,
    businesses: null,
    reviews: null,
    users: null,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message?: string; stats?: Record<string, number>; files_saved?: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (key: string, file: File | null) => {
    setFiles((prev) => ({ ...prev, [key]: file }));
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) {
      setError("Admin secret is required.");
      return;
    }
    const hasAny = Object.values(files).some(Boolean);
    if (!hasAny) {
      setError("Upload at least one JSON file.");
      return;
    }

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
            Import MongoDB data to MySQL
          </CardTitle>
          <CardDescription>
            Upload exported JSON files to import categories, cities, businesses, reviews, and users into the SQL database. Tables must already exist (run the SQL migration in phpMyAdmin first).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="secret">Admin secret</Label>
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
              <Label>JSON files (upload one or more)</Label>
              {FILES.map(({ key, label }) => (
                <div key={key} className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => onFileChange(key, e.target.files?.[0] ?? null)}
                    className="flex-1"
                  />
                  {files[key] && (
                    <span className="text-sm text-muted-foreground truncate max-w-[180px]">
                      {files[key]?.name}
                    </span>
                  )}
                </div>
              ))}
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
                  <div className="space-y-1">
                    <p>{result.message}</p>
                    {result.ok && result.stats && (
                      <pre className="text-xs mt-2 p-2 bg-muted rounded overflow-auto">
                        {JSON.stringify(result.stats, null, 2)}
                      </pre>
                    )}
                    {result.ok && result.files_saved && result.files_saved.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Files saved: {result.files_saved.join(", ")}
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Start import
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
