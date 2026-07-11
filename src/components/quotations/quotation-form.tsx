"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CustomerSelect } from "@/components/customers/customer-select";
import { quotationSchema, type QuotationFormValues } from "@/lib/validations/quotation";
import { computeLineItem, computeQuotationTotals } from "@/lib/calculations";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { QuotationDTO } from "@/types";

const emptyItem = {
  description: "",
  category: "",
  width: 0,
  height: 0,
  quantity: 1,
  unitPrice: 0,
  discountType: "PERCENT" as const,
  discountValue: 0,
};

function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function QuotationForm({
  quotation,
  defaultTerms,
  defaultVatPercent,
  currency = "USD",
}: {
  quotation?: QuotationDTO;
  defaultTerms?: string;
  defaultVatPercent?: number;
  currency?: string;
}) {
  const router = useRouter();
  const isEdit = Boolean(quotation);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<QuotationFormValues>({
    resolver: zodResolver(quotationSchema),
    defaultValues: quotation
      ? {
          customerId: quotation.customerId,
          projectName: quotation.projectName,
          projectLocation: quotation.projectLocation ?? "",
          date: toDateInputValue(quotation.date),
          validUntil: toDateInputValue(quotation.validUntil),
          discountType: quotation.discountType,
          discountValue: Number(quotation.discountValue),
          vatPercent: Number(quotation.vatPercent),
          notes: quotation.notes ?? "",
          termsAndConditions: quotation.termsAndConditions ?? "",
          items: quotation.items.map((item) => ({
            description: item.description,
            category: item.category ?? "",
            width: Number(item.width),
            height: Number(item.height),
            quantity: Number(item.quantity),
            unitPrice: Number(item.unitPrice),
            discountType: item.discountType,
            discountValue: Number(item.discountValue),
          })),
        }
      : {
          customerId: "",
          projectName: "",
          projectLocation: "",
          date: new Date().toISOString().slice(0, 10),
          validUntil: "",
          discountType: "PERCENT",
          discountValue: 0,
          vatPercent: defaultVatPercent ?? 0,
          notes: "",
          termsAndConditions: defaultTerms ?? "",
          items: [emptyItem],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const appliedDefaults = React.useRef(false);
  React.useEffect(() => {
    if (isEdit || appliedDefaults.current) return;
    if (defaultTerms === undefined && defaultVatPercent === undefined) return;
    appliedDefaults.current = true;
    if (defaultTerms) setValue("termsAndConditions", defaultTerms);
    if (defaultVatPercent) setValue("vatPercent", defaultVatPercent);
  }, [isEdit, defaultTerms, defaultVatPercent, setValue]);

  const watchedItems = useWatch({ control, name: "items" });
  const watchedDiscountType = useWatch({ control, name: "discountType" });
  const watchedDiscountValue = useWatch({ control, name: "discountValue" });
  const watchedVatPercent = useWatch({ control, name: "vatPercent" });

  const totals = React.useMemo(() => {
    const items = (watchedItems ?? []).map((item) => ({
      width: Number(item?.width) || 0,
      height: Number(item?.height) || 0,
      quantity: Number(item?.quantity) || 0,
      unitPrice: Number(item?.unitPrice) || 0,
      discountType: item?.discountType ?? "PERCENT",
      discountValue: Number(item?.discountValue) || 0,
    }));
    return computeQuotationTotals(
      items,
      watchedDiscountType ?? "PERCENT",
      Number(watchedDiscountValue) || 0,
      Number(watchedVatPercent) || 0
    );
  }, [watchedItems, watchedDiscountType, watchedDiscountValue, watchedVatPercent]);

  const saveMutation = useMutation({
    mutationFn: ({ values, status }: { values: QuotationFormValues; status: "DRAFT" | "PENDING" }) =>
      isEdit
        ? apiFetch<{ quotation: QuotationDTO }>(`/api/quotations/${quotation!.id}`, {
            method: "PATCH",
            body: JSON.stringify(values),
          })
        : apiFetch<{ quotation: QuotationDTO }>("/api/quotations", {
            method: "POST",
            body: JSON.stringify({ ...values, status }),
          }),
    onSuccess: ({ quotation: saved }) => {
      toast.success(isEdit ? "Quotation updated" : "Quotation created");
      router.push(`/quotations/${saved.id}`);
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const onSubmit = (status: "DRAFT" | "PENDING") =>
    handleSubmit(
      (values) => saveMutation.mutate({ values, status }),
      () => toast.error("Please fix the errors in the form.")
    )();

  return (
    <div className="flex flex-col gap-6">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Customer &amp; Project Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
            <Label>Customer *</Label>
            <QuotationCustomerField control={control} register={register} />
            {errors.customerId && (
              <p className="text-xs text-destructive">{errors.customerId.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="projectName">Project Name *</Label>
            <Input id="projectName" {...register("projectName")} />
            {errors.projectName && (
              <p className="text-xs text-destructive">{errors.projectName.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="projectLocation">Project Location</Label>
            <Input id="projectLocation" {...register("projectLocation")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="date">Date *</Label>
            <Input id="date" type="date" {...register("date")} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="validUntil">Valid Until</Label>
            <Input id="validUntil" type="date" {...register("validUntil")} />
          </div>
          {isEdit && (
            <div className="flex flex-col gap-1.5">
              <Label>Quotation Number</Label>
              <Input value={quotation!.quotationNumber} disabled />
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Quotation Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">No.</TableHead>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead>Width (m)</TableHead>
                <TableHead>Height (m)</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Area (m²)</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => {
                const item = watchedItems?.[index];
                const computed = computeLineItem({
                  width: Number(item?.width) || 0,
                  height: Number(item?.height) || 0,
                  quantity: Number(item?.quantity) || 0,
                  unitPrice: Number(item?.unitPrice) || 0,
                  discountType: item?.discountType ?? "PERCENT",
                  discountValue: Number(item?.discountValue) || 0,
                });

                return (
                  <TableRow key={field.id}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <Input
                        placeholder="e.g. Double glazed curtain wall panel"
                        {...register(`items.${index}.description` as const)}
                      />
                      {errors.items?.[index]?.description && (
                        <p className="text-xs text-destructive">
                          {errors.items[index]?.description?.message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        className="w-24"
                        {...register(`items.${index}.width` as const)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.001"
                        className="w-24"
                        {...register(`items.${index}.height` as const)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="1"
                        className="w-20"
                        {...register(`items.${index}.quantity` as const)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{formatNumber(computed.area, 3)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        className="w-28"
                        {...register(`items.${index}.unitPrice` as const)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <select
                          className="h-10 rounded-xl border border-input bg-transparent px-2 text-sm"
                          {...register(`items.${index}.discountType` as const)}
                        >
                          <option value="PERCENT">%</option>
                          <option value="FIXED">$</option>
                        </select>
                        <Input
                          type="number"
                          step="0.01"
                          className="w-20"
                          {...register(`items.${index}.discountValue` as const)}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(computed.amount, currency)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {errors.items?.message && (
            <p className="mt-2 text-xs text-destructive">{errors.items.message}</p>
          )}
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => append(emptyItem)}
          >
            <Plus /> Add Item
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Notes &amp; Terms</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} {...register("notes")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="termsAndConditions">Terms &amp; Conditions</Label>
              <Textarea id="termsAndConditions" rows={5} {...register("termsAndConditions")} />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Totals</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Overall Discount</Label>
                <div className="flex gap-1">
                  <select
                    className="h-10 rounded-xl border border-input bg-transparent px-2 text-sm"
                    {...register("discountType")}
                  >
                    <option value="PERCENT">%</option>
                    <option value="FIXED">$</option>
                  </select>
                  <Input type="number" step="0.01" {...register("discountValue")} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="vatPercent">VAT (%)</Label>
                <Input id="vatPercent" type="number" step="0.01" {...register("vatPercent")} />
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totals.subTotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discount</span>
                <span>-{formatCurrency(totals.discountAmount, currency)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Grand Total</span>
                <span>{formatCurrency(totals.grandTotal, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span>{formatCurrency(totals.vatAmount, currency)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-lg font-bold text-brand-accent">
                <span>Final Total</span>
                <span>{formatCurrency(totals.finalTotal, currency)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={saveMutation.isPending}
          onClick={() => onSubmit("DRAFT")}
        >
          {saveMutation.isPending && <Loader2 className="animate-spin" />}
          Save as Draft
        </Button>
        <Button
          type="button"
          variant="brand"
          disabled={saveMutation.isPending}
          onClick={() => onSubmit("PENDING")}
        >
          {saveMutation.isPending && <Loader2 className="animate-spin" />}
          {isEdit ? "Save Changes" : "Save & Submit for Approval"}
        </Button>
      </div>
    </div>
  );
}

function QuotationCustomerField({
  control,
  register,
}: {
  control: ReturnType<typeof useForm<QuotationFormValues>>["control"];
  register: ReturnType<typeof useForm<QuotationFormValues>>["register"];
}) {
  const customerId = useWatch({ control, name: "customerId" });
  const { onChange, ...rest } = register("customerId");
  return (
    <>
      <input type="hidden" {...rest} />
      <CustomerSelect
        value={customerId}
        onChange={(id) => onChange({ target: { name: "customerId", value: id } })}
      />
    </>
  );
}
