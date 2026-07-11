"use client";

import { useQuery } from "@tanstack/react-query";

import { QuotationForm } from "@/components/quotations/quotation-form";
import { apiFetch } from "@/lib/api-client";

interface SettingsResponse {
  settings: {
    currency: string;
    defaultTaxPercent: string;
    termsAndConditions: string | null;
  };
}

export default function NewQuotationPage() {
  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: () => apiFetch<SettingsResponse>("/api/settings"),
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Quotation</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the customer, project, and line item details.
        </p>
      </div>
      <QuotationForm
        defaultTerms={data?.settings.termsAndConditions ?? undefined}
        defaultVatPercent={data ? Number(data.settings.defaultTaxPercent) : undefined}
        currency={data?.settings.currency ?? "USD"}
      />
    </div>
  );
}
