import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

export const punctuationRoot = path.dirname(
  path.dirname(fileURLToPath(import.meta.url)),
);

export async function withPanel(options, check) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "punctuation-panel-"));
  const socket = net.createServer();
  await new Promise((resolve) => socket.listen(0, "127.0.0.1", resolve));
  const port = socket.address().port;
  await new Promise((resolve) => socket.close(resolve));
  const url = `http://127.0.0.1:${port}`;
  const env = {
    ...process.env,
    ...options.env,
    KIRBY_BROWSER_ROOT: root,
    KIRBY_BROWSER_URL: url,
  };
  const php = process.env.PHP_BINARY || "php";
  let server, browser, page;
  let logs = "";
  try {
    for (const dir of ["site/blueprints/pages", "site/plugins", "content/home"])
      fs.mkdirSync(path.join(root, dir), { recursive: true });
    for (const [name, plugin] of Object.entries(
      options.plugins ?? { punctuation: punctuationRoot },
    ))
      fs.symlinkSync(plugin, path.join(root, "site/plugins", name));
    fs.writeFileSync(
      path.join(root, "index.php"),
      `<?php require ${JSON.stringify(path.join(punctuationRoot, "tests/browser-fixture.php"))};`,
    );
    fs.writeFileSync(
      path.join(root, "site/blueprints/pages/default.yml"),
      options.blueprint,
    );
    fs.writeFileSync(
      path.join(root, "content/home/default.txt"),
      options.content ??
        "Title: Fixture\n----\nPlain: ABC\n----\nNotes: ABC\n----\nWriter: <p><strong>ABC</strong></p>\n",
    );
    const core = execFileSync(
      php,
      [path.join(punctuationRoot, "tests/browser-fixture.php")],
      { env, encoding: "utf8" },
    ).trim();
    fs.symlinkSync(core, path.join(root, "kirby"));
    server = spawn(
      php,
      ["-S", `127.0.0.1:${port}`, "-t", root, path.join(core, "router.php")],
      { env, stdio: ["ignore", "ignore", "pipe"] },
    );
    server.stderr.on("data", (chunk) => {
      logs += chunk;
    });
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        if ((await fetch(`${url}/panel/login`)).ok) break;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    browser = await chromium.launch();
    const context = await browser.newContext({
      permissions: ["clipboard-read", "clipboard-write"],
    });
    page = await context.newPage();
    page.setDefaultTimeout(10000);
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`${url}/panel/login`);
    await page.getByLabel("Email").fill("fixture@example.test");
    await page.locator('input[type="password"]').fill("browser-fixture");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.goto(`${url}/panel/pages/home`);
    await check({ page, context, root, url, errors });
    if (errors.length > 0)
      throw new Error(`Panel runtime errors: ${errors.join("\n")}`);
  } catch (error) {
    if (page) {
      console.error(await page.locator("body").textContent());
      if (process.env.PLAYWRIGHT_SCREENSHOT)
        await page.screenshot({
          path: process.env.PLAYWRIGHT_SCREENSHOT,
          fullPage: true,
        });
    }
    console.error(
      logs
        .split("\n")
        .filter((line) => /Fatal|Warning|Exception/.test(line))
        .join("\n"),
    );
    throw error;
  } finally {
    await browser?.close();
    if (server) {
      server.kill();
      await new Promise((resolve) => server.once("exit", resolve));
    }
    fs.rmSync(root, { recursive: true, force: true });
  }
}

export { expect } from "@playwright/test";
