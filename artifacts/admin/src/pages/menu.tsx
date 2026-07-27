import { Shell } from "@/components/layout/Shell";
import { useState, useMemo, useRef } from "react";
import {
  useListAdminMenuItems,
  useUpdateAdminMenuItem,
  useDeleteAdminMenuItem,
  useCreateAdminMenuItem,
  getListAdminMenuItemsQueryKey,
  useRequestUploadUrl,
  useListAdminCategories,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flame,
  Star,
  Edit,
  Trash2,
  Plus,
  Search,
  UploadCloud,
  Loader2,
  ImageIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const menuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  price: z.coerce.number().min(0, "Price must be positive"),
  category: z.string().min(1, "Category is required"),
  spicy: z.boolean().optional().default(false),
  popular: z.boolean().optional().default(false),
  calories: z.coerce.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  offerActive: z.boolean().optional().default(false),
  offerPercentage: z.coerce.number().min(0).max(100).nullable().optional(),
  offerLabel: z.string().nullable().optional(),
  offerStartDate: z.string().nullable().optional(),
  offerEndDate: z.string().nullable().optional(),
});

type MenuItemFormValues = z.infer<typeof menuItemSchema>;

export default function Menu() {
  const { data: menuItems, isLoading } = useListAdminMenuItems();
  const { data: categories } = useListAdminCategories();
  const menuItemsArray = Array.isArray(menuItems) ? menuItems : [];
  const categoriesArray = Array.isArray(categories) ? categories : [];

  const queryClient = useQueryClient();
  const updateItem = useUpdateAdminMenuItem();
  const deleteItem = useDeleteAdminMenuItem();
  const createItem = useCreateAdminMenuItem();
  const requestUploadUrl = useRequestUploadUrl();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"all" | "deals">("all");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(
    null,
  );
  const [imageUrlsList, setImageUrlsList] = useState<string[]>([]);
  const [urlInputValues, setUrlInputValues] = useState<Record<number, string>>(
    {},
  );

  const activeDeals = useMemo(() => {
    return menuItemsArray
      .filter(
        (item) => item.offerActive && typeof item.offerPercentage === "number",
      )
      .sort((a, b) => (b.offerPercentage || 0) - (a.offerPercentage || 0));
  }, [menuItemsArray]);

  const topDeals = useMemo(() => activeDeals.slice(0, 4), [activeDeals]);

  const filterCategories = useMemo(() => {
    if (!menuItemsArray.length) return [];
    return Array.from(new Set(menuItemsArray.map((i) => i.category)));
  }, [menuItemsArray]);

  const filteredItems = useMemo(() => {
    if (!menuItemsArray.length) return [];
    return menuItemsArray.filter((i) => {
      const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        categoryFilter === "all" || i.category === categoryFilter;
      const matchesView =
        viewMode === "all" ||
        (i.offerActive && typeof i.offerPercentage === "number");
      return matchesSearch && matchesCategory && matchesView;
    });
  }, [menuItemsArray, search, categoryFilter, viewMode]);

  const handleToggleAvailability = (id: string, available: boolean) => {
    updateItem.mutate(
      { id, data: { available } },
      {
        onSuccess: () =>
          queryClient.invalidateQueries({
            queryKey: getListAdminMenuItemsQueryKey(),
          }),
      },
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      deleteItem.mutate(
        { id },
        {
          onSuccess: () =>
            queryClient.invalidateQueries({
              queryKey: getListAdminMenuItemsQueryKey(),
            }),
        },
      );
    }
  };

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      spicy: false,
      popular: false,
      calories: null,
      imageUrl: "",
      offerActive: false,
      offerPercentage: null,
      offerLabel: "",
      offerStartDate: null,
      offerEndDate: null,
    },
  });

  const handleMultiImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImageIndex(index);
    try {
      const result = await requestUploadUrl.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type },
      });
      await fetch(result.uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      const servingUrl = `/api/storage${result.objectPath}`;
      setImageUrlsList((prev) => {
        const next = [...prev];
        if (index < next.length) {
          next[index] = servingUrl;
        } else {
          next.push(servingUrl);
        }
        return next;
      });
      // Keep the primary imageUrl in sync with the first image
      if (index === 0) {
        form.setValue("imageUrl", servingUrl);
      }
    } catch (err) {
      console.error("Upload failed", err);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploadingImageIndex(null);
    }
  };

  const removeImageAt = (index: number) => {
    setImageUrlsList((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (index === 0 && next.length > 0) {
        form.setValue("imageUrl", next[0]);
      } else if (next.length === 0) {
        form.setValue("imageUrl", "");
      }
      return next;
    });
    setUrlInputValues((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
  };

  const addImageSlot = () => {
    if (imageUrlsList.length < 10) {
      setImageUrlsList((prev) => [...prev, ""]);
    }
  };

  const applyUrlAt = (idx: number) => {
    const url = (urlInputValues[idx] ?? "").trim();
    if (!url) return;
    setImageUrlsList((prev) => {
      const next = [...prev];
      if (idx < next.length) {
        next[idx] = url;
      } else {
        while (next.length <= idx) next.push("");
        next[idx] = url;
      }
      return next;
    });
    if (idx === 0) form.setValue("imageUrl", url);
    setUrlInputValues((prev) => ({ ...prev, [idx]: "" }));
  };

  const onSubmit = (values: MenuItemFormValues) => {
    // Serialize image list into imageUrl field
    const nonEmptyImages = imageUrlsList.filter(Boolean);
    const serializedImageUrl =
      nonEmptyImages.length > 1
        ? JSON.stringify(nonEmptyImages)
        : (nonEmptyImages[0] ?? values.imageUrl ?? null);
    const submitValues = { ...values, imageUrl: serializedImageUrl };

    if (editingItemId) {
      updateItem.mutate(
        { id: editingItemId, data: submitValues },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListAdminMenuItemsQueryKey(),
            });
            setEditingItemId(null);
            form.reset();
            setImageUrlsList([]);
            setUrlInputValues({});
          },
        },
      );
    } else {
      createItem.mutate(
        { data: submitValues },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: getListAdminMenuItemsQueryKey(),
            });
            setIsAddOpen(false);
            form.reset();
            setImageUrlsList([]);
            setUrlInputValues({});
          },
        },
      );
    }
  };

  const openEditDialog = (item: any) => {
    form.reset({
      name: item.name,
      description: item.description || "",
      price: item.price,
      category: item.category,
      spicy: item.spicy || false,
      popular: item.popular || false,
      calories: item.calories || null,
      imageUrl: item.imageUrl || "",
      offerActive: item.offerActive || false,
      offerPercentage: item.offerPercentage || null,
      offerLabel: item.offerLabel || "",
      offerStartDate: item.offerStartDate || null,
      offerEndDate: item.offerEndDate || null,
    });
    setEditingItemId(item.id);
    // Populate imageUrlsList from the item's imageUrl
    if (item.imageUrl) {
      if (item.imageUrl.startsWith("[")) {
        try {
          const parsed = JSON.parse(item.imageUrl) as string[];
          setImageUrlsList(Array.isArray(parsed) ? parsed : [item.imageUrl]);
        } catch {
          setImageUrlsList([item.imageUrl]);
        }
      } else {
        setImageUrlsList([item.imageUrl]);
      }
    } else {
      setImageUrlsList([]);
    }
  };

  const handleOpenChangeAdd = (open: boolean) => {
    if (!open) {
      form.reset();
      setImageUrlsList([]);
      setUrlInputValues({});
    }
    setIsAddOpen(open);
  };

  const handleOpenChangeEdit = (open: boolean) => {
    if (!open) {
      setEditingItemId(null);
      form.reset();
      setImageUrlsList([]);
      setUrlInputValues({});
    }
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="space-y-6">
          <div className="h-10 w-64 bg-muted rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-10 w-full md:w-1/3 bg-muted rounded animate-pulse" />
            <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-80 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-8 h-full pb-10">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              Menu Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage items, pricing, availability, and presentation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              onClick={() => setViewMode("all")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === "all" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
            >
              All Items
            </button>
            <button
              type="button"
              onClick={() => setViewMode("deals")}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${viewMode === "deals" ? "bg-red-500 text-white" : "bg-muted text-muted-foreground"}`}
            >
              Today's Deals
            </button>
          </div>
          <Dialog open={isAddOpen} onOpenChange={handleOpenChangeAdd}>
            <DialogTrigger asChild>
              <Button
                data-testid="btn-add-item"
                className="bg-primary hover:bg-primary/90 shadow-md font-bold px-6"
                onClick={() => setImageUrlsList([""])}
              >
                <Plus className="w-5 h-5 mr-2" /> Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader className="shrink-0">
                <DialogTitle className="text-2xl text-primary font-bold">
                  Add New Menu Item
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5 overflow-y-auto flex-1 pr-1"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Zinger Burger" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Category
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(categoriesArray ?? []).map((c) => (
                                <SelectItem key={c.id} value={c.name}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Price (Rs)
                          </FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="calories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Calories (optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className="resize-none"
                            placeholder="Crispy chicken fillet with signature sauce..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Multi-Image Gallery — URL paste (file upload coming soon) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm">
                        Product Images{" "}
                        <span className="text-muted-foreground font-normal">
                          (up to 10 · auto-scrolls in app)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                        <Loader2 className="w-3 h-3" />
                        File upload in progress
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imageUrlsList.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <div className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/25 overflow-hidden flex flex-col bg-muted/10">
                            {url ? (
                              /* ── Filled: show image ── */
                              <>
                                <img
                                  src={url}
                                  alt={`Image ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "";
                                  }}
                                />
                                {/* Hover controls */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => removeImageAt(idx)}
                                    className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                                    title="Remove image"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                {idx === 0 && (
                                  <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold shadow">
                                    MAIN
                                  </span>
                                )}
                              </>
                            ) : (
                              /* ── Empty: disabled upload + URL paste ── */
                              <div className="flex flex-col h-full p-2 gap-2">
                                {/* Disabled file upload indicator */}
                                <div className="flex flex-col items-center gap-0.5 pt-1 opacity-40 select-none cursor-not-allowed">
                                  <UploadCloud className="w-5 h-5 text-muted-foreground" />
                                  <span className="text-[9px] text-muted-foreground text-center leading-tight">
                                    File Upload
                                  </span>
                                  <span className="text-[8px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full mt-0.5">
                                    In Progress
                                  </span>
                                </div>

                                <div className="text-[9px] text-center text-muted-foreground/60 font-medium">
                                  — or paste URL —
                                </div>

                                {/* URL input */}
                                <div className="flex flex-col gap-1 mt-auto">
                                  <input
                                    type="url"
                                    placeholder="https://i.ibb.co/…"
                                    value={urlInputValues[idx] ?? ""}
                                    onChange={(e) =>
                                      setUrlInputValues((prev) => ({
                                        ...prev,
                                        [idx]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        applyUrlAt(idx);
                                      }
                                    }}
                                    className="w-full text-[10px] border border-input rounded-md px-1.5 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => applyUrlAt(idx)}
                                    disabled={
                                      !(urlInputValues[idx] ?? "").trim()
                                    }
                                    className="w-full text-[10px] font-semibold py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Set Image
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add new slot */}
                      {imageUrlsList.length < 10 && (
                        <button
                          type="button"
                          onClick={addImageSlot}
                          className="aspect-square rounded-xl border-2 border-dashed border-primary/25 bg-primary/5 flex flex-col items-center justify-center gap-1.5 hover:bg-primary/10 hover:border-primary/40 transition-colors"
                        >
                          <Plus className="w-5 h-5 text-primary/50" />
                          <span className="text-[10px] text-primary/60 font-semibold">
                            Add Slot
                          </span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                      💡 <strong>Tip:</strong> Upload your images to{" "}
                      <a
                        href="https://imgbb.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        ImgBB
                      </a>{" "}
                      or{" "}
                      <a
                        href="https://imgur.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Imgur
                      </a>{" "}
                      for free, then paste the direct link above. First image is
                      the main product photo.
                    </p>
                  </div>

                  <div className="flex gap-8 p-4 bg-muted/20 rounded-lg border border-border/50">
                    <FormField
                      control={form.control}
                      name="spicy"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                            />
                          </FormControl>
                          <FormLabel className="m-0 cursor-pointer font-medium flex items-center">
                            <Flame className="w-4 h-4 mr-1 text-destructive" />{" "}
                            Spicy Indicator
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="popular"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500 text-yellow-950"
                            />
                          </FormControl>
                          <FormLabel className="m-0 cursor-pointer font-medium flex items-center">
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />{" "}
                            Popular Item
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-300">
                        Offer Management
                      </div>
                    </div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="offerActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            </FormControl>
                            <FormLabel className="m-0 cursor-pointer font-medium">
                              Active Offer
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      {form.watch("offerActive") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="offerPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">
                                  Discount %
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 17"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="offerLabel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">
                                  Label
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Best Seller, Hot Deal, Value"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={
                        createItem.isPending || uploadingImageIndex !== null
                      }
                      className="w-full md:w-auto px-8"
                    >
                      {createItem.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Save Item
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!editingItemId} onOpenChange={handleOpenChangeEdit}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              <DialogHeader className="shrink-0">
                <DialogTitle className="text-2xl text-primary font-bold">
                  Edit Menu Item
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-5 overflow-y-auto flex-1 pr-1"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Zinger Burger" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Category
                          </FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(categoriesArray ?? []).map((c) => (
                                <SelectItem key={c.id} value={c.name}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Price (Rs)
                          </FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="calories"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold">
                            Calories (optional)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            className="resize-none"
                            placeholder="Crispy chicken fillet with signature sauce..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Multi-Image Gallery — URL paste (file upload coming soon) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-sm">
                        Product Images{" "}
                        <span className="text-muted-foreground font-normal">
                          (up to 10 · auto-scrolls in app)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full">
                        <Loader2 className="w-3 h-3" />
                        File upload in progress
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {imageUrlsList.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <div className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/25 overflow-hidden flex flex-col bg-muted/10">
                            {url ? (
                              /* ── Filled: show image ── */
                              <>
                                <img
                                  src={url}
                                  alt={`Image ${idx + 1}`}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = "";
                                  }}
                                />
                                {/* Hover controls */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => removeImageAt(idx)}
                                    className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center hover:bg-destructive hover:text-white transition-colors"
                                    title="Remove image"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                {idx === 0 && (
                                  <span className="absolute bottom-1.5 left-1.5 text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold shadow">
                                    MAIN
                                  </span>
                                )}
                              </>
                            ) : (
                              /* ── Empty: disabled upload + URL paste ── */
                              <div className="flex flex-col h-full p-2 gap-2">
                                {/* Disabled file upload indicator */}
                                <div className="flex flex-col items-center gap-0.5 pt-1 opacity-40 select-none cursor-not-allowed">
                                  <UploadCloud className="w-5 h-5 text-muted-foreground" />
                                  <span className="text-[9px] text-muted-foreground text-center leading-tight">
                                    File Upload
                                  </span>
                                  <span className="text-[8px] font-bold bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full mt-0.5">
                                    In Progress
                                  </span>
                                </div>

                                <div className="text-[9px] text-center text-muted-foreground/60 font-medium">
                                  — or paste URL —
                                </div>

                                {/* URL input */}
                                <div className="flex flex-col gap-1 mt-auto">
                                  <input
                                    type="url"
                                    placeholder="https://i.ibb.co/…"
                                    value={urlInputValues[idx] ?? ""}
                                    onChange={(e) =>
                                      setUrlInputValues((prev) => ({
                                        ...prev,
                                        [idx]: e.target.value,
                                      }))
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        applyUrlAt(idx);
                                      }
                                    }}
                                    className="w-full text-[10px] border border-input rounded-md px-1.5 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/50"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => applyUrlAt(idx)}
                                    disabled={
                                      !(urlInputValues[idx] ?? "").trim()
                                    }
                                    className="w-full text-[10px] font-semibold py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                  >
                                    Set Image
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Add new slot */}
                      {imageUrlsList.length < 10 && (
                        <button
                          type="button"
                          onClick={addImageSlot}
                          className="aspect-square rounded-xl border-2 border-dashed border-primary/25 bg-primary/5 flex flex-col items-center justify-center gap-1.5 hover:bg-primary/10 hover:border-primary/40 transition-colors"
                        >
                          <Plus className="w-5 h-5 text-primary/50" />
                          <span className="text-[10px] text-primary/60 font-semibold">
                            Add Slot
                          </span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg px-3 py-2">
                      💡 <strong>Tip:</strong> Upload your images to{" "}
                      <a
                        href="https://imgbb.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        ImgBB
                      </a>{" "}
                      or{" "}
                      <a
                        href="https://imgur.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline"
                      >
                        Imgur
                      </a>{" "}
                      for free, then paste the direct link above. First image is
                      the main product photo.
                    </p>
                  </div>

                  <div className="flex gap-8 p-4 bg-muted/20 rounded-lg border border-border/50">
                    <FormField
                      control={form.control}
                      name="spicy"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                            />
                          </FormControl>
                          <FormLabel className="m-0 cursor-pointer font-medium flex items-center">
                            <Flame className="w-4 h-4 mr-1 text-destructive" />{" "}
                            Spicy Indicator
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="popular"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-yellow-500 data-[state=checked]:border-yellow-500 text-yellow-950"
                            />
                          </FormControl>
                          <FormLabel className="m-0 cursor-pointer font-medium flex items-center">
                            <Star className="w-4 h-4 mr-1 text-yellow-500" />{" "}
                            Popular Item
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="text-lg font-bold text-blue-600 dark:text-blue-300">
                        Offer Management
                      </div>
                    </div>
                    <div className="space-y-4">
                      <FormField
                        control={form.control}
                        name="offerActive"
                        render={({ field }) => (
                          <FormItem className="flex items-center gap-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            </FormControl>
                            <FormLabel className="m-0 cursor-pointer font-medium">
                              Active Offer
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      {form.watch("offerActive") && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="offerPercentage"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">
                                  Discount %
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    placeholder="e.g., 17"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="offerLabel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="font-semibold">
                                  Label
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Best Seller, Hot Deal, Value"
                                    {...field}
                                    value={field.value || ""}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button
                      type="submit"
                      disabled={
                        updateItem.isPending || uploadingImageIndex !== null
                      }
                      className="w-full md:w-auto px-8"
                    >
                      {updateItem.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : null}
                      Update Item
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 p-4 bg-card border rounded-xl shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              className="pl-10 h-11 border-muted-foreground/20 text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-menu"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger
              className="w-full sm:w-[220px] h-11 border-muted-foreground/20"
              data-testid="select-category-filter"
            >
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {filterCategories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {topDeals.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mt-6">
            {topDeals.map((deal) => (
              <div
                key={deal.id}
                className="p-4 rounded-2xl border border-red-100 dark:border-red-900/30 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-red-700 flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      Today's Deal
                    </p>
                    <h3 className="text-lg font-bold text-foreground">
                      {deal.name}
                    </h3>
                  </div>
                  <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-semibold text-white">
                    {deal.offerPercentage}% OFF
                  </span>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {deal.description}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground line-through">
                      Rs {deal.price.toLocaleString()}
                    </p>
                    <p className="text-xl font-extrabold text-foreground">
                      Rs{" "}
                      {Math.round(
                        deal.price * (1 - (deal.offerPercentage || 0) / 100),
                      ).toLocaleString()}
                    </p>
                  </div>
                  {deal.imageUrl ? (
                    <img
                      src={deal.imageUrl}
                      alt={deal.name}
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-card border border-dashed rounded-xl h-64">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Search className="w-8 h-8 text-primary/60" />
            </div>
            <h3 className="text-xl font-bold text-foreground">
              No menu items found
            </h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              Try adjusting your search or category filters to find what you're
              looking for.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group bg-card border rounded-xl overflow-hidden flex flex-col transition-all hover:shadow-lg hover:border-primary/30"
              >
                <div className="h-52 bg-muted relative overflow-hidden">
                  {item.imageUrl ? (
                    <img
                      src={
                        item.imageUrl.startsWith("[")
                          ? (() => {
                              try {
                                return (
                                  (JSON.parse(item.imageUrl!) as string[])[0] ??
                                  item.imageUrl!
                                );
                              } catch {
                                return item.imageUrl!;
                              }
                            })()
                          : item.imageUrl
                      }
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 text-primary/20">
                      <ImageIcon className="w-12 h-12" />
                    </div>
                  )}
                  {item.imageUrl?.startsWith("[") &&
                    (() => {
                      try {
                        const imgs = JSON.parse(item.imageUrl!) as string[];
                        return imgs.length > 1 ? (
                          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {imgs.length} photos
                          </div>
                        ) : null;
                      } catch {
                        return null;
                      }
                    })()}
                  {!item.available && (
                    <div className="absolute inset-0 bg-gradient-to-t from-red-900/40 to-transparent pointer-events-none" />
                  )}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Badge className="bg-background/90 text-foreground backdrop-blur-md border-0 shadow-sm font-semibold">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="absolute top-3 right-3 flex gap-2">
                    {item.offerActive && item.offerPercentage && (
                      <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-sm border-0 font-bold">
                        {item.offerPercentage}% OFF
                      </Badge>
                    )}
                    {item.spicy && (
                      <Badge
                        variant="destructive"
                        className="shadow-sm shadow-destructive/20 border-0"
                      >
                        <Flame className="w-3 h-3 mr-1" /> Spicy
                      </Badge>
                    )}
                    {item.popular && (
                      <Badge
                        variant="secondary"
                        className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500 shadow-sm border-0"
                      >
                        <Star className="w-3 h-3 mr-1" /> Popular
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <h3 className="font-bold text-xl leading-tight text-foreground">
                      {item.name}
                    </h3>
                    <div className="font-black text-xl text-primary whitespace-nowrap">
                      Rs {item.price}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-1">
                    {item.description || "No description provided."}
                  </div>
                  {item.calories && (
                    <div className="text-xs text-muted-foreground font-medium bg-muted/50 w-fit px-2 py-1 rounded-md mb-2">
                      {item.calories} kcal
                    </div>
                  )}
                </div>

                <div className="border-t bg-muted/10 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={item.available}
                      onCheckedChange={(val) =>
                        handleToggleAvailability(item.id, val)
                      }
                      data-testid={`switch-available-${item.id}`}
                      className="data-[state=checked]:bg-primary"
                    />
                    <span
                      className={`text-sm font-bold flex items-center gap-1.5 ${item.available ? "text-primary" : "text-muted-foreground"}`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full inline-block ${item.available ? "bg-primary" : "bg-muted-foreground/40"}`}
                      />
                      {item.available ? "Available" : "Out of Stock"}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => openEditDialog(item)}
                      data-testid={`btn-edit-${item.id}`}
                      title="Edit Item"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
                      onClick={() => handleDelete(item.id)}
                      data-testid={`btn-delete-${item.id}`}
                      title="Delete Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
