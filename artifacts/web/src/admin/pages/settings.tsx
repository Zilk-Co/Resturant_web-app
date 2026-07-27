import { Shell } from "@/admin/layout/Shell";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/admin/ui/button";
import { Input } from "@/admin/ui/input";
import { Switch } from "@/admin/ui/switch";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/admin/ui/form";
import { Settings2, Truck, Receipt, Percent, CheckCircle2, Store, Clock, Loader2, Play, Type, Zap, Globe, BookOpen } from "lucide-react";
import { Checkbox } from "@/admin/ui/checkbox";

const API_BASE = "/api";

function adminHeaders(): Record<string, string> {
  const token = sessionStorage.getItem("admin_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

const settingsSchema = z.object({
  storeName:         z.string().min(1, "Required"),
  storePhone:        z.string().min(1, "Required"),
  taxRate:           z.coerce.number().min(0).max(100),
  deliveryFee:       z.coerce.number().min(0),
  minOrderAmount:    z.coerce.number().min(0),
  freeDeliveryOver:  z.coerce.number().min(0),
  takeawayDiscount:  z.coerce.number().min(0).max(100),
  maxDeliveryRadius: z.coerce.number().min(0),
  preparationTime:   z.coerce.number().min(1),
  deliveryTime:      z.coerce.number().min(1),
  deliveryEnabled:   z.boolean().default(true),
  takeawayEnabled:   z.boolean().default(true),
  heroBannerMainText: z.string().default("THE HUNGER BITE ISTANBUL"),
  heroBannerSubText: z.string().default("Authentic Taste, Fresh Quality"),
  heroBannerButtonText: z.string().default("Order Now"),
  heroBannerTag: z.string().default("LIMITED TIME"),
  heroBannerTagColor: z.string().default("#FFD54F"),
  heroBannerImageUrl: z.string().default(""),
  heroBannerGradStart: z.string().default("#C8102E"),
  heroBannerGradEnd: z.string().default("#8B0000"),
  heroBannerCtaCat: z.string().default("deals"),
  websiteHeroVideoUrl: z.string().default(""),
  storyHeroImageUrl: z.string().default(""),
  recommendedItemIds: z.array(z.string()).default(["m7", "m8", "m9", "m10"]),
  appDownloadUrl: z.string().default(""),
  signatureItemIds: z.array(z.string()).default(["m1", "m2", "m3"]),
});

type SettingsValues = z.infer<typeof settingsSchema>;

const DEFAULT_SETTINGS: SettingsValues = {
  storeName: "The Hunger Bite Istanbul",
  storePhone: "0315-1111000",
  taxRate: 17,
  deliveryFee: 120,
  minOrderAmount: 500,
  freeDeliveryOver: 2500,
  takeawayDiscount: 0,
  maxDeliveryRadius: 10,
  preparationTime: 15,
  deliveryTime: 30,
  deliveryEnabled: true,
  takeawayEnabled: true,
  heroBannerMainText: "THE HUNGER BITE ISTANBUL",
  heroBannerSubText: "Authentic Taste, Fresh Quality",
  heroBannerButtonText: "Order Now",
  heroBannerTag: "LIMITED TIME",
  heroBannerTagColor: "#FFD54F",
  heroBannerImageUrl: "",
  heroBannerGradStart: "#C8102E",
  heroBannerGradEnd: "#8B0000",
  heroBannerCtaCat: "deals",
  websiteHeroVideoUrl: "",
  storyHeroImageUrl: "",
  recommendedItemIds: ["m7", "m8", "m9", "m10"],
  appDownloadUrl: "",
  signatureItemIds: ["m1", "m2", "m3"],
};

export default function Settings() {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState("");

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: DEFAULT_SETTINGS,
  });

  const fetchSettings = useCallback(async () => {
    try {
      const [settingsRes, menuRes] = await Promise.all([
        fetch(`${API_BASE}/admin/settings`),
        fetch(`${API_BASE}/mobile/menu`),
      ]);
      
      if (settingsRes.ok) {
        const data = await settingsRes.json();
        form.reset({ ...DEFAULT_SETTINGS, ...data });
      }
      
      if (menuRes.ok) {
        const menuData = await menuRes.json();
        setMenuItems(menuData);
      }
    } catch {}
    setLoading(false);
  }, [form]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const onSubmit = async (values: SettingsValues) => {
    try {
      const res = await fetch(`${API_BASE}/admin/settings`, {
        method: "PATCH",
        headers: adminHeaders(),
        body: JSON.stringify(values),
      });
      if (res.ok) {
        setSaved(true);
        setError("");
        setTimeout(() => setSaved(false), 2500);
      } else {
        const err = await res.text();
        setError(`Save failed: ${err}`);
      }
    } catch (e) {
      setError(`Network error: ${e instanceof Error ? e.message : "Unknown"}`);
    }
  };

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
              <Settings2 className="w-8 h-8" /> App & Website Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure tax, delivery fees, order limits, and service options.
              These settings apply to both the mobile app and website.
            </p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
              <CheckCircle2 className="w-4 h-4" /> Settings saved!
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive bg-destructive/10 px-4 py-2 rounded-full border border-destructive/20">
              {error}
            </div>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <section className="bg-card border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
                <Store className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">Store Information</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField control={form.control} name="storeName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Store Name</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="storePhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Contact Phone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="bg-card border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
                <Receipt className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">Pricing & Tax</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <FormField control={form.control} name="taxRate" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold flex items-center gap-1"><Percent className="w-3 h-3" /> Tax Rate (%)</FormLabel>
                    <FormControl><Input type="number" step="0.1" min="0" max="100" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Applied to all orders at checkout</p>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="deliveryFee" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold flex items-center gap-1"><Truck className="w-3 h-3" /> Delivery Fee (Rs.)</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Charged per delivery order</p>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="freeDeliveryOver" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Free Delivery Over (Rs.)</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Set 0 to always charge delivery</p>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="minOrderAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Min. Order Amount (Rs.)</FormLabel>
                    <FormControl><Input type="number" min="0" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="takeawayDiscount" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Takeaway Discount (%)</FormLabel>
                    <FormControl><Input type="number" min="0" max="100" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Optional discount for self-pickup</p>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="maxDeliveryRadius" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Max Delivery Radius (km)</FormLabel>
                    <FormControl><Input type="number" min="0" step="0.5" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="bg-card border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">Preparation & Delivery Times</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField control={form.control} name="preparationTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Preparation Time (min)</FormLabel>
                    <FormControl><Input type="number" min="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="deliveryTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Delivery Time (min)</FormLabel>
                    <FormControl><Input type="number" min="1" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="bg-card border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
                <Truck className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">Active Order Types</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField control={form.control} name="deliveryEnabled" render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border">
                    <div>
                      <FormLabel className="font-semibold text-base">Delivery</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">Allow customers to order delivery</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary" />
                    </FormControl>
                  </FormItem>
                )} />
                <FormField control={form.control} name="takeawayEnabled" render={({ field }) => (
                  <FormItem className="flex items-center justify-between p-4 bg-muted/20 rounded-xl border">
                    <div>
                      <FormLabel className="font-semibold text-base">Takeaway</FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">Allow customers to pick up orders</p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} className="data-[state=checked]:bg-primary" />
                    </FormControl>
                  </FormItem>
                )} />
                <div className="flex items-center justify-between p-4 bg-muted/10 rounded-xl border border-dashed opacity-50 md:col-span-2">
                  <div>
                    <p className="font-semibold text-base">Dine-In</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Permanently disabled per business decision</p>
                  </div>
                  <Switch checked={false} disabled />
                </div>
              </div>
             </section>

            <section className="bg-card border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
                <Play className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">App Hero Banner Defaults</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-4">Default values for the mobile app hero banner. These show if no banners are configured in App Only &gt; Banner Management.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField control={form.control} name="heroBannerMainText" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold flex items-center gap-1"><Type className="w-3 h-3" /> Slide Title</FormLabel>
                    <FormControl><Input placeholder="Big Deals, Bigger Savings" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Main heading text shown on the banner</p>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroBannerSubText" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Subtitle</FormLabel>
                    <FormControl><Input placeholder="Save up to 40% on family meals" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroBannerTag" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Tag Label</FormLabel>
                    <FormControl><Input placeholder="LIMITED TIME" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Small tag pill shown above the title</p>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroBannerTagColor" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Tag Color</FormLabel>
                    <div className="flex gap-2 items-center">
                      <FormControl><Input type="color" className="w-12 h-10 p-1 cursor-pointer" {...field} /></FormControl>
                      <FormControl><Input placeholder="#FFD54F" {...field} /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroBannerGradStart" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Gradient Start</FormLabel>
                    <div className="flex gap-2 items-center">
                      <FormControl><Input type="color" className="w-12 h-10 p-1 cursor-pointer" {...field} /></FormControl>
                      <FormControl><Input placeholder="#C8102E" {...field} /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroBannerGradEnd" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Gradient End</FormLabel>
                    <div className="flex gap-2 items-center">
                      <FormControl><Input type="color" className="w-12 h-10 p-1 cursor-pointer" {...field} /></FormControl>
                      <FormControl><Input placeholder="#8B0000" {...field} /></FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroBannerButtonText" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Button Label</FormLabel>
                    <FormControl><Input placeholder="Order Now" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroBannerCtaCat" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Links to Category</FormLabel>
                    <FormControl><Input placeholder="deals" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Category ID: deals, chicken, burgers, wraps, sides, beverages, desserts</p>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="heroBannerImageUrl" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="font-semibold">Banner Image URL</FormLabel>
                    <FormControl><Input placeholder="https://i.ibb.co/... (imgbb or any image URL)" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Background image for the banner. If empty, the gradient colors are used as background.</p>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              </div>
            </section>

            <section className="bg-card border rounded-2xl overflow-hidden border-l-4 border-l-blue-500">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-blue-50/50">
                <Globe className="w-5 h-5 text-blue-600" />
                <h2 className="font-bold text-base text-foreground">Website Hero Video</h2>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Website Only</span>
              </div>
              <div className="p-6 space-y-5">
                <p className="text-sm text-muted-foreground">Upload a video for the website home page hero banner. The red/black gradient overlays on top with your text. Mobile app is not affected.</p>
                <FormField control={form.control} name="websiteHeroVideoUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Video URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Paste video URL (MP4, WebM) or upload link"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Direct link to video file. Supports MP4, WebM formats.</p>
                    <FormMessage />
                  </FormItem>
                )} />
                {form.watch("websiteHeroVideoUrl") ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border-2 border-blue-200 bg-black">
                      <video
                        key={form.watch("websiteHeroVideoUrl")}
                        className="w-full max-h-64 object-contain"
                        controls
                        preload="metadata"
                        src={form.watch("websiteHeroVideoUrl")}
                        onError={(e) => {
                          (e.target as HTMLVideoElement).poster = "";
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => form.setValue("websiteHeroVideoUrl", "")}
                      >
                        Remove Video
                      </Button>
                      <span className="text-xs text-muted-foreground self-center">Video is set. Website home page will show this video as hero background.</span>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-blue-200 rounded-xl p-8 text-center bg-blue-50/30">
                    <Play className="w-10 h-10 text-blue-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No video selected</p>
                    <p className="text-xs text-muted-foreground mt-1">Paste a video URL above to set the website hero background</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-card border rounded-2xl overflow-hidden border-l-4 border-l-purple-500">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-purple-50/50">
                <BookOpen className="w-5 h-5 text-purple-600" />
                <h2 className="font-bold text-base text-foreground">Story Page Hero Image</h2>
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Website Only</span>
              </div>
              <div className="p-6 space-y-5">
                <p className="text-sm text-muted-foreground">Background image for the "Our Journey / The THB Story" hero section on the Story page. If empty, the red gradient shows.</p>
                <FormField control={form.control} name="storyHeroImageUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-semibold">Story Hero Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="Paste image URL (JPG, PNG, WebP)" {...field} value={field.value || ""} />
                    </FormControl>
                    <p className="text-xs text-muted-foreground mt-1">Direct link to image. If empty, the red gradient background is used instead.</p>
                    <FormMessage />
                  </FormItem>
                )} />
                {form.watch("storyHeroImageUrl") ? (
                  <div className="space-y-3">
                    <div className="relative rounded-xl overflow-hidden border-2 border-purple-200 bg-black">
                      <img
                        key={form.watch("storyHeroImageUrl")}
                        className="w-full max-h-48 object-cover"
                        src={form.watch("storyHeroImageUrl")}
                        alt="Story hero preview"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => form.setValue("storyHeroImageUrl", "")}>
                        Remove Image
                      </Button>
                      <span className="text-xs text-muted-foreground self-center">Image is set. Story page hero will show this image.</span>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-purple-200 rounded-xl p-8 text-center bg-purple-50/30">
                    <BookOpen className="w-10 h-10 text-purple-300 mx-auto mb-3" />
                    <p className="text-sm font-medium text-muted-foreground">No image selected</p>
                    <p className="text-xs text-muted-foreground mt-1">Paste an image URL above to set the story hero background</p>
                  </div>
                )}
              </div>
            </section>

            <section className="bg-card border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">Signature Items</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-4">Select menu items to highlight as signature items on the home page</p>
                <FormField control={form.control} name="signatureItemIds" render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {menuItems.length > 0 ? (
                        menuItems.map((item) => (
                          <div key={item.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/20 cursor-pointer">
                            <Checkbox
                              checked={field.value?.includes(item.id) || false}
                              onCheckedChange={(checked) => {
                                const updated = checked
                                  ? [...(field.value || []), item.id]
                                  : (field.value || []).filter(id => id !== item.id);
                                field.onChange(updated);
                              }}
                            />
                            <label className="text-sm font-medium cursor-pointer flex-1">{item.name}</label>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No menu items available</p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="bg-card border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">"You Might Also Like" Items</h2>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground mb-4">Select which items appear as recommended add-ons on every product page. These 4 items show on ALL meal pages.</p>
                <FormField control={form.control} name="recommendedItemIds" render={({ field }) => (
                  <FormItem>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {menuItems.length > 0 ? (
                        menuItems.map((item) => (
                          <div key={item.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/20 cursor-pointer">
                            <Checkbox
                              checked={field.value?.includes(item.id) || false}
                              onCheckedChange={(checked) => {
                                const updated = checked
                                  ? [...(field.value || []), item.id]
                                  : (field.value || []).filter(id => id !== item.id);
                                field.onChange(updated);
                              }}
                            />
                            <label className="text-sm font-medium cursor-pointer flex-1">{item.name}</label>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground">No menu items available</p>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

            <section className="bg-card border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-6 py-4 border-b bg-muted/30">
                <Globe className="w-5 h-5 text-primary" />
                <h2 className="font-bold text-base text-foreground">App Download</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <FormField control={form.control} name="appDownloadUrl" render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="font-semibold">APK Download URL</FormLabel>
                    <FormControl><Input placeholder="https://your-server.com/app.apk" {...field} /></FormControl>
                    <p className="text-xs text-muted-foreground mt-1">URL for "Download the App" buttons on the website footer and profile page. Leave empty to hide the button.</p>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
            </section>

             <div className="flex justify-end">
              <Button type="submit" className="bg-primary hover:bg-primary/90 px-10 py-3 text-base font-bold shadow-md">
                {saved ? <><CheckCircle2 className="w-4 h-4 mr-2" />Saved!</> : "Save Settings"}
              </Button>
            </div>

          </form>
        </Form>
      </div>
    </Shell>
  );
}
