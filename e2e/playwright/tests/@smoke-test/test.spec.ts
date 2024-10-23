import { test, expect } from "@playwright/test";
import { login, uploadLicense } from "../shared";

const { execSync } = require("child_process");

test("smoke test", async ({ page }) => {
  test.setTimeout(5 * 60 * 1000); // 5 minutes
  await login(page);
  await uploadLicense(page, expect);
  await expect(page.locator("#app")).toContainText(
    "Install in airgapped environment",
    { timeout: 15000 },
  );
  await page.getByText("download App Name from the Internet").click();
  await expect(page.locator("#app")).toContainText("Installing your license");
  await expect(page.locator("h3")).toContainText("My Example Config", {
    timeout: 30000,
  });
  await page.locator("#a_bool-group").getByText("a bool field").click();
  await page.locator("#a_required_text-group").getByRole("textbox").click();
  await page
    .locator("#a_required_text-group")
    .getByRole("textbox")
    .fill("my required text field");
  await expect(page.locator("#version_sequence-group")).toContainText(
    "This version is 0",
  );
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#app")).toContainText("Results", {
    timeout: 30000,
  });
  await expect(page.locator("#app")).toContainText("Sequence is 0");
  await page.getByRole("button", { name: "Deploy" }).click();
  await page.getByRole("button", { name: "Deploy anyway" }).click();
  await expect(page.locator("#app")).toContainText("Ready", { timeout: 30000 });
  await expect(page.locator("#app")).toContainText(
    "Currently deployed version",
    { timeout: 30000 },
  );
  await expect(page.locator("#app")).toContainText("Check for update");
  await expect(page.locator("#app")).toContainText("Redeploy", {
    timeout: 15000,
  });
  await expect(page.getByText("App Name")).toBeVisible();
  await expect(page.locator(".Dashboard--appIcon")).toBeVisible();
  await expect(page.locator("p").filter({ hasText: "License" })).toBeVisible();
  await page.getByText("Configure automatic updates").click();
  await expect(page.locator(".ConfigureUpdatesModal")).toContainText("Default");
  await expect(page.locator(".ConfigureUpdatesModal")).toContainText(
    "Every 4 hours",
  );
  await expect(page.locator("label")).toContainText(
    "Enable automatic deployment",
  );
  await page.locator(".replicated-select__control").click();
  await page.waitForTimeout(1000);
  await page
    .locator(".replicated-select__option")
    .getByText("Weekly", { exact: true })
    .click();
  await page.waitForTimeout(1000);
  await expect(page.locator(".ConfigureUpdatesModal")).toContainText("Weekly");
  await expect(page.locator(".ConfigureUpdatesModal")).toContainText(
    "At 12:00 AM, only on Sunday",
  );
  await page.getByRole("button", { name: "Update", exact: true }).click();
  await expect(
    page.getByText("Automatically check for updates", { exact: true }),
  ).not.toBeVisible();
  await page
    .locator('svg.icons.clickable[data-tip="View release notes"]')
    .click();
  await expect(
    page.getByLabel("Release Notes").getByRole("paragraph"),
  ).toContainText("release notes - updates");
  await page.getByRole("button", { name: "Close" }).click();
  await page.locator('span[data-tip="View deploy logs"]').click();
  await validateDeployLogs(page, expect);
  await page.getByRole("link", { name: "Version history" }).click();
  await expect(page.locator(".currentVersion--wrapper")).toContainText(
    "Sequence 0",
  );
  await expect(page.locator("#app")).toContainText(
    "Currently deployed version",
  );
  await expect(page.locator("#app")).toContainText("Check for update");
  await expect(page.locator("#app")).toContainText(
    "Configure automatic updates",
  );
  await expect(page.getByRole("button")).toContainText("Redeploy");
  await page.getByText("Configure automatic updates").click();
  await expect(page.locator(".ConfigureUpdatesModal")).toContainText("Weekly");
  await expect(page.locator(".ConfigureUpdatesModal")).toContainText(
    "At 12:00 AM, only on Sunday",
  );
  await expect(page.locator("label")).toContainText(
    "Enable automatic deployment",
  );
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(
    page.getByText("Automatically check for updates", { exact: true }),
  ).not.toBeVisible();
  await page.locator('span[data-tip="View deploy logs"]').first().click();
  await validateDeployLogs(page, expect);
  await page.getByRole("link", { name: "Config", exact: true }).click();
  await expect(page.locator("h3")).toContainText("My Example Config");
  await expect(page.locator("#version_sequence-group")).toContainText(
    "This version is 1",
  );
  await expect(page.getByRole("combobox")).toHaveValue("option_1");
  await page.getByRole("combobox").selectOption("option_2");
  await expect(page.getByRole("combobox")).toHaveValue("option_2");
  await expect(page.getByLabel("radio_1")).toBeChecked();
  await page.getByLabel("radio_2").click();
  await expect(page.getByLabel("radio_2")).toBeChecked();
  await expect(page.getByRole("button", { name: "Save config" })).toBeVisible();
  await page.getByRole("link", { name: "Troubleshoot" }).click();
  await expect(
    page.getByRole("button", { name: "Analyze App Name" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "License" }).click();
  await expect(page.locator("#app")).toContainText("Airgap enabled");
  await expect(page.locator("#app")).toContainText("Snapshots enabled");
  await expect(
    page.getByRole("button", { name: "Sync license" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View files" }).click();
  await page.getByText("upstream", { exact: true }).click();
  await page
    .getByRole("listitem", { name: "config.yaml" })
    .locator("div")
    .click();
  await expect(page.locator(".view-lines")).toContainText("apiVersion");
  await page.getByText("Click here", { exact: true }).click();
  await expect(page.getByRole("heading")).toContainText(
    "Edit patches for your kots application",
  );
  await expect(page.getByText("Copy command").first()).toBeVisible();

  let downloadCommand = await page
    .locator(".react-prism.language-bash")
    .first()
    .textContent();
  if (!downloadCommand!.includes("download")) {
    throw new Error(
      "Expected the download command to contain the word 'download'",
    );
  }
  downloadCommand = `${downloadCommand} --overwrite`;
  console.log(downloadCommand, "\n");
  execSync(downloadCommand, { stdio: "inherit" });

  await expect(page.getByText("Copy command").last()).toBeVisible();
  let uploadCommand = await page
    .locator(".react-prism.language-bash")
    .last()
    .textContent();
  if (!uploadCommand!.includes("upload")) {
    throw new Error("Expected the upload command to contain the word 'upload'");
  }
  console.log(uploadCommand, "\n");
  execSync(uploadCommand, { stdio: "inherit" });

  await page.getByRole("button", { name: "Ok, got it!" }).click();
  await page.getByRole("link", { name: "Version history" }).click();
  await expect(page.locator("#app")).toContainText("KOTS Upload");
  await expect(
    page.getByText("Running checks", { exact: true }).first(),
  ).not.toBeVisible({ timeout: 30000 });
  await page.getByRole("button", { name: "Deploy" }).first().click();
  await page.getByRole("button", { name: "Deploy this version" }).click();
  await expect(page.locator("#app")).toContainText("Deploying");
  await expect(page.locator("#app")).toContainText(
    "Currently deployed version",
  );
  await expect(page.locator("#app")).toContainText("Application up to date.");
  await expect(page.locator(".currentVersion--wrapper")).toContainText(
    "Sequence 1",
  );
  await page.getByRole("link", { name: "Registry settings" }).click();
  await page.getByPlaceholder("artifactory.some-big-bank.com").click();
  await page.getByPlaceholder("artifactory.some-big-bank.com").fill("ttl.sh");
  await page.getByPlaceholder("username").click();
  await page.getByPlaceholder("username").fill("admin");
  await page.getByPlaceholder("password").click();
  await page.getByPlaceholder("password").fill("admin");
  await page.getByRole("button", { name: "Test connection" }).click();
  await expect(page.locator("form")).toContainText("Success!");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(
    page.getByRole("button", { name: "Save changes" }),
  ).toBeDisabled();
  await expect(page.locator(".Loader")).toBeVisible();
  await expect(page.locator("#app")).toContainText(
    "Writing manifest to image destination",
    { timeout: 30000 },
  );
  await expect(page.getByRole("button", { name: "Save changes" })).toBeEnabled({
    timeout: 60000,
  });
  await expect(page.locator(".Loader")).not.toBeVisible();
  await page.getByRole("link", { name: "Version history" }).click();
  await expect(page.locator("#app")).toContainText("Registry Change");
  await expect(page.locator("#app")).toContainText("Sequence 2");
  await page.getByRole("link", { name: "Registry settings" }).click();
  await page.getByRole("button", { name: "Stop using registry" }).click();
  await page.getByRole("button", { name: "OK" }).click();
  await expect(page.locator(".Loader")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Stop using registry" }),
  ).toBeDisabled();
  await expect(page.getByRole("button", { name: "Save changes" })).toBeEnabled({
    timeout: 30000,
  });
  await expect(page.locator(".Loader")).not.toBeVisible();
  await expect(
    page.getByPlaceholder("artifactory.some-big-bank.com"),
  ).toBeEmpty();
  await expect(page.getByPlaceholder("username")).toBeEmpty();
  await expect(page.getByPlaceholder("password")).toBeEmpty();
  await expect(page.getByPlaceholder("namespace")).toBeEmpty();
  await page.waitForTimeout(2000);
  await page.getByRole("link", { name: "Version history" }).click();
  await expect(page.locator("#app")).toContainText("Sequence 3", {
    timeout: 10000,
  });
  await expect(page.locator("#app")).toContainText("Registry Change");
  await expect(
    page.locator(".NavItem").getByText("Application", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".NavItem").getByText("GitOps", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".NavItem").getByText("Snapshots", { exact: true }),
  ).toBeVisible();
  await expect(
    page
      .locator("div")
      .filter({ hasText: /^Change passwordAdd new applicationLog out$/ })
      .getByRole("img"),
  ).toBeVisible();
  await page
    .locator(".NavItem")
    .getByText("Snapshots", { exact: true })
    .click();
  await page.getByRole("link", { name: "Settings & Schedule" }).click();
  await expect(page.locator("#app")).toContainText("Snapshot settings");
  await page.getByText("+ Add a new destination").click();
  await expect(
    page.getByRole("button", { name: "Check for Velero" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Check for Velero" }).click();
  await expect(page.getByLabel("Modal")).toContainText(
    "Velero is installed on your cluster",
  );
  await page.getByRole("button", { name: "Ok, got it!" }).click();
  await page.getByRole("link", { name: "Full Snapshots (Instance)" }).click();
  await expect(page.locator("#app")).toContainText("No snapshots yet");
  await page.getByRole("button", { name: "Start a snapshot" }).click();
  await expect(page.locator("#app")).toContainText("In Progress");
  await expect(page.locator("#app")).toContainText("Completed", {
    timeout: 300000,
  });
  await page.getByText("Learn more").click();
  await page.getByRole("button", { name: "Ok, got it!" }).click();
  await expect(page.locator("#app")).toContainText("Full Snapshots (Instance)");
  await page
    .getByRole("link", { name: "Partial Snapshots (Application)" })
    .click();
  await page.getByRole("button", { name: "Start a snapshot" }).click();
  await expect(page.locator("#app")).toContainText("Completed", {
    timeout: 30000,
  });
  await expect(page.getByText("It’s recommend that you use")).toBeVisible();
  await page.getByText("Learn more").click();
  await page.getByRole("button", { name: "Ok, got it!" }).click();
  await expect(page.locator("#app")).toContainText(
    "Partial snapshots (Application)",
  );
  await page
    .getByRole("link", { name: "Full Snapshots (Instance)", exact: true })
    .click();
  await page.locator(".SnapshotRow--wrapper").click();
  await expect(page.locator("#app")).toContainText("Snapshot timeline");
  await page.getByText("View logs").click();
  await expect(page.locator(".view-lines")).toContainText("level=info");
  await page.getByRole("button", { name: "Ok, got it!" }).click();
  await page
    .getByRole("link", { name: "Full Snapshots (Instance)", exact: true })
    .click();
  await page
    .locator('svg.icons.clickable[data-tip="Restore from this backup"]')
    .click();
  await expect(page.getByLabel("Modal")).toContainText("Restore from backup");
  await expect(page.getByLabel("Modal")).toContainText(
    "Admin Console & application",
  );
  await expect(page.getByLabel("Modal")).toContainText(
    "Application & metadata only",
  );
  await expect(page.getByLabel("Modal")).toContainText(
    "Only restores the Admin Console",
  );
  await page.getByText("Application & metadata only", { exact: true }).click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.locator("svg.icons.clickable").last().click();
  await expect(page.getByLabel("Modal")).toContainText("Delete snapshot");
  await page.getByRole("button", { name: "Delete snapshot" }).click();
  await expect(page.locator("#app")).toContainText("Deleting");
  await expect(page.locator("#app")).toContainText("No snapshots yet", {
    timeout: 30000,
  });
  await page.getByRole("link", { name: "Settings & Schedule" }).click();
  await page.getByRole("button", { name: "Update storage settings" }).click();
  await expect(page.locator("form")).toContainText("Settings updated", {
    timeout: 30000,
  });
  await page.getByRole("button", { name: "Update schedule" }).click();
  await expect(page.locator("#app")).toContainText("Schedule updated");
  await page
    .locator("div")
    .filter({ hasText: /^Change passwordAdd new applicationLog out$/ })
    .getByRole("img")
    .click();
  await page.getByText("Log out", { exact: true }).click();
  await expect(page.getByPlaceholder("password")).toBeVisible({
    timeout: 30000,
  });
  await expect(page.locator("#app")).toContainText(
    "Enter the password to access the App Name Admin Console.",
  );
  await expect(page.getByRole("button")).toContainText("Log in");
});

const validateDeployLogs = async (page, expect) => {
  await expect(page.getByText("dryrunStdout")).toBeVisible();
  await expect(page.getByText("dryrunStderr")).toBeVisible();
  await expect(page.getByText("applyStdout")).toBeVisible();
  await expect(page.getByText("applyStderr")).toBeVisible();
  await expect(page.getByText("helmStdout")).toBeVisible();
  await expect(page.getByText("helmStderr")).toBeVisible();
  await page.getByText("dryrunStderr").click();
  await page.getByText("applyStdout").click();
  await expect(page.locator(".view-lines")).toContainText("created");
  await page.getByRole("button", { name: "Ok, got it!" }).click();
};
