/* eslint no-irregular-whitespace: "off" */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { expect } from "@playwright/test";
import { withPanel } from "./browser-site.mjs";

const blueprint = `title: Fixture
fields:
  plain:
    type: text
    label: Plain
  notes:
    type: textarea
    label: Notes
  writer:
    type: writer
    label: Writer
  legend:
    type: punctuation
    label: Insert punctuation
    fieldsets:
      - label: Quotes
        help: '<span class="hidden-characters">ABC 123</span>'
        chars: ['—', ' ']
      - label: '<img src=x onerror="window.punctuationXss=true">'
        chars: ['<']
  clipboard:
    type: punctuation
    label: Copy punctuation
    clipboard: true
    fieldsets:
      - label: Spaces
        chars: [' × ']
`;

withPanel({ blueprint }, async ({ page, root }) => {
  const legend = page.locator(".k-field-name-legend");
  await expect(legend).toContainText("Insert punctuation");
  await expect(legend.locator(".hidden-characters")).toHaveText("ABC 123");
  await expect(legend.locator("img")).toHaveCount(0);
  assert.equal(await page.evaluate(() => window.punctuationXss), undefined);
  const save = async () => {
    const saved = page.waitForResponse(
      (response) =>
        response.url().includes("/changes/publish") &&
        response.request().method() === "POST",
    );
    await page.getByRole("button", { name: "Save", exact: true }).click();
    assert.equal((await saved).status(), 200);
    await expect(
      page.getByRole("button", { name: "Save", exact: true }),
    ).not.toBeVisible();
    await page.reload();
  };
  const plain = page.getByRole("textbox", { name: "Plain", exact: true });
  await plain.focus();
  await plain.evaluate((input) => input.setSelectionRange(1, 2));
  await legend.getByRole("button", { name: "U+2014", exact: true }).click();
  await expect(plain).toHaveValue("A—C");
  await legend.getByRole("button", { name: "U+2014", exact: true }).click();
  await expect(plain).toHaveValue("A——C");
  await save();
  await expect(plain).toHaveValue("A——C");
  const notes = page.getByRole("textbox", { name: "Notes", exact: true });
  await notes.focus();
  await notes.evaluate((input) => input.setSelectionRange(1, 2));
  await legend.getByRole("button", { name: "U+202F", exact: true }).click();
  await expect(notes).toHaveValue("A C");
  await save();
  await expect(notes).toHaveValue("A C");
  const writer = page.locator(".k-field-name-writer [contenteditable=true]");
  await writer.click();
  await page.keyboard.press("Home");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+ArrowRight");
  assert.equal(
    await page.evaluate(() => window.getSelection().toString()),
    "B",
  );
  await legend.getByRole("button", { name: "U+2014", exact: true }).click();
  await expect(writer).toHaveText("A—C");
  await expect(
    page.getByRole("button", { name: "Save", exact: true }),
  ).toBeVisible();
  await writer.focus();
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+z" : "Control+z",
  );
  await expect(writer).toHaveText("ABC");
  await page.keyboard.press(
    process.platform === "darwin" ? "Meta+Shift+z" : "Control+Shift+z",
  );
  await expect(writer).toHaveText("A—C");
  await save();
  await expect(writer).toHaveText("A—C");
  await expect(writer.locator("strong")).toHaveText("A—C");
  await page
    .locator(".k-field-name-clipboard")
    .getByRole("button", { name: "U+202F U+00D7 U+202F", exact: true })
    .click();
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    " × ",
  );
  await expect(
    page.getByRole("button", { name: "Save", exact: true }),
  ).not.toBeVisible();
  const stored = fs.readFileSync(
    path.join(root, "content/home/default.txt"),
    "utf8",
  );
  assert.match(stored, /<strong>A—C<\/strong>/);
  assert.doesNotMatch(stored, /(?:Legend|Clipboard):/i);
  if (process.env.PLAYWRIGHT_SCREENSHOT)
    await page.screenshot({
      path: process.env.PLAYWRIGHT_SCREENSHOT,
      fullPage: true,
    });
  process.stdout.write(
    `${String("Punctuation labels/HTML, text+textarea+Writer insertion, undo/redo, clipboard and save/reload passed.")}\n`,
  );
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
