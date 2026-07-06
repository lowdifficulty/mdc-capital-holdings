import { describe, expect, it } from "vitest";
import { mergeWellnessData } from "@/lib/wellness/merge";
import { emptyWellnessData } from "@/lib/wellness/types";

describe("mergeWellnessData", () => {
  it("unions checkoff arrays", () => {
    const a = emptyWellnessData("2026-01-01T00:00:00.000Z");
    const b = emptyWellnessData("2026-01-02T00:00:00.000Z");
    a.peptideCheckoffs = ["dose-1"];
    b.peptideCheckoffs = ["dose-2"];
    const merged = mergeWellnessData(a, b);
    expect(merged.peptideCheckoffs.sort()).toEqual(["dose-1", "dose-2"]);
    expect(merged.updatedAt).toBe("2026-01-02T00:00:00.000Z");
  });

  it("merges journal todos by id", () => {
    const a = emptyWellnessData("2026-01-01T00:00:00.000Z");
    const b = emptyWellnessData("2026-01-02T00:00:00.000Z");
    a.dayJournals["2026-07-05"] = {
      note: "short",
      todos: [{ id: "1", text: "Pick up kids", done: false }],
      custodyTodos: [],
    };
    b.dayJournals["2026-07-05"] = {
      note: "longer note",
      todos: [{ id: "1", text: "Pick up kids", done: true }],
      custodyTodos: [],
    };
    const merged = mergeWellnessData(a, b);
    expect(merged.dayJournals["2026-07-05"].note).toBe("longer note");
    expect(merged.dayJournals["2026-07-05"].todos[0].done).toBe(true);
  });
});
