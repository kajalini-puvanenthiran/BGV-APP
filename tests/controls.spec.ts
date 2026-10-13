import { test, expect, Page } from "@playwright/test";
async function start(page: Page) {
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
async function role(page: Page, value: string) {
  await page
    .getByRole("button", { name: "Switch portal", exact: true })
    .click();
  await page
    .getByRole("button", { name: `Open ${value} portal`, exact: true })
    .click();
  await expect(
    page.getByText("One platform. Three perspectives.", { exact: true }),
  ).toHaveCount(0);
}
test("disabled portal cannot use global search to bypass its restriction", async ({
  page,
}) => {
  await start(page);
  await nav(page, "Settings");
  await page
    .getByRole("switch", { name: "Candidate portal", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await role(page, "Candidate");
  await expect(
    page.getByRole("heading", {
      name: "This portal is currently restricted.",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Search workspace", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", {
      name: "Search your workspace...",
      exact: true,
    }),
  ).toHaveCount(0);
  await expect(
    page
      .getByText("This portal is restricted by your administrator.", {
        exact: true,
      })
      .filter({ visible: true }),
  ).toBeVisible();
});
test("new checklist requirements propagate to existing candidate cases", async ({
  page,
}) => {
  await start(page);
  await nav(page, "Document checklist");
  await page
    .getByRole("button", { name: "Add checklist item", exact: true })
    .click();
  await page
    .getByRole("textbox", { name: "Check name", exact: true })
    .fill("Professional membership");
  await page
    .getByRole("textbox", { name: "Required documents", exact: true })
    .fill("Membership confirmation letter");
  await page
    .getByRole("button", { name: "Save checklist item", exact: true })
    .click();
  await role(page, "Candidate");
  await nav(page, "Document checklist");
  await page
    .getByRole("textbox", {
      name: "Search checks or documents...",
      exact: true,
    })
    .fill("Professional membership");
  await expect(
    page.getByRole("button", {
      name: "Upload Membership confirmation letter for Professional membership",
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await nav(page, "Document checklist");
  await page
    .getByRole("textbox", {
      name: "Search checks or documents...",
      exact: true,
    })
    .fill("Professional membership");
  await expect(
    page.getByRole("button", {
      name: "Upload Membership confirmation letter for Professional membership",
      exact: true,
    }),
  ).toBeVisible();
});
test("appearance can be changed and persists across reloads", async ({
  page,
}) => {
  await start(page);
  await nav(page, "Settings");
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByRole("button", { name: "Light", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Save changes", exact: true }),
  ).toBeDisabled();
  await page.reload();
  const saved = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bgv-workspace-v1") || "{}"),
  );
  expect(saved.settings.theme).toBe("Light");
  await nav(page, "Settings");
  await page.getByRole("button", { name: "Appearance", exact: true }).click();
  await page.getByRole("button", { name: "Dark", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
});
test("export controls prevent report downloads", async ({ page }) => {
  await start(page);
  await nav(page, "Settings");
  await page
    .getByRole("switch", { name: "Report exports", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await nav(page, "Reports & activity");
  await expect(
    page.getByRole("button", { name: "Export CSV", exact: true }),
  ).toBeDisabled();
  await nav(page, "Overview");
  await page
    .getByRole("button", { name: "Export report", exact: true })
    .click();
  await expect(
    page
      .getByText("Report exports are disabled by your administrator.", {
        exact: true,
      })
      .filter({ visible: true }),
  ).toBeVisible();
});

// test("complete source archive can be downloaded from help", async ({
//   page,
//   request,
// }) => {
//   await start(page);
//   await page
//     .getByRole("button", { name: "Help and support", exact: true })
//     .click();
//   const pending = page.waitForEvent("download");
//   await page
//     .getByRole("button", { name: "Download source code", exact: true })
//     .click();
//   expect((await pending).suggestedFilename()).toBe("bgv-checker-source.zip");
//   const response = await request.get("/bgv-checker-source.zip");
//   expect(response.ok()).toBeTruthy();
//   const data = await response.body();
//   expect(data.subarray(0, 2).toString()).toBe("PK");
// });

// test("client checklist editor persists toggled checks", async ({ page }) => {
//   await start(page);
//   await nav(page, "Clients");
//   // open checklist editor for first client card
//   await page
//     .getByRole("button", { name: "Edit checklist", exact: true })
//     .first()
//     .click();
//   // confirm dialog is open
//   await expect(
//     page.getByRole("heading", { name: /Checklist$/, exact: false }),
//   ).toBeVisible();
//   // click "Clear all" to deselect every check
//   await page
//     .getByRole("button", { name: "Clear all", exact: true })
//     .click();
//   // save
//   await page
//     .getByRole("button", { name: "Save checklist", exact: true })
//     .click();
//   // reopen to confirm persistence
//   await page
//     .getByRole("button", { name: "Edit checklist", exact: true })
//     .first()
//     .click();
//   await expect(
//     page.getByRole("heading", { name: /Checklist$/, exact: false }),
//   ).toBeVisible();
//   // count visible switches — all should be off (value false)
//   const switches = page.getByRole("switch");
//   const count = await switches.count();
//   for (let i = 0; i < count; i++) {
//     await expect(switches.nth(i)).not.toBeChecked();
//   }
//   // restore by clicking Select all and saving
//   await page
//     .getByRole("button", { name: "Select all", exact: true })
//     .click();
//   await page
//     .getByRole("button", { name: "Save checklist", exact: true })
//     .click();
// });

// test("new verification assigns only client-selected checks", async ({
//   page,
// }) => {
//   await start(page);
//   // first set a restricted checklist for the first client
//   await nav(page, "Clients");
//   await page
//     .getByRole("button", { name: "Edit checklist", exact: true })
//     .first()
//     .click();
//   await page
//     .getByRole("button", { name: "Clear all", exact: true })
//     .click();
//   // toggle on just the first check
//   await page.getByRole("switch").first().click();
//   await page
//     .getByRole("button", { name: "Save checklist", exact: true })
//     .click();
//   // now create a new verification
//   await page
//     .getByRole("button", { name: "New verification", exact: false })
//     .first()
//     .click();
//   await page
//     .getByRole("textbox", { name: "Candidate full name", exact: true })
//     .fill("Test Candidate");
//   await page
//     .getByRole("textbox", { name: "Candidate email", exact: true })
//     .fill("test@example.com");
//   await page
//     .getByRole("button", { name: "Next: Checklist", exact: true })
//     .click();
//   // only 1 check should be selected (the one we toggled on)
//   await expect(
//     page.getByText("1 of", { exact: false }),
//   ).toBeVisible();
//   await page
//     .getByRole("button", { name: "Create verification", exact: true })
//     .click();
//   // restore the client checklist
//   await nav(page, "Clients");
//   await page
//     .getByRole("button", { name: "Edit checklist", exact: true })
//     .first()
//     .click();
//   await page
//     .getByRole("button", { name: "Select all", exact: true })
//     .click();
//   await page
//     .getByRole("button", { name: "Save checklist", exact: true })
//     .click();
// });

// test("candidate selection for related client is not locked to default", async ({
//   page,
// }) => {
//   await start(page);
//   await nav(page, "Candidates");

//   // Filter candidates by related client "Linear Technologies"
//   await page.getByRole("button", { name: "Linear Technologies", exact: true }).click();
//   await expect(page.getByRole("button", { name: "View Phoenix Baker", exact: true })).toBeVisible();

//   // Open candidate selector for related client
//   await page.getByRole("button", { name: "Select candidate", exact: true }).click();
//   await expect(page.getByRole("heading", { name: "Select candidate for client", exact: true })).toBeVisible();

//   // Select Phoenix Baker
//   await page.getByRole("button", { name: "Select candidate Phoenix Baker for Linear Technologies", exact: true }).click();

//   // Switch to Candidate portal
//   await role(page, "Candidate");

//   // Candidate portal should now reflect Phoenix Baker instead of the default Olivia Rhye
//   await expect(page.getByText("Phoenix Baker (Linear Technologies)", { exact: false })).toBeVisible();

//   // Switch to another candidate from another related client "Vertex Solutions"
//   await page.getByRole("button", { name: "Switch candidate", exact: true }).first().click();
//   await page.getByRole("button", { name: "Vertex Solutions", exact: true }).click();
//   await page.getByRole("button", { name: "Select candidate Lana Steiner for Vertex Solutions", exact: true }).click();

//   // Candidate portal updates to Lana Steiner
//   await expect(page.getByText("Lana Steiner (Vertex Solutions)", { exact: false })).toBeVisible();

//   // Persistence across reloads
//   await page.reload();
//   await expect(page.getByText("Lana Steiner (Vertex Solutions)", { exact: false })).toBeVisible();
// });


