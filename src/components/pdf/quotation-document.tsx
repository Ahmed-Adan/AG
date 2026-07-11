import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";

const COLORS = {
  navy: "#0F172A",
  blue: "#2563EB",
  orange: "#F97316",
  muted: "#64748B",
  border: "#E2E8F0",
  bgSoft: "#F8FAFC",
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    color: COLORS.navy,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: COLORS.orange,
    paddingBottom: 12,
    marginBottom: 16,
  },
  companyBlock: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 52, height: 52, borderRadius: 26 },
  companyName: { fontSize: 15, fontWeight: 700, color: COLORS.navy },
  companySub: { fontSize: 8.5, color: COLORS.orange, fontWeight: 700, marginTop: 1 },
  companyDetails: { fontSize: 8, color: COLORS.muted, marginTop: 4, lineHeight: 1.5 },
  quotationTitle: { fontSize: 18, fontWeight: 700, color: COLORS.navy, textAlign: "right" },
  quotationMeta: { fontSize: 8.5, color: COLORS.muted, textAlign: "right", marginTop: 4 },
  quotationNumber: { fontSize: 10, fontWeight: 700, color: COLORS.blue, textAlign: "right", marginTop: 2 },

  infoGrid: { flexDirection: "row", gap: 12, marginBottom: 16 },
  infoBox: {
    flex: 1,
    backgroundColor: COLORS.bgSoft,
    borderRadius: 6,
    padding: 10,
  },
  infoLabel: { fontSize: 7.5, color: COLORS.muted, textTransform: "uppercase", marginBottom: 4, fontWeight: 700 },
  infoText: { fontSize: 9, color: COLORS.navy, marginBottom: 2 },

  table: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 4, overflow: "hidden" },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: COLORS.navy,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableHeaderCell: { color: "#FFFFFF", fontSize: 8, fontWeight: 700 },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  tableRowAlt: { backgroundColor: COLORS.bgSoft },
  tableCell: { fontSize: 8.5, color: COLORS.navy },

  colNo: { width: "5%" },
  colDesc: { width: "27%" },
  colDim: { width: "9%", textAlign: "right" },
  colQty: { width: "7%", textAlign: "right" },
  colArea: { width: "10%", textAlign: "right" },
  colPrice: { width: "12%", textAlign: "right" },
  colDiscount: { width: "10%", textAlign: "right" },
  colAmount: { width: "12%", textAlign: "right", fontWeight: 700 },

  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalsBox: { width: 220 },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
  },
  totalsLabel: { fontSize: 9, color: COLORS.muted },
  totalsValue: { fontSize: 9, color: COLORS.navy },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 4,
    paddingTop: 4,
  },
  finalTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: COLORS.navy,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
    marginTop: 6,
  },
  finalTotalLabel: { fontSize: 10, color: "#FFFFFF", fontWeight: 700 },
  finalTotalValue: { fontSize: 12, color: COLORS.orange, fontWeight: 700 },

  section: { marginTop: 18 },
  sectionTitle: { fontSize: 9.5, fontWeight: 700, color: COLORS.navy, marginBottom: 4 },
  sectionText: { fontSize: 8.5, color: COLORS.muted, lineHeight: 1.5 },

  signatureRow: { flexDirection: "row", gap: 16, marginTop: 28 },
  signatureBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    borderRadius: 4,
    height: 60,
    padding: 6,
    justifyContent: "flex-end",
  },
  signatureLabel: { fontSize: 8, color: COLORS.muted },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    textAlign: "center",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
  },
  footerText: { fontSize: 9, color: COLORS.orange, fontWeight: 700 },
  preparedBy: { fontSize: 7.5, color: COLORS.muted, marginTop: 3 },
});

export interface QuotationPdfItem {
  position: number;
  description: string;
  width: number;
  height: number;
  quantity: number;
  area: number;
  unitPrice: number;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  amount: number;
}

export interface QuotationPdfData {
  quotationNumber: string;
  date: string;
  validUntil: string | null;
  status: string;
  customer: {
    name: string;
    companyName: string | null;
    phone: string;
    email: string | null;
    address: string | null;
  };
  projectName: string;
  projectLocation: string | null;
  items: QuotationPdfItem[];
  subTotal: number;
  discountType: "PERCENT" | "FIXED";
  discountValue: number;
  discountAmount: number;
  vatPercent: number;
  vatAmount: number;
  grandTotal: number;
  finalTotal: number;
  notes: string | null;
  termsAndConditions: string | null;
  preparedByName: string;
  company: {
    companyName: string;
    logoPath: string | null;
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    currency: string;
    footerText: string;
  };
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value || 0);
}

function num(value: number, digits = 2) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value || 0);
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric" }).format(
    new Date(value)
  );
}

