"use client";

import * as React from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/api-client";
import { settingsSchema, type SettingsFormValues } from "@/lib/validations/settings";
import { BackupSection } from "@/components/settings/backup-section";

interface CompanySettings {
  companyName: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  currency: string;
  defaultTaxPercent: string;
  defaultDiscountPercent: string;
  footerText: string;
  termsAndConditions: string | null;
}

export default function SettingsPage() {
  const { data: authSession } = useSession();
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<{ settings: CompanySettings }>("/api/settings"),
  });

  const { register, handleSubmit, reset } = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
  });

  React.useEffect(() => {
    if (data?.settings) {
      reset({
        companyName: data.settings.companyName,
        address: data.settings.address ?? "",
        phone: data.settings.phone ?? "",
        email: data.settings.email ?? "",
        website: data.settings.website ?? "",
        currency: data.settings.currency,
        defaultTaxPercent: Number(data.settings.defaultTaxPercent),
        defaultDiscountPercent: Number(data.settings.defaultDiscountPercent),
        footerText: data.settings.footerText,
        termsAndConditions: data.settings.termsAndConditions ?? "",
      });
    }
  }, [data, reset]);

  const saveMutation = useMutation({
    mutationFn: (values: SettingsFormValues) =>
      apiFetch("/api/settings", { method: "PATCH", body: JSON.stringify(values) }),
    onSuccess: () => {
      toast.success("Settings saved");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const uploadLogo = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/settings/logo", { method: "POST", body: formData });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload failed");
      }
      toast.success("Logo updated");
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (authSession && authSession.user.role !== "ADMIN") {
    return <p className="text-muted-foreground">You do not have access to Settings.</p>;
  }
  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your company profile, defaults, and quotation footer text.
        </p>
      </div>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Company Logo</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          {data?.settings.logoUrl && (
            <Image
              src={data.settings.logoUrl}
              alt="Company logo"
              width={72}
              height={72}
              className="rounded-full border border-border object-cover"
            />
          )}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadLogo(file);
              }}
            />
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              Upload New Logo
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">PNG, JPG, WEBP or SVG. Max 5MB.</p>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit((values) => saveMutation.mutate(values))} className="flex flex-col gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" {...register("companyName")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" {...register("currency")} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" {...register("website")} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Defaults</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="defaultTaxPercent">Default Tax / VAT (%)</Label>
              <Input id="defaultTaxPercent" type="number" step="0.01" {...register("defaultTaxPercent")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="defaultDiscountPercent">Default Discount (%)</Label>
              <Input
                id="defaultDiscountPercent"
                type="number"
                step="0.01"
                {...register("defaultDiscountPercent")}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Footer &amp; Terms</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="footerText">PDF Footer Text</Label>
              <Input id="footerText" {...register("footerText")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="termsAndConditions">Default Terms &amp; Conditions</Label>
              <Textarea id="termsAndConditions" rows={6} {...register("termsAndConditions")} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" variant="brand" disabled={saveMutation.isPending}>
            {saveMutation.isPending && <Loader2 className="animate-spin" />}
            <Save /> Save Settings
          </Button>
        </div>
      </form>

      <BackupSection />
    </div>
  );
}
