"use client";

import * as React from "react";
import { MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import type { QuotationDTO } from "@/types";

function buildGreeting(quotation: QuotationDTO) {
  return (
    `Hello,\n\n` +
    `Please find attached your quotation ${quotation.quotationNumber} from Alhatimi Glass and Glazing ` +
    `for "${quotation.projectName}" — total ${formatCurrency(quotation.finalTotal)}.\n\n` +
    `If you have any questions, please contact us.\n\n` +
    `Thank you for choosing us.`
  );
}

function digitsOnly(phone: string) {
  return phone.replace(/[^\d]/g, "");
}

export function WhatsAppShareButton({ quotation }: { quotation: QuotationDTO }) {
  const [loading, setLoading] = React.useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/quotations/${quotation.id}/pdf`);
      if (!res.ok) throw new Error("Failed to generate PDF");
      const blob = await res.blob();
      const fileName = `${quotation.quotationNumber}.pdf`;
      const file = new File([blob], fileName, { type: "application/pdf" });
      const greeting = buildGreeting(quotation);

      if (
        typeof navigator !== "undefined" &&
        "canShare" in navigator &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: fileName,
          text: greeting,
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      const phone = digitsOnly(quotation.customer.phone);
      const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(greeting)}`;
      window.open(waUrl, "_blank");
      toast.info("PDF downloaded — attach it in the WhatsApp chat that just opened.");
    } catch {
      toast.error("Could not prepare the quotation for sharing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" onClick={handleShare} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" /> : <MessageCircle />}
      Share via WhatsApp
    </Button>
  );
}
