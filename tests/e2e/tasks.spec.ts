import { test, expect } from "@playwright/test";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { randomUUID } from "node:crypto";
import type { AppRouter } from "../../src/server/routers";

const api = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "http://127.0.0.1:3100/api/trpc" })],
});

test.beforeEach(async () => {
  let page = await api.tasks.list.query();
  while (page.items.length) {
    for (const task of page.items)
      await api.tasks.delete.mutate({ id: task.id });
    page = await api.tasks.list.query();
  }
});

test("empty state and full create, edit, reload, delete flow", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page.getByText("No tasks yet.")).toBeVisible();
  await page.getByRole("link", { name: "New Task" }).click();
  await page.getByLabel("Title (required)").fill("  Prepare demo  ");
  await page
    .getByLabel("Description (optional)")
    .fill("Review the sample tasks.");
  await page.getByRole("button", { name: "Create Task" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Task created successfully.",
  );
  await expect(
    page.getByRole("heading", { name: "Prepare demo" }),
  ).toBeVisible();
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await page.reload();
  await expect(page.getByRole("status")).toBeEmpty();
  await expect(
    page.getByRole("heading", { name: "Prepare demo" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Edit Prepare demo" }).click();
  await expect(page.getByLabel("Title (required)")).toHaveValue("Prepare demo");
  await page.getByLabel("Title (required)").fill("Demo ready");
  await page.getByLabel("Description (optional)").fill("");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Task updated successfully.",
  );
  await expect(page.getByRole("heading", { name: "Demo ready" })).toBeVisible();
  await expect(page.getByText("Review the sample tasks.")).toHaveCount(0);
  await expect(page).toHaveURL("http://127.0.0.1:3100/");
  await page.reload();
  await expect(page.getByRole("status")).toBeEmpty();
  await expect(page.getByRole("heading", { name: "Demo ready" })).toBeVisible();
  await page.getByRole("button", { name: "Delete Demo ready" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Task deleted successfully.",
  );
  await expect(page.getByText("No tasks yet.")).toBeVisible();
  await page.reload();
  await expect(page.getByRole("status")).toBeEmpty();
  await expect(page.getByText("No tasks yet.")).toBeVisible();
  expect(errors).toEqual([]);
});

test("HTTP-created data is in initial HTML and visible without JavaScript", async ({
  browser,
  request,
}) => {
  const title = `SSR proof ${randomUUID()}`;
  await api.tasks.create.mutate({ titulo: title });
  const response = await request.get("/");
  expect(response.ok()).toBeTruthy();
  const html = (await response.text()).replace(
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  expect(html).toContain(title);
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:3100/");
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await context.close();
});

test("client validation rejects empty and whitespace titles", async ({
  page,
}) => {
  await page.goto("/tasks/new");
  await page.getByRole("button", { name: "Create Task" }).click();
  await expect(
    page.getByText("Title is required.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Title (required)").fill("   ");
  await page.getByRole("button", { name: "Create Task" }).click();
  await expect(page.getByLabel("Title (required)")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect((await api.tasks.list.query()).items).toEqual([]);
});

test("pending submission disables controls and failure preserves input for retry", async ({
  page,
}) => {
  await page.goto("/tasks/new");
  await page.getByLabel("Title (required)").fill("Retry example");
  let release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/trpc/**", async (route) => {
    await wait;
    await route.abort();
  });
  await page.getByRole("button", { name: "Create Task" }).click();
  await expect(page.getByRole("button", { name: "Saving…" })).toBeDisabled();
  await expect(page.getByLabel("Title (required)")).toBeDisabled();
  await expect(page.getByRole("status")).toHaveText("Saving your task…");
  release();
  await expect(
    page.getByText("Unable to complete this action. Please try again."),
  ).toBeVisible();
  await expect(page.getByLabel("Title (required)")).toHaveValue(
    "Retry example",
  );
  await page.unroute("**/api/trpc/**");
  await page.getByRole("button", { name: "Create Task" }).click();
  await expect(
    page.getByRole("heading", { name: "Retry example" }),
  ).toBeVisible();
});

test("backend NOT_FOUND is shown when editing or deleting stale data", async ({
  page,
}) => {
  const task = await api.tasks.create.mutate({ titulo: "Stale edit" });
  await page.goto(`/tasks/${task.id}/edit`);
  await api.tasks.delete.mutate({ id: task.id });
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(
    page.getByText(
      "Task not found. It may have been deleted. Return to the task list and try again.",
    ),
  ).toBeVisible();
  const other = await api.tasks.create.mutate({ titulo: "Stale delete" });
  await page.goto("/");
  await api.tasks.delete.mutate({ id: other.id });
  await page.getByRole("button", { name: "Delete Stale delete" }).click();
  await expect(
    page.getByRole("region", { name: "Task list" }).getByRole("alert"),
  ).toContainText("Task not found.");
});

test("delete loading and network failure leave the task available", async ({
  page,
}) => {
  await api.tasks.create.mutate({ titulo: "Keep this task" });
  await page.goto("/");
  let release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/trpc/**", async (route) => {
    await wait;
    await route.abort();
  });
  await page.getByRole("button", { name: "Delete Keep this task" }).click();
  await expect(
    page.getByRole("button", { name: "Delete Keep this task" }),
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Delete Keep this task" }),
  ).toHaveText("Deleting…");
  release();
  await expect(
    page.getByRole("region", { name: "Task list" }).getByRole("alert"),
  ).toContainText("Unable to complete this action.");
  await expect(
    page.getByRole("heading", { name: "Keep this task" }),
  ).toBeVisible();
});

test("missing and malformed edit routes show a useful not-found page", async ({
  page,
}) => {
  for (const id of ["invalid", randomUUID()]) {
    await page.goto(`/tasks/${id}/edit`);
    await expect(
      page.getByRole("heading", { name: "Page not found" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to tasks", exact: true }),
    ).toBeVisible();
  }
});

test("mobile layout supports keyboard navigation and long task text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/tasks/new");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Skip to content" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Title (required)")).toBeFocused();
  await page.keyboard.type("A".repeat(200));
  await page.keyboard.press("Tab");
  await expect(page.getByLabel("Description (optional)")).toBeFocused();
  await page.keyboard.type("A sample description.");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "A".repeat(200) }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("button", { name: `Delete ${"A".repeat(200)}` }).click();
  await expect(page.getByText("No tasks yet.")).toBeVisible();
});

test("HTTP rejects invalid input and does not expose stack traces", async () => {
  await expect(api.tasks.create.mutate({ titulo: " " })).rejects.toMatchObject({
    data: { code: "BAD_REQUEST" },
  });
  try {
    await api.tasks.delete.mutate({ id: randomUUID() });
    throw new Error("Expected NOT_FOUND");
  } catch (error) {
    expect(error).toMatchObject({ data: { code: "NOT_FOUND" } });
    expect((error as { data: { stack?: string } }).data.stack).toBeUndefined();
  }
});

test("SSR delivers the first page and scrolling loads the remaining tasks once", async ({
  page,
  request,
}) => {
  for (let i = 0; i < 23; i++)
    await api.tasks.create.mutate({ titulo: `Scroll task ${i}` });
  const first = await api.tasks.list.query();
  const html = (await (await request.get("/")).text()).replace(
    /<script\b[^>]*>[\s\S]*?<\/script>/gi,
    "",
  );
  for (const task of first.items) expect(html).toContain(task.titulo);
  const second = await api.tasks.list.query({ cursor: first.nextCursor! });
  expect(html).not.toContain(`<h2>${second.items[0].titulo}</h2>`);
  await page.goto("/");
  const cards = page
    .getByRole("region", { name: "Task list" })
    .getByRole("listitem");
  await expect(cards).toHaveCount(10);
  await page
    .getByRole("button", { name: "Load More" })
    .scrollIntoViewIfNeeded();
  await expect(cards).toHaveCount(20);
  await page
    .getByRole("button", { name: "Load More" })
    .scrollIntoViewIfNeeded();
  await expect(cards).toHaveCount(23);
  await expect(page.getByRole("button", { name: "Load More" })).toHaveCount(0);
  expect(new Set(await cards.getByRole("heading").allTextContents()).size).toBe(
    23,
  );
  const last = await cards.last().getByRole("heading").innerText();
  await page.getByRole("link", { name: `Edit ${last}`, exact: true }).click();
  await page.getByLabel("Title (required)").fill("Edited from a later page");
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Task updated successfully.",
  );
  for (let i = 0; i < 2; i++) {
    await page
      .getByRole("button", { name: "Load More" })
      .scrollIntoViewIfNeeded();
    await expect(cards).toHaveCount(i === 0 ? 20 : 23);
  }
  await expect(
    page.getByRole("heading", { name: "Edited from a later page" }),
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Delete Edited from a later page",
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toHaveText(
    "Task deleted successfully.",
  );
  await expect(
    page.getByRole("heading", { name: "Edited from a later page" }),
  ).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("status")).toBeEmpty();
  expect((await api.tasks.list.query({ limit: 50 })).items).toHaveLength(22);
});

test("load-more errors pause automatic retries and allow a keyboard retry", async ({
  page,
}) => {
  for (let i = 0; i < 12; i++)
    await api.tasks.create.mutate({ titulo: `Retry page ${i}` });
  await page.goto("/");
  let calls = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/trpc/tasks.list*", async (route) => {
    calls++;
    await pending;
    await route.abort();
  });
  await page
    .getByRole("button", { name: "Load More" })
    .scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Loading…" })).toBeDisabled();
  release();
  await expect(
    page.getByText("Could not load more tasks. Please try again."),
  ).toBeVisible();
  await expect(page.getByRole("listitem")).toHaveCount(10);
  expect(calls).toBe(1);
  await page.unroute("**/api/trpc/tasks.list*");
  await page.getByRole("button", { name: "Try again", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listitem")).toHaveCount(12);
  await expect(
    page.getByText("Could not load more tasks. Please try again."),
  ).toHaveCount(0);
});

test("manual load-more works without IntersectionObserver", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Reflect.deleteProperty(window, "IntersectionObserver");
  });
  for (let i = 0; i < 11; i++)
    await api.tasks.create.mutate({ titulo: `Manual task ${i}` });
  await page.goto("/");
  await page.getByRole("button", { name: "Load More" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listitem")).toHaveCount(11);
});
