import { Shell } from "@/components/layout/Shell";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  ImageIcon,
  Loader2,
  UploadCloud,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  Monitor,
} from "lucide-react";

const API_BASE = "/api";

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  gradStart: string;
  gradEnd: string;
  ctaLabel: string;
  ctaCat: string;
  imageUrl: string;
  active: boolean;
  sortOrder: number;
}

const CATEGORY_OPTIONS = [
  "deals",
  "burgers",
  "chicken",
  "wraps",
  "sides",
  "drinks",
  "desserts",
];

const slideSchema = z.object({
  title: z.string().min(1, "Required"),
  subtitle: z.string().min(1, "Required"),
  tag: z.string().min(1, "Required"),
  tagColor: z.string().min(1, "Required"),
  gradStart: z.string().min(1, "Required"),
  gradEnd: z.string().min(1, "Required"),
  ctaLabel: z.string().min(1, "Required"),
  ctaCat: z.string().min(1, "Required"),
  imageUrl: z.string().optional().default(""),
  active: z.boolean().default(true),
});
type SlideFormValues = z.infer<typeof slideSchema>;

export default function Banners() {
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBanner, setEditingBanner] = useState<BannerSlide | null>(null);
  const [saved, setSaved] = useState(false);
  const [bannerUrlInput, setBannerUrlInput] = useState("");

  const fetchBanners = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/banners`);
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  const form = useForm<SlideFormValues>({
    resolver: zodResolver(slideSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      tag: "",
      tagColor: "#FFD700",
      gradStart: "#1B5E20CC",
      gradEnd: "#2E7D32CC",
      ctaLabel: "",
      ctaCat: "deals",
      imageUrl: "",
      active: true,
    },
  });

  const openEdit = (b: BannerSlide) => {
    setEditingBanner(b);
    form.reset({
      title: b.title,
      subtitle: b.subtitle,
      tag: b.tag,
      tagColor: b.tagColor,
      gradStart: b.gradStart,
      gradEnd: b.gradEnd,
      ctaLabel: b.ctaLabel,
      ctaCat: b.ctaCat,
      imageUrl: b.imageUrl,
      active: b.active,
    });
  };

  const openNew = () => {
    setEditingBanner({
      id: "",
      title: "",
      subtitle: "",
      tag: "NEW",
      tagColor: "#FFD700",
      gradStart: "#1B5E20CC",
      gradEnd: "#2E7D32CC",
      ctaLabel: "Order Now",
      ctaCat: "deals",
      imageUrl: "",
      active: true,
      sortOrder: banners.length,
    });
    form.reset({
      title: "",
      subtitle: "",
      tag: "NEW",
      tagColor: "#FFD700",
      gradStart: "#1B5E20CC",
      gradEnd: "#2E7D32CC",
      ctaLabel: "Order Now",
      ctaCat: "deals",
      imageUrl: "",
      active: true,
    });
  };

  const onSubmit = async (values: SlideFormValues) => {
    if (!editingBanner) return;
    const isNew = !editingBanner.id;
    const url = isNew
      ? `${API_BASE}/admin/banners`
      : `${API_BASE}/admin/banners/${editingBanner.id}`;
    const method = isNew ? "POST" : "PATCH";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editingBanner, ...values }),
      });
      if (res.ok) {
        await fetchBanners();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {}
    setEditingBanner(null);
    form.reset();
  };

  const toggleActive = async (b: BannerSlide) => {
    try {
      await fetch(`${API_BASE}/admin/banners/${b.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !b.active }),
      });
      await fetchBanners();
    } catch {}
  };

  const deleteBanner = async (id: string) => {
    try {
      await fetch(`${API_BASE}/admin/banners/${id}`, { method: "DELETE" });
      await fetchBanners();
    } catch {}
  };

  return (
    <Shell>
      <div className="flex flex-col gap-8 pb-10">
        <div className="flex items-start justify-between flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary flex items-center gap-3">
              <Monitor className="w-8 h-8" /> Banner Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Control the home screen banner carousel on the mobile app. Changes
              sync immediately.
            </p>
          </div>
          <div className="flex gap-3 items-center">
            {saved && (
              <div className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </div>
            )}
            <Button
              onClick={openNew}
              className="bg-primary hover:bg-primary/90 font-bold shadow"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Slide
            </Button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
          <Eye className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              App Only
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-400 mt-0.5">
              Banners appear only on the mobile app. The website does not show
              banners. Upload an image URL for each slide. The CTA Category
              determines which menu section opens when customers tap the banner.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {banners.map((b, idx) => (
              <div
                key={b.id}
                className={`bg-card border rounded-2xl overflow-hidden flex flex-col transition-all hover:shadow-md ${!b.active ? "opacity-50" : ""}`}
              >
                <div
                  className="h-28 relative flex items-end p-4 overflow-hidden"
                  style={{
                    background: `linear-gradient(to right, ${b.gradStart.replace("CC", "")}, ${b.gradEnd.replace("CC", "")})`,
                  }}
                >
                  {b.imageUrl ? (
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="absolute right-2 bottom-0 h-24 w-24 object-contain"
                    />
                  ) : (
                    <div className="absolute right-4 bottom-4 w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-white/40" />
                    </div>
                  )}
                  <div className="relative z-10">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ backgroundColor: b.tagColor, color: "#FFF" }}
                    >
                      {b.tag}
                    </span>
                    <p className="text-white font-bold text-base mt-1 leading-tight line-clamp-1">
                      {b.title || "Untitled Slide"}
                    </p>
                    <p className="text-white/75 text-xs line-clamp-1">
                      {b.subtitle}
                    </p>
                  </div>
                  <div className="absolute top-2 left-2 bg-black/30 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    Slide {idx + 1}
                  </div>
                </div>

                <div className="p-4 flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      {b.ctaLabel}
                    </span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full font-medium">
                      /{b.ctaCat}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {b.active ? "Active" : "Hidden"}
                  </p>
                </div>

                <div className="border-t p-3 flex gap-2 justify-between items-center bg-muted/5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary hover:bg-primary/10 h-8"
                    onClick={() => openEdit(b)}
                  >
                    Edit
                  </Button>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 text-xs font-semibold ${b.active ? "text-muted-foreground" : "text-primary"}`}
                      onClick={() => toggleActive(b)}
                    >
                      {b.active ? "Hide" : "Show"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-destructive hover:bg-destructive/10"
                      onClick={() => deleteBanner(b.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {banners.length < 5 && (
              <button
                onClick={openNew}
                className="border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-3 p-8 text-primary/50 hover:bg-primary/5 hover:text-primary/80 transition-colors min-h-50"
              >
                <Plus className="w-10 h-10" />
                <span className="font-semibold text-sm">Add New Slide</span>
                <span className="text-xs text-center">Up to 5 banner slides</span>
              </button>
            )}
          </div>
        )}

        <Dialog
          open={!!editingBanner}
          onOpenChange={(open) => {
            if (!open) {
              setEditingBanner(null);
              form.reset();
              setBannerUrlInput("");
            }
          }}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle className="text-xl text-primary font-bold">
                {editingBanner?.id ? "Edit Slide" : "New Slide"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="overflow-y-auto flex-1 pr-1 space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-semibold">Slide Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Istanbul Zinger Burger" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="subtitle"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel className="font-semibold">Subtitle</FormLabel>
                        <FormControl>
                          <Input placeholder="Pakistan's most loved crispy burger" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tag"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Tag Label</FormLabel>
                        <FormControl>
                          <Input placeholder="HOT" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tagColor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Tag Color</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <input
                            type="color"
                            value={field.value.replace("CC", "")}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-10 h-10 rounded cursor-pointer border"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gradStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Gradient Start</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <input
                            type="color"
                            value={field.value.replace("CC", "").substring(0, 7)}
                            onChange={(e) => field.onChange(e.target.value + "CC")}
                            className="w-10 h-10 rounded cursor-pointer border"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gradEnd"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Gradient End</FormLabel>
                        <div className="flex items-center gap-2">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <input
                            type="color"
                            value={field.value.replace("CC", "").substring(0, 7)}
                            onChange={(e) => field.onChange(e.target.value + "CC")}
                            className="w-10 h-10 rounded cursor-pointer border"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ctaLabel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Button Label</FormLabel>
                        <FormControl>
                          <Input placeholder="Order Now" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="ctaCat"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Links to Category</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                          >
                            {CATEGORY_OPTIONS.map((c) => (
                              <option key={c} value={c}>
                                {c.charAt(0).toUpperCase() + c.slice(1)}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm">Banner Image</p>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-32 h-24 rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/10 flex items-center justify-center overflow-hidden shrink-0">
                      {form.watch("imageUrl") ? (
                        <img
                          src={form.watch("imageUrl")}
                          alt="banner preview"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
                      )}
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="text-xs text-muted-foreground font-medium">
                        Paste an image URL
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://i.ibb.co/your-banner-image.jpg"
                          value={bannerUrlInput}
                          onChange={(e) => setBannerUrlInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (bannerUrlInput.trim()) {
                                form.setValue("imageUrl", bannerUrlInput.trim());
                                setBannerUrlInput("");
                              }
                            }
                          }}
                          className="flex-1 text-sm border border-input rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (bannerUrlInput.trim()) {
                              form.setValue("imageUrl", bannerUrlInput.trim());
                              setBannerUrlInput("");
                            }
                          }}
                          disabled={!bannerUrlInput.trim()}
                          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-40"
                        >
                          Set
                        </button>
                      </div>

                      {form.watch("imageUrl") && (
                        <button
                          type="button"
                          onClick={() => form.setValue("imageUrl", "")}
                          className="text-xs text-destructive hover:underline"
                        >
                          Remove image
                        </button>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Upload to ImgBB or Imgur, then paste the direct link.
                        Recommended: 800x400px.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingBanner(null);
                      form.reset();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary hover:bg-primary/90 px-8 font-bold"
                  >
                    Save Slide
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Shell>
  );
}
