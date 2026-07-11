"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { QuotationForm } from "@/components/quotations/quotation-form";
import { apiFetch } from "@/lib/api-client";
import type { QuotationDTO } from "@/types";

export default function EditQuotationPage() {
  const params = useParams<{ id: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["quotation", params.id],
    queryFn: () => apiFetch<{ quotation: QuotationDTO }>(`/api/quotations/${params.id}`),
  });

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;
  if (!data) return <p className="text-muted-foreground">Quotation not found.</p>;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Edit {data.quotation.quotationNumber}
        </h1>
        <p className="text-sm text-muted-foreground">
          Update the customer, project, and line item details.
        </p>
      </div>
      <QuotationForm quotation={data.quotation} />
    </div>
  );
}
