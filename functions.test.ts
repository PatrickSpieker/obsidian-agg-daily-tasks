import { describe, it, expect } from "vitest";
import {
  parseTaskLine,
  taskKey,
  parseTasksForDate,
  FileContent,
  TasksForDate,
  filterAndAggregateTasks,
  generateOutput,
} from "./functions";

describe("Task Processing Functions", () => {
  describe("parseTaskLine", () => {
    it("should extract task text from unchecked task", () => {
      const result = parseTaskLine("- [ ] Buy milk");
      expect(result).toEqual({ indent: "", text: "Buy milk" });
    });

    it("should extract task text from checked task", () => {
      const result = parseTaskLine("- [x] Buy eggs");
      expect(result).toEqual({ indent: "", text: "Buy eggs" });
    });

    it("should preserve indentation", () => {
      const result = parseTaskLine("  - [ ] Indented task");
      expect(result).toEqual({ indent: "  ", text: "Indented task" });
    });

    it("should handle tasks with different bullet types", () => {
      expect(parseTaskLine("+ [ ] Plus bullet")).toEqual({
        indent: "",
        text: "Plus bullet",
      });
      expect(parseTaskLine("* [X] Star bullet")).toEqual({
        indent: "",
        text: "Star bullet",
      });
    });

    it("should return null for non-task text", () => {
      const result = parseTaskLine("Just regular text");
      expect(result).toBeNull();
    });

    it("should treat differently-indented tasks as distinct via taskKey", () => {
      const t1 = parseTaskLine("- [ ] Buy milk")!;
      const t2 = parseTaskLine("  - [ ] Buy milk")!;
      expect(taskKey(t1)).not.toBe(taskKey(t2));
    });
  });

  describe("parseTasksForDate", () => {
    it("should extract checked and unchecked tasks", () => {
      let fc: FileContent = {
        fileName: "2025-08-01",
        lines: ["- [x] Buy eggs", "not a task", "- [ ] Buy bananas"],
      };
      const result: TasksForDate = parseTasksForDate(fc);

      expect(result.checkedTasks[0].text).toBe("Buy eggs");
      expect(result.uncheckedGroups[0].tasks[0].text).toBe("Buy bananas");

      expect(result.checkedTasks.length).toBe(1);
      expect(result.uncheckedGroups.length).toBe(1);
      expect(result.uncheckedGroups[0].tasks.length).toBe(1);
    });

    it("should create separate groups when non-task lines appear between tasks", () => {
      const fc: FileContent = {
        fileName: "2025-08-01",
        lines: [
          "- [ ] Task A",
          "- [ ] Task B",
          "",
          "- [ ] Task C",
          "some text",
          "- [ ] Task D",
        ],
      };
      const result = parseTasksForDate(fc);

      expect(result.uncheckedGroups.length).toBe(3);
      expect(result.uncheckedGroups[0].tasks.map((t) => t.text)).toEqual([
        "Task A",
        "Task B",
      ]);
      expect(result.uncheckedGroups[1].tasks.map((t) => t.text)).toEqual([
        "Task C",
      ]);
      expect(result.uncheckedGroups[2].tasks.map((t) => t.text)).toEqual([
        "Task D",
      ]);
    });

    it("should not break groups on checked task lines", () => {
      const fc: FileContent = {
        fileName: "2025-08-01",
        lines: ["- [ ] Task A", "- [x] Done task", "- [ ] Task B"],
      };
      const result = parseTasksForDate(fc);

      expect(result.uncheckedGroups.length).toBe(1);
      expect(result.uncheckedGroups[0].tasks.map((t) => t.text)).toEqual([
        "Task A",
        "Task B",
      ]);
      expect(result.checkedTasks.length).toBe(1);
    });

    it("should preserve indentation", () => {
      const fc: FileContent = {
        fileName: "2025-08-01",
        lines: ["- [ ] Top level", "  - [ ] Indented"],
      };
      const result = parseTasksForDate(fc);

      expect(result.uncheckedGroups[0].tasks[0].indent).toBe("");
      expect(result.uncheckedGroups[0].tasks[1].indent).toBe("  ");
    });
  });

  describe("filterAndAggregateTasks", () => {
    it("should succeed in the basic case", () => {
      let fc1: FileContent = {
        fileName: "2025-08-01",
        lines: ["- [ ] Buy eggs", "not a task", "- [ ] Buy bananas"],
      };
      let fc2: FileContent = {
        fileName: "2025-08-02",
        lines: [
          "- [x] Buy eggs",
          "not a task",
          "- [ ] Buy bananas",
          "- [ ] Buy milk",
        ],
      };
      let fc3: FileContent = {
        fileName: "2025-08-03",
        lines: ["- [x] Buy eggs", "not a task", "- [ ] Buy bananas"],
      };
      const result1: TasksForDate = parseTasksForDate(fc1);
      const result2: TasksForDate = parseTasksForDate(fc2);
      const result3: TasksForDate = parseTasksForDate(fc3);
      const fcs = [result3, result2, result1];

      const finalResult = filterAndAggregateTasks(fcs);
      expect(finalResult.length).toBe(2);
      expect(finalResult[0].date).toStrictEqual(new Date("2025-08-02"));
      expect(finalResult[1].date).toStrictEqual(new Date("2025-08-01"));
    });

    it("should treat differently-indented tasks as distinct", () => {
      const fc1: FileContent = {
        fileName: "2025-08-01",
        lines: ["  - [ ] Buy eggs"],
      };
      const fc2: FileContent = {
        fileName: "2025-08-02",
        lines: ["- [x] Buy eggs"],
      };
      const result1 = parseTasksForDate(fc1);
      const result2 = parseTasksForDate(fc2);

      // checked "- [x] Buy eggs" (no indent) should NOT remove "  - [ ] Buy eggs" (indented)
      const finalResult = filterAndAggregateTasks([result2, result1]);
      expect(finalResult.length).toBe(1);
      expect(finalResult[0].uncheckedGroups[0].tasks[0].indent).toBe("  ");
      expect(finalResult[0].uncheckedGroups[0].tasks[0].text).toBe("Buy eggs");
    });

    it("should preserve group structure through filtering", () => {
      const fc1: FileContent = {
        fileName: "2025-08-01",
        lines: ["- [ ] Task A", "- [ ] Task B", "", "- [ ] Task C"],
      };
      const fc2: FileContent = {
        fileName: "2025-08-02",
        lines: ["- [x] Task A"],
      };
      const result1 = parseTasksForDate(fc1);
      const result2 = parseTasksForDate(fc2);

      const finalResult = filterAndAggregateTasks([result2, result1]);
      expect(finalResult.length).toBe(1);
      // Task A removed from group 1, Task B remains; group 2 still has Task C
      expect(finalResult[0].uncheckedGroups.length).toBe(2);
      expect(finalResult[0].uncheckedGroups[0].tasks[0].text).toBe("Task B");
      expect(finalResult[0].uncheckedGroups[1].tasks[0].text).toBe("Task C");
    });
  });

  describe("generateOutput", () => {
    it("handles the basic case", () => {
      let fc1: FileContent = {
        fileName: "2025-08-01",
        lines: ["- [ ] Buy eggs", "not a task", "- [ ] Buy bananas"],
      };
      let fc2: FileContent = {
        fileName: "2025-08-02",
        lines: ["- [x] Buy eggs", "not a task", "- [ ] Buy bananas"],
      };
      const result1: TasksForDate = parseTasksForDate(fc1);
      const result2: TasksForDate = parseTasksForDate(fc2);
      const fcs = [result2, result1];

      const finalResult = filterAndAggregateTasks(fcs);
      expect(finalResult.length).toBe(1);

      const output = generateOutput(finalResult);
      expect(output).toBe("#### 2025-08-01\n- [ ] Buy bananas\n\n");
    });

    it("preserves indentation in output", () => {
      const tfd: TasksForDate = {
        date: new Date("2025-08-01"),
        uncheckedGroups: [
          {
            tasks: [
              { indent: "", text: "Top level" },
              { indent: "  ", text: "Indented" },
            ],
          },
        ],
        checkedTasks: [],
      };
      const output = generateOutput([tfd]);
      expect(output).toBe(
        "#### 2025-08-01\n- [ ] Top level\n  - [ ] Indented\n\n"
      );
    });

    it("adds blank lines between groups", () => {
      const tfd: TasksForDate = {
        date: new Date("2025-08-01"),
        uncheckedGroups: [
          { tasks: [{ indent: "", text: "Group 1 task" }] },
          { tasks: [{ indent: "", text: "Group 2 task" }] },
        ],
        checkedTasks: [],
      };
      const output = generateOutput([tfd]);
      expect(output).toBe(
        "#### 2025-08-01\n- [ ] Group 1 task\n\n- [ ] Group 2 task\n\n"
      );
    });
  });
});
