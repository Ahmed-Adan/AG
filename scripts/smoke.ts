/**
 * API smoke test against a running dev server (npm run dev).
 * Usage: npx tsx scripts/smoke.ts [baseUrl]
 */

const BASE_URL = process.argv[2] ?? "http://localhost:3000";

let cookies: string[] = [];

function storeCookies(res: Response) {
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const c of setCookie) {
    const [pair] = c.split(";");
    const [name] = pair.split("=");
    cookies = cookies.filter((existing) => !existing.startsWith(`${name}=`));
    cookies.push(pair);
  }
}

async function req(path: string, init: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...(init.headers ?? {}), Cookie: cookies.join("; ") },
    redirect: "manual",
  });
  storeCookies(res);
  return res;
}

let passed = 0;
let failed = 0;

function assert(name: string, condition: unknown) {
  if (condition) {
    passed++;
    console.log(`  ok  - ${name}`);
  } else {
    failed++;
    console.error(`FAIL  - ${name}`);
  }
}

async function main() {
  console.log(`Smoke testing ${BASE_URL}\n`);

  console.log("Auth");
  const csrfRes = await req("/api/auth/csrf");
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  assert("obtained CSRF token", Boolean(csrfToken));

  const loginRes = await req("/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      email: "admin@alhatimiglass.com",
      password: "Admin@123",
      csrfToken,
      redirect: "false",
      json: "true",
    }),
  });
  assert("credentials login succeeds (302)", loginRes.status === 302);

  const sessionRes = await req("/api/auth/session");
  const session = (await sessionRes.json()) as { user?: { role?: string } };
  assert("session reflects ADMIN role", session.user?.role === "ADMIN");

  console.log("\nCustomer");
  const customerRes = await req("/api/customers", {
    method: "POST",
    body: JSON.stringify({
      name: "Smoke Test Customer",
      phone: "+971500000000",
      email: "smoke@example.com",
    }),
  });
  assert("customer created (201)", customerRes.status === 201);
  const { customer } = (await customerRes.json()) as { customer: { id: string } };

  console.log("\nQuotation");
  const quotationRes = await req("/api/quotations", {
    method: "POST",
    body: JSON.stringify({
      status: "PENDING",
      customerId: customer.id,
      projectName: "Smoke Test Project",
      date: new Date().toISOString().slice(0, 10),
      discountType: "PERCENT",
      discountValue: 0,
      vatPercent: 5,
      items: [
        {
          description: "Smoke test panel",
          width: 2,
          height: 2,
          quantity: 2,
          unitPrice: 100,
          discountType: "PERCENT",
          discountValue: 0,
        },
      ],
    }),
  });
  assert("quotation created (201)", quotationRes.status === 201);
  const { quotation } = (await quotationRes.json()) as {
    quotation: { id: string; quotationNumber: string; finalTotal: string };
  };
  assert(
    "quotation number matches ALH-<year>-XXXX",
    /^ALH-\d{4}-\d{4,}$/.test(quotation.quotationNumber)
  );
  // area = 2*2*2 = 8, amount = 8*100 = 800, vat 5% = 40, final = 840
  assert("totals match hand-computed expectation", Number(quotation.finalTotal) === 840);

  console.log("\nStatus transition");
  const approveRes = await req(`/api/quotations/${quotation.id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status: "APPROVED" }),
  });
  assert("Pending -> Approved succeeds", approveRes.status === 200);

  console.log("\nPDF");
  const pdfRes = await req(`/api/quotations/${quotation.id}/pdf`);
  assert("pdf endpoint returns 200", pdfRes.status === 200);
  assert(
    "pdf content-type is application/pdf",
    (pdfRes.headers.get("content-type") ?? "").includes("application/pdf")
  );
  const pdfBuffer = await pdfRes.arrayBuffer();
  assert("pdf has non-trivial byte length", pdfBuffer.byteLength > 1000);

  console.log("\nReports & dashboard");
  const reportRes = await req("/api/reports/sales");
  assert("sales report endpoint returns 200", reportRes.status === 200);

  const summaryRes = await req("/api/dashboard/summary");
  const summary = (await summaryRes.json()) as { counts: { total: number } };
  assert("dashboard summary returns 200", summaryRes.status === 200);
  assert("dashboard total count > 0", summary.counts.total > 0);

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
