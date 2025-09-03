import { describe, it, expect } from "vitest";
import {
  normalizeTaskText,
  parseTasksForDate,
  FileContent,
  TasksForDate,
} from "./functions";

describe("Task Processing Functions", () => {
  describe("normalizeTaskText", () => {
    it("should extract task text from unchecked task", () => {
      const result = normalizeTaskText("- [ ] Buy milk");
      expect(result).toBe("Buy milk");
    });

    it("should extract task text from checked task", () => {
      const result = normalizeTaskText("- [x] Buy eggs");
      expect(result).toBe("Buy eggs");
    });

    it("should handle indented tasks", () => {
      const result = normalizeTaskText("  - [ ] Indented task");
      expect(result).toBe("Indented task");
    });

    it("should handle tasks with different bullet types", () => {
      expect(normalizeTaskText("+ [ ] Plus bullet")).toBe("Plus bullet");
      expect(normalizeTaskText("* [X] Star bullet")).toBe("Star bullet");
    });

    it("should return null for non-task text", () => {
      const result = normalizeTaskText("Just regular text");
      expect(result).toBeNull();
    });
  });

  describe("parseTasksForDate", () => {
    it("should extract task text from checked task", () => {
      let fc: FileContent = {
        fileName: "2025-08-01.md",
        lines: ["- [x] Buy eggs", "not a task", "- [ ] Buy bananas"],
      };
      const result: TasksForDate = parseTasksForDate(fc);

      expect(result.checkedTasks[0]).toBe("Buy eggs");
      expect(result.uncheckedTasks[0]).toBe("Buy bananas");

      expect(result.checkedTasks.length).toBe(1);
      expect(result.uncheckedTasks.length).toBe(1);
    });
  });
});