export function QuotationDocument({ data }: { data: QuotationPdfData }) {
  const currency = data.company.currency || "USD";

  return (
    <Document title={`Quotation ${data.quotationNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={[styles.companyBlock, { width: 320 }]}>
            {data.company.logoPath && (
              // eslint-disable-next-line jsx-a11y/alt-text -- this is @react-pdf/renderer's PDF Image primitive, not an HTML img
              <Image src={data.company.logoPath} style={styles.logo} />
            )}
            <View style={{ width: 250 }}>
              <Text style={styles.companyName}>{data.company.companyName}</Text>
              <Text style={styles.companySub}>GLASS &amp; GLAZING</Text>
              <Text style={styles.companyDetails}>
                {[data.company.address, data.company.phone, data.company.email, data.company.website]
                  .filter(Boolean)
                  .join("  |  ")}
              </Text>
            </View>
          </View>
          <View style={{ width: 160 }}>
            <Text style={styles.quotationTitle}>QUOTATION</Text>
            <Text style={styles.quotationNumber}>{data.quotationNumber}</Text>
            <Text style={styles.quotationMeta}>Date: {formatDate(data.date)}</Text>
            <Text style={styles.quotationMeta}>Valid Until: {formatDate(data.validUntil)}</Text>
          </View>
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Customer Details</Text>
            <Text style={styles.infoText}>{data.customer.name}</Text>
            {data.customer.companyName && (
              <Text style={styles.infoText}>{data.customer.companyName}</Text>
            )}
            <Text style={styles.infoText}>{data.customer.phone}</Text>
            {data.customer.email && <Text style={styles.infoText}>{data.customer.email}</Text>}
            {data.customer.address && <Text style={styles.infoText}>{data.customer.address}</Text>}
          </View>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Project Details</Text>
            <Text style={styles.infoText}>{data.projectName}</Text>
            {data.projectLocation && <Text style={styles.infoText}>{data.projectLocation}</Text>}
            <Text style={styles.infoText}>Status: {data.status}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.colNo]}>No.</Text>
            <Text style={[styles.tableHeaderCell, styles.colDesc]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colDim]}>Width</Text>
            <Text style={[styles.tableHeaderCell, styles.colDim]}>Height</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colArea]}>Area (m²)</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colDiscount]}>Discount</Text>
            <Text style={[styles.tableHeaderCell, styles.colAmount]}>Amount</Text>
          </View>
          {data.items.map((item, index) => (
            <View
              key={item.position}
              style={[styles.tableRow, ...(index % 2 === 1 ? [styles.tableRowAlt] : [])]}
            >
              <Text style={[styles.tableCell, styles.colNo]}>{item.position}</Text>
              <Text style={[styles.tableCell, styles.colDesc]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.colDim]}>{num(item.width, 3)}</Text>
              <Text style={[styles.tableCell, styles.colDim]}>{num(item.height, 3)}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{num(item.quantity, 0)}</Text>
              <Text style={[styles.tableCell, styles.colArea]}>{num(item.area, 3)}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{money(item.unitPrice, currency)}</Text>
              <Text style={[styles.tableCell, styles.colDiscount]}>
                {item.discountValue > 0
                  ? item.discountType === "PERCENT"
                    ? `${num(item.discountValue, 0)}%`
                    : money(item.discountValue, currency)
                  : "—"}
              </Text>
              <Text style={[styles.tableCell, styles.colAmount]}>{money(item.amount, currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsWrap}>
          <View style={styles.totalsBox}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{money(data.subTotal, currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>
                Discount {data.discountValue > 0 ? `(${data.discountType === "PERCENT" ? `${num(data.discountValue, 0)}%` : money(data.discountValue, currency)})` : ""}
              </Text>
              <Text style={styles.totalsValue}>-{money(data.discountAmount, currency)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.totalsLabel}>Grand Total</Text>
              <Text style={styles.totalsValue}>{money(data.grandTotal, currency)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>VAT ({num(data.vatPercent, 0)}%)</Text>
              <Text style={styles.totalsValue}>{money(data.vatAmount, currency)}</Text>
            </View>
            <View style={styles.finalTotalRow}>
              <Text style={styles.finalTotalLabel}>Final Total</Text>
              <Text style={styles.finalTotalValue}>{money(data.finalTotal, currency)}</Text>
            </View>
          </View>
        </View>

        {data.termsAndConditions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms &amp; Conditions</Text>
            <Text style={styles.sectionText}>{data.termsAndConditions}</Text>
          </View>
        )}

        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.sectionText}>{data.notes}</Text>
          </View>
        )}

        <View style={styles.signatureRow}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Authorized Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLabel}>Company Stamp</Text>
          </View>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{data.company.footerText}</Text>
          <Text style={styles.preparedBy}>Prepared by: {data.preparedByName}</Text>
        </View>
      </Page>
    </Document>
  );
}
