import {
  App,
  Plugin,
  TFile,
  MarkdownView,
  Notice,
  PluginManifest,
} from "obsidian";

const DAILY_NOTE_REGEX = /^\d{4}-\d{2}-\d{2}\.md$/; // Matches YYYY-MM-DD.md
const UNCHECKED_TASK_REGEX = /^[\t >-]*[-*+]\s+\[ \]\s.+$/; // Markdown unchecked tasks
const DEDUPLICATE = true; // Set false to keep duplicate task lines
const SORT = false; // Set true if you want alphabetical sorting
const GROUP_BY_DATE = false; // Set true to group tasks under date headings
const REVERSE_CHRONO = true; // If true, process daily notes newest (descending) so output is reverse chronological
const OVERRIDE_WITH_NEWER_CHECKED = true; // If true, a checked task in a newer note suppresses older unchecked duplicates
const CHECKED_TASK_REGEX = /^[\t >-]*[-*+]\s+\[[xX]\]\s.+$/; // Markdown checked tasks

export default class HelloWorldButtonPlugin extends Plugin {
  constructor(app: App, manifest: PluginManifest) {
    super(app, manifest);
  }

  async onload() {
    // (Optional) Keep the ribbon for a quick click action.
    this.addRibbonIcon("checkmark", "Aggregate Unchecked Daily Tasks", () => {
      this.aggregateUncheckedTasks();
    });

    this.addCommand({
      id: "aggregate-unchecked-daily-tasks",
      name: "Aggregate Unchecked Daily Tasks",
      callback: () => this.aggregateUncheckedTasks(),
    });
  }

  onunload() {
    // No cleanup needed for this simple plugin.
  }

  private async aggregateUncheckedTasks() {
    const view = this.app.workspace.getActiveViewOfType(MarkdownView);
    if (!view) {
      new Notice("Open a markdown note to insert tasks.");
      return;
    }

    // 1. Collect daily note files
    const dailyFiles: TFile[] = this.app.vault
      .getMarkdownFiles()
      .filter((f) => DAILY_NOTE_REGEX.test(f.name));

    // Sort daily files chronologically then optionally reverse for reverse-chronological processing
    dailyFiles.sort((a, b) => a.basename.localeCompare(b.basename));
    if (REVERSE_CHRONO) {
      dailyFiles.reverse();
    }

    if (dailyFiles.length === 0) {
      new Notice("No daily notes matching YYYY-MM-DD.md found.");
      return;
    }

    // 2. Read & extract tasks with override logic
    const tasksByDate: Record<string, string[]> = {};
    // We'll first read all files storing both checked and unchecked for override processing.
    const fileContents: { file: TFile; lines: string[] }[] = [];

    for (const file of dailyFiles) {
      try {
        const content = await this.app.vault.read(file);
        fileContents.push({ file, lines: content.split(/\r?\n/) });
      } catch (e) {
        console.error(`Failed reading ${file.path}:`, e);
      }
    }

    const normalizeTaskText = (line: string): string | null => {
      const m = line.match(/^[\t >-]*[-*+]\s+\[[ xX]\]\s+(.*)$/);
      return m ? m[1].trim() : null;
    };

    // Build a set of task texts that appear as CHECKED in a newer note (date-wise).
    // We iterate newest -> oldest regardless of output order.
    const filesNewestToOldest = [...fileContents].sort((a, b) =>
      b.file.basename.localeCompare(a.file.basename)
    );
    const newerChecked = new Set<string>();
    for (const { lines } of filesNewestToOldest) {
      for (const line of lines) {
        if (CHECKED_TASK_REGEX.test(line)) {
          const txt = normalizeTaskText(line);
          if (txt) newerChecked.add(txt);
        }
      }
    }

    let allTasks: string[] = [];

    // Now collect unchecked tasks, skipping those overridden by a newer checked version.
    for (const { file, lines } of REVERSE_CHRONO
      ? filesNewestToOldest
      : [...fileContents].sort((a, b) =>
          a.file.basename.localeCompare(b.file.basename)
        )) {
      const included: string[] = [];
      for (const line of lines) {
        if (UNCHECKED_TASK_REGEX.test(line)) {
          const txt = normalizeTaskText(line);
          if (
            txt &&
            OVERRIDE_WITH_NEWER_CHECKED &&
            newerChecked.has(txt) &&
            // Ensure the *current* file isn't the one providing the checked instance (i.e., only suppress if a *newer* note has it checked)
            !lines.some(
              (l) => CHECKED_TASK_REGEX.test(l) && normalizeTaskText(l) === txt
            )
          ) {
            continue; // suppressed by newer checked task
          }
          included.push(line);
          allTasks.push(line);
        }
      }
      if (included.length) {
        tasksByDate[file.basename] = included;
      }
    }

    if (allTasks.length === 0) {
      new Notice("No unchecked tasks found in daily notes.");
      return;
    }

    // 3. Optional de-duplication
    let finalTasks = allTasks;
    if (DEDUPLICATE) {
      const seen = new Set<string>();
      finalTasks = [];
      for (const t of allTasks) {
        const key = t.trim();
        if (!seen.has(key)) {
          seen.add(key);
          finalTasks.push(t);
        }
      }
    }

    // 4. Optional sorting
    if (SORT) {
      finalTasks = finalTasks
        .slice()
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    }

    // 5. Build output
    let output = "### Unchecked Tasks\n\n";
    if (GROUP_BY_DATE) {
      // Insert grouped by date (sorted chronologically)
      const dates = Object.keys(tasksByDate).sort((a, b) => a.localeCompare(b));
      if (REVERSE_CHRONO) {
        dates.reverse();
      }
      for (const date of dates) {
        const dateTasks = tasksByDate[date].filter((t) => {
          if (!DEDUPLICATE) return true;
          // If deduping, only include tasks that are in finalTasks
          return finalTasks.includes(t);
        });
        if (dateTasks.length) {
          output += `#### ${date}\n`;
          output += dateTasks.join("\n") + "\n\n";
        }
      }
    } else {
      output += finalTasks.join("\n") + "\n";
    }

    // 6. Insert at current cursor
    const editor = view.editor;
    editor.replaceSelection(output);

    new Notice(
      `Inserted ${finalTasks.length} unchecked task${
        finalTasks.length === 1 ? "" : "s"
      }.`
    );
  }
}
