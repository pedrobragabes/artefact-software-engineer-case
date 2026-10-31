import assert from "node:assert/strict";
import { test } from "node:test";
import { randomUUID } from "node:crypto";
import { createCaller } from "../src/server/routers";
import { createTaskStore } from "../src/server/store/tasks";

function setup() {
  return createCaller({ store: createTaskStore() }).tasks;
}

test("create trims fields, generates unique IDs and valid server timestamps; list is deterministic", async () => {
  const tasks = setup();
  assert.deepEqual(await tasks.list(), []);
  const before = Date.now();
  const first = await tasks.create({
    titulo: "  Draft proposal  ",
    descricao: "  Example  ",
  });
  const second = await tasks.create({ titulo: "Review proposal" });
  assert.equal(first.titulo, "Draft proposal");
  assert.equal(first.descricao, "Example");
  assert.equal(second.descricao, undefined);
  assert.notEqual(first.id, second.id);
  assert.match(first.id, /^[0-9a-f-]{36}$/);
  assert.ok(
    Date.parse(first.dataCriacao) >= before &&
      Date.parse(first.dataCriacao) <= Date.now(),
  );
  const expected = [first, second].sort(
    (a, b) =>
      b.dataCriacao.localeCompare(a.dataCriacao) || a.id.localeCompare(b.id),
  );
  assert.deepEqual(await tasks.list(), expected);
});

test("rejects empty, whitespace, missing, oversized and non-string titles", async () => {
  const tasks = setup();
  for (const input of [
    { titulo: "" },
    { titulo: " \n " },
    {},
    { titulo: "x".repeat(201) },
    { titulo: 42 },
    { titulo: "OK", descricao: "x".repeat(5001) },
  ]) {
    await assert.rejects(tasks.create(input as never), { code: "BAD_REQUEST" });
  }
  assert.deepEqual(await tasks.list(), []);
});

test("rejects client-supplied IDs and creation dates", async () => {
  const tasks = setup();
  await assert.rejects(
    tasks.create({ titulo: "Test", id: randomUUID() } as never),
    { code: "BAD_REQUEST" },
  );
  await assert.rejects(
    tasks.create({ titulo: "Test", dataCriacao: "2000-01-01" } as never),
    { code: "BAD_REQUEST" },
  );
});

test("update preserves ID/date, can clear description, rejects invalid edits without mutation", async () => {
  const tasks = setup();
  const task = await tasks.create({ titulo: "Before", descricao: "Note" });
  const updated = await tasks.update({ id: task.id, titulo: " After " });
  assert.deepEqual(updated, { ...task, titulo: "After", descricao: undefined });
  await assert.rejects(tasks.update({ id: task.id, titulo: "  " }), {
    code: "BAD_REQUEST",
  });
  await assert.rejects(
    tasks.update({ id: task.id, titulo: "Bad", dataCriacao: "2000" } as never),
    { code: "BAD_REQUEST" },
  );
  assert.deepEqual(await tasks.list(), [updated]);
});

test("missing and malformed IDs produce NOT_FOUND and BAD_REQUEST", async () => {
  const tasks = setup();
  await assert.rejects(tasks.update({ id: randomUUID(), titulo: "Missing" }), {
    code: "NOT_FOUND",
  });
  await assert.rejects(tasks.delete({ id: randomUUID() }), {
    code: "NOT_FOUND",
  });
  await assert.rejects(tasks.update({ id: "invalid", titulo: "Invalid" }), {
    code: "BAD_REQUEST",
  });
  await assert.rejects(tasks.delete({ id: "" }), { code: "BAD_REQUEST" });
});

test("delete confirms the removed ID and rejects repeated deletion", async () => {
  const tasks = setup();
  const task = await tasks.create({ titulo: "Delete me" });
  assert.deepEqual(await tasks.delete({ id: task.id }), {
    id: task.id,
    deleted: true,
  });
  assert.deepEqual(await tasks.list(), []);
  await assert.rejects(tasks.delete({ id: task.id }), { code: "NOT_FOUND" });
});

test("store outputs cannot mutate internal data and stores are isolated", () => {
  const store = createTaskStore();
  const created = store.create({ titulo: "Original" });
  created.titulo = "Changed outside";
  store.list()[0].titulo = "Changed list";
  assert.equal(store.list()[0].titulo, "Original");
  assert.deepEqual(createTaskStore().list(), []);
});
