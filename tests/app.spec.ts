import { test, expect, Page } from "@playwright/test";
import { Buffer } from "node:buffer";
async function boot(page: Page) {
  await page.goto("/");
  await expect(
    page.getByText("Confidence in every hire.", { exact: true }),
  ).toBeVisible();
}
async function nav(page: Page, label: string) {
  await page
    .getByRole("button", { name: `Navigate to ${label}`, exact: true })
    .click();
}
async function portal(page: Page, role: string) {
  await page
    .getByRole("button", { name: "Switch portal", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Open ${role} portal`, exact: true })
    .click();
  await expect(
    page.getByText("One platform. Three perspectives.", { exact: true }),
  ).toHaveCount(0);
}
test("dashboard renders charts, navigation and a polished desktop layout", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await boot(page);
  await expect(
    page.getByText("Verification overview", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Recent candidates", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "7 days", exact: true }).click();
  await page.getByRole("button", { name: "30 days", exact: true }).click();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});
test("candidate search, empty state, status filters and pagination work", async ({
  page,
}) => {
  await boot(page);
  await nav(page, "Candidates");
  const search = page.getByRole("textbox", {
    name: "Search candidates...",
    exact: true,
  });
  await search.fill("Olivia Rhye");
  await expect(
    page.getByRole("button", { name: "View Olivia Rhye", exact: true }),
  ).toBeVisible();
  await search.fill("Nobody Exists 123");
  await expect(
    page.getByText("No candidates found", { exact: true }),
  ).toBeVisible();
  await search.fill("");
  await page.getByRole("button", { name: "Completed", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "View Phoenix Baker", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("2 / 17", { exact: true })).toBeVisible();
});
test("new verification validates input and persists after reload", async ({
  page,
}) => {
  await boot(page);
  await page
    .getByRole("button", { name: "New verification", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Create verification", exact: true })
    .click();
  await expect(
    page.getByText(
      "Enter the candidate’s full name and a valid email address.",
    ),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Candidate full name", exact: true })
    .fill("Jamie Testerson");
  await page
    .getByRole("textbox", { name: "Candidate email", exact: true })
    .fill("jamie@example.com");
  await page
    .getByRole("button", { name: "Create verification", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "View Jamie Testerson", exact: true }),
  ).toBeVisible();
  await page.reload();
  await nav(page, "Candidates");
  await page
    .getByRole("textbox", { name: "Search candidates...", exact: true })
    .fill("Jamie Testerson");
  await expect(
    page.getByRole("button", { name: "View Jamie Testerson", exact: true }),
  ).toBeVisible();
});
test("client portal is limited to its organization and hides admin controls", async ({
  page,
}) => {
  await boot(page);
  await portal(page, "Client");
  await expect(
    page.getByText("A clearer view of your next hires.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Navigate to Clients", exact: true }),
  ).toHaveCount(0);
  await nav(page, "Candidates");
  await page
    .getByRole("textbox", { name: "Search candidates...", exact: true })
    .fill("Phoenix Baker");
  await expect(
    page.getByText("No candidates found", { exact: true }),
  ).toBeVisible();
  await nav(page, "Settings");
  await expect(
    page.getByText("A little more you.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("switch", { name: "Maintenance mode", exact: true }),
  ).toHaveCount(0);
});
test("maintenance restriction is enforced across portals and survives reload", async ({
  page,
}) => {
  await boot(page);
  await nav(page, "Settings");
  await page
    .getByRole("switch", { name: "Maintenance mode", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await portal(page, "Candidate");
  await expect(
    page.getByRole("heading", { name: "We’ll be right back.", exact: true }),
  ).toBeVisible();
  await portal(page, "Admin");
  await nav(page, "Settings");
  await expect(
    page.getByRole("switch", { name: "Maintenance mode", exact: true }),
  ).toBeChecked();
  await page.reload();
  await nav(page, "Settings");
  await expect(
    page.getByRole("switch", { name: "Maintenance mode", exact: true }),
  ).toBeChecked();
});
test("upload and new-case permissions disable actions", async ({ page }) => {
  await boot(page);
  await nav(page, "Settings");
  await page
    .getByRole("switch", { name: "Document uploads", exact: true })
    .click();
  await page
    .getByRole("switch", { name: "New verifications", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await nav(page, "Overview");
  await expect(
    page.getByRole("button", { name: "New verification", exact: true }),
  ).toBeDisabled();
  await portal(page, "Candidate");
  await nav(page, "Document checklist");
  await expect(
    page.getByRole("button", {
      name: "Upload Grama Niladhari certificate for Address verification",
      exact: true,
    }),
  ).toBeDisabled();
});
test("candidate uploads a real file, admin approves it, and file persists", async ({
  page,
}) => {
  await boot(page);
  await portal(page, "Candidate");
  await nav(page, "Document checklist");
  await page
    .getByRole("button", {
      name: "Upload Grama Niladhari certificate for Address verification",
      exact: true,
    })
    .click();
  await expect(
    page.getByText("Your documents, your consent", { exact: true }),
  ).toBeVisible();
  const chooser = page.waitForEvent("filechooser");
  await page
    .getByRole("button", { name: "I agree and continue", exact: true })
    .click();
  await (
    await chooser
  ).setFiles({
    name: "sample-certificate.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from(
      "%PDF-1.4\nSample document for automated testing\n%%EOF",
    ),
  });
  await expect(
    page.getByRole("button", {
      name: "Download sample-certificate.pdf",
      exact: true,
    }),
  ).toBeVisible();
  await portal(page, "Admin");
  await page
    .getByRole("button", { name: "View Olivia Rhye", exact: true })
    .click();
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(
    page.getByText("Approved", { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to workspace", exact: true })
    .click();
  await page.reload();
  await nav(page, "Document checklist");
  await expect(
    page.getByRole("button", {
      name: "Download sample-certificate.pdf",
      exact: true,
    }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Download sample-certificate.pdf",
      exact: true,
    })
    .click();
  expect((await download).suggestedFilename()).toBe("sample-certificate.pdf");
  await page
    .getByRole("button", { name: "Remove sample-certificate.pdf", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove document", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "Upload Grama Niladhari certificate for Address verification",
      exact: true,
    }),
  ).toBeVisible();
});
test("checklist edits appear in candidate portal and persist", async ({
  page,
}) => {
  await boot(page);
  await nav(page, "Document checklist");
  await page
    .getByRole("button", { name: "Edit Address verification", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Required documents", exact: true })
    .fill(
      "Grama Niladhari certificate\nCopy of National Identity Card\nCopy of utility bill\nProof of residency",
    );
  await page
    .getByRole("button", { name: "Save checklist item", exact: true })
    .click();
  await portal(page, "Candidate");
  await nav(page, "Document checklist");
  await expect(
    page.getByRole("button", {
      name: "Upload Proof of residency for Address verification",
      exact: true,
    }),
  ).toBeVisible();
});
test("reports export a downloadable CSV", async ({ page }) => {
  await boot(page);
  await nav(page, "Reports & activity");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export CSV", exact: true }).click();
  expect((await download).suggestedFilename()).toBe(
    "bgv-verification-report.csv",
  );
  await page.getByRole("button", { name: "Activity log", exact: true }).click();
  await expect(
    page.getByText("Workspace audit trail", { exact: true }),
  ).toBeVisible();
});
test("global search opens a candidate detail", async ({ page }) => {
  await boot(page);
  await page
    .getByRole("button", { name: "Search workspace", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Search your workspace...", exact: true })
    .fill("Lana Steiner");
  await page
    .getByRole("button", { name: "Search result Lana Steiner", exact: true })
    .click();
  await expect(
    page.getByText("CANDIDATE VERIFICATION", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText("lana.steiner@example.com", { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
});
test("clients can be created and selected for a new case", async ({ page }) => {
  await boot(page);
  await nav(page, "Clients");
  await page.getByRole("button", { name: "Add client", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Organization name", exact: true })
    .fill("Northstar Test");
  await page
    .getByRole("button", { name: "Create organization", exact: true })
    .click();
  await expect(
    page.getByRole("button", {
      name: "View Northstar candidates",
      exact: true,
    }),
  ).toBeVisible();
  await nav(page, "Candidates");
  await page
    .getByRole("button", { name: "New verification", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Northstar Test", exact: true }),
  ).toBeVisible();
});
test("mobile layout supports bottom tabs, candidate portal and checklist", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page);
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  await portal(page, "Candidate");
  await expect(
    page.getByText("Welcome, Olivia.", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Upload documents", exact: true })
    .click();
  await expect(
    page.getByText("Your next step starts here.", { exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: "test-results/checklist-mobile.png",
    fullPage: true,
  });
  const dimensions = await page.evaluate(() => ({
    width: window.innerWidth,
    scroll: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.width);
  await page.getByRole("tab", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "A little more you.", exact: true }),
  ).toBeVisible();
});
