import { Shell } from "@/admin/layout/Shell";
import { useState } from "react";
import { useListAdminCategories, useCreateAdminCategory, useDeleteAdminCategory, getListAdminCategoriesQueryKey } from "@/lib/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/admin/ui/button";
import { Input } from "@/admin/ui/input";
import { Badge } from "@/admin/ui/badge";
import { Plus, Trash2, Tag, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/admin/ui/dialog";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/admin/ui/form";

const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(40, "Name too long"),
  slug: z.string()
    .min(1, "Slug is required")
    .max(30, "Slug too long")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  emoji: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function Categories() {
  const { data: categories, isLoading } = useListAdminCategories();
  const categoriesArray = Array.isArray(categories) ? categories : [];
  const createCategory = useCreateAdminCategory();
  const deleteCategory = useDeleteAdminCategory();
  const queryClient = useQueryClient();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", slug: "", emoji: "" },
  });

  const watchName = form.watch("name");

  const autoSlug = (name: string) =>
    name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const onNameChange = (val: string) => {
    form.setValue("name", val);
    if (!form.formState.dirtyFields.slug) {
      form.setValue("slug", autoSlug(val));
    }
  };

  const onSubmit = (values: CategoryFormValues) => {
    createCategory.mutate(
      { data: values },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListAdminCategoriesQueryKey() });
          setIsAddOpen(false);
          form.reset();
        },
      }
    );
  };

  const handleDelete = (id: string, itemCount: number) => {
    if (itemCount > 0) {
      alert(`Cannot delete this category — it has ${itemCount} menu item${itemCount === 1 ? "" : "s"} in it. Remove or reassign those items first.`);
      return;
    }
    if (confirm("Delete this category?")) {
      deleteCategory.mutate(
        { id },
        { onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAdminCategoriesQueryKey() }) }
      );
    }
  };

  if (isLoading) {
    return (
      <Shell>
        <div className="space-y-6">
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-28 bg-muted rounded-xl animate-pulse" />)}
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="flex flex-col gap-8 pb-10">
        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">Categories</h1>
            <p className="text-muted-foreground mt-1">
              Manage menu categories. Categories appear in the mobile app's menu screen.
            </p>
          </div>
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) form.reset(); }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" /> New Category
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl text-primary font-bold">Add New Category</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Display Name</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g. Wraps"
                            {...field}
                            onChange={(e) => onNameChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Slug (ID used in menu filtering)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. wraps" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Lowercase letters, numbers, and hyphens only. Auto-generated from name.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emoji"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold">Emoji Icon</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 🍕" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Optional emoji shown next to the category on the website
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createCategory.isPending} className="bg-primary hover:bg-primary/90">
                      {createCategory.isPending ? "Creating..." : "Create Category"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {!categoriesArray || categoriesArray.length === 0 ? (
          <div className="border border-dashed rounded-xl p-12 text-center text-muted-foreground">
            <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No categories yet</p>
            <p className="text-sm mt-1">Add your first category to organise the menu.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categoriesArray.map((cat) => (
              <div
                key={cat.id}
                className="bg-card border rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-primary/10 p-2 rounded-lg text-xl">
                      {cat.emoji || "📁"}
                    </div>
                    <div>
                      <p className="font-bold text-base leading-tight">{cat.name}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">/{cat.slug}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={() => handleDelete(cat.id, cat.itemCount)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {cat.itemCount} {cat.itemCount === 1 ? "item" : "items"}
                  </Badge>
                  {cat.itemCount > 0 && (
                    <span className="text-xs text-muted-foreground">in menu</span>
                  )}
                </div>
                {cat.itemCount > 0 && (
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Remove items before deleting
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}
