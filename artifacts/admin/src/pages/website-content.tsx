import { Shell } from "@/components/layout/Shell";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, Globe, Loader2 } from "lucide-react";

const API_BASE = "/api";

interface ContentBlock {
  key: string;
  label: string;
  value: string;
  section: string;
}

const SECTION_LABELS: Record<string, string> = {
  hero: "Hero Section",
  about: "About Section",
  footer: "Footer",
  contact: "Contact Information",
  general: "General",
};

export default function WebsiteContent() {
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState<string | null>(null);
  const [editingValues, setEditingValues] = useState<Record<string, string>>({});

  const fetchContent = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/website-content`);
      if (res.ok) {
        const data = await res.json();
        setBlocks(data);
        const vals: Record<string, string> = {};
        data.forEach((b: ContentBlock) => { vals[b.key] = b.value; });
        setEditingValues(vals);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const saveBlock = async (block: ContentBlock) => {
    const newValue = editingValues[block.key] ?? block.value;
    try {
      const res = await fetch(`${API_BASE}/admin/website-content/${block.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      });
      if (res.ok) {
        setSaved(block.key);
        setTimeout(() => setSaved(null), 2000);
        setBlocks((prev) => prev.map((b) => b.key === block.key ? { ...b, value: newValue } : b));
      }
    } catch {}
  };

  const saveAll = async () => {
    const promises = blocks.map((block) => {
      const newValue = editingValues[block.key] ?? block.value;
      return fetch(`${API_BASE}/admin/website-content/${block.key}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      });
    });
    await Promise.all(promises);
    setSaved("all");
    setTimeout(() => setSaved(null), 2000);
    setBlocks((prev) => prev.map((b) => ({ ...b, value: editingValues[b.key] ?? b.value })));
  };

  const grouped = blocks.reduce<Record<string, ContentBlock[]>>((acc, block) => {
    if (!acc[block.section]) acc[block.section] = [];
    acc[block.section].push(block);
    return acc;
  }, {});

  if (loading) {
    return (
      <Shell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-8 pb-10">
        <div className="flex items-start justify-between flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
              <Globe className="w-8 h-8" /> Website Content
            </h1>
            <p className="text-muted-foreground mt-1">
              Edit the text content displayed on the customer-facing website.
              Changes apply immediately.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {saved && (
              <div className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                <CheckCircle2 className="w-4 h-4" />
                {saved === "all" ? "All saved!" : "Saved!"}
              </div>
            )}
            <Button
              onClick={saveAll}
              className="bg-primary hover:bg-primary/90 font-bold shadow"
            >
              Save All Changes
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
          <Globe className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              Website Only
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
              These text blocks appear only on the website (not the app).
              Edit each section below and click Save to update the website.
            </p>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(grouped).map(([section, items]) => (
            <section key={section} className="bg-card border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">
                  {SECTION_LABELS[section] || section}
                </h2>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
                  {items.length} fields
                </span>
              </div>
              <div className="p-6 space-y-5">
                {items.map((block) => (
                  <div key={block.key} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                    <div className="md:col-span-1">
                      <label className="font-semibold text-sm text-foreground">
                        {block.label}
                      </label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Key: <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{block.key}</code>
                      </p>
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      {block.value.length > 80 ? (
                        <Textarea
                          value={editingValues[block.key] ?? block.value}
                          onChange={(e) =>
                            setEditingValues((prev) => ({ ...prev, [block.key]: e.target.value }))
                          }
                          rows={3}
                          className="flex-1 text-sm"
                        />
                      ) : (
                        <Input
                          value={editingValues[block.key] ?? block.value}
                          onChange={(e) =>
                            setEditingValues((prev) => ({ ...prev, [block.key]: e.target.value }))
                          }
                          className="flex-1 text-sm"
                        />
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-primary hover:bg-primary/10 h-9"
                        onClick={() => saveBlock(block)}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Shell>
  );
}
