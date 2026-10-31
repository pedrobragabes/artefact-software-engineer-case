import { test, expect } from "@playwright/test";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { randomUUID } from "node:crypto";
import type { AppRouter } from "../../src/server/routers";

const api = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: "http://127.0.0.1:3100/api/trpc" })],
});

test.beforeEach(async () => {
  for (const task of await api.tasks.list.query())
    await api.tasks.delete.mutate({ id: task.id });
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
  await page.reload();
  await expect(page.getByRole("heading", { name: "Demo ready" })).toBeVisible();
  await page.getByRole("button", { name: "Delete Demo ready" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Task deleted successfully.",
  );
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
  expect(await api.tasks.list.query()).toEqual([]);
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
