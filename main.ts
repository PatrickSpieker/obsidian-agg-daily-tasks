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

// Import pure functions from separate module
import {
  FileContent,
  generateOutput,
  parseTasksForDate,
  filterAndAggregateTasks,
  TasksForDate,
} from "./functions";

export default class AggDailyTasksPlugin extends Plugin {
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

    // 1. Get file contents
    const fileContents: FileContent[] =
      await this.getDailyNoteFilesWithContents();
    if (fileContents.length === 0) {
      new Notice("No readable daily notes found.");
      return;
    }

    // Extract all tasks into
    // current state - [TasksForDate], sorted by string

    let sortedCurrentTasksState: Array<TasksForDate> = [];

    for (const fc of fileContents) {
      const tfd = parseTasksForDate(fc);
      sortedCurrentTasksState.push(tfd);
    }

    sortedCurrentTasksState = sortedCurrentTasksState.sort((a, b) => {
      return b.date.getTime() - a.date.getTime();
    });

    let sortedNewTasksState: Array<TasksForDate> = filterAndAggregateTasks(
      sortedCurrentTasksState
    );

    if (sortedNewTasksState.length === 0) {
      new Notice("No unchecked tasks found in daily notes.");
      return;
    }

    // 4. Generate final output
    let finalOutput: string;
    let taskCount = 0;

    for (const t of sortedNewTasksState) {
      taskCount += t.uncheckedTasks.length;
    }
    finalOutput = generateOutput(sortedNewTasksState);

    // 5. Insert output and show notice
    const editor = view.editor;
    editor.replaceSelection(finalOutput);

    new Notice(
      `Inserted ${taskCount} unchecked task${taskCount === 1 ? "" : "s"}.`
    );
  }

  /**
   *
   * @returns Promise of an Array of descending order by date FileContent objects for the daily notes
   */
  private async getDailyNoteFilesWithContents(): Promise<FileContent[]> {
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const todayFileName = `${today}.md`;

    const dailyFiles: TFile[] = this.app.vault
      .getMarkdownFiles()
      .filter((f) => DAILY_NOTE_REGEX.test(f.name) && f.name !== todayFileName);

    const fileContents: FileContent[] = [];

    for (const file of dailyFiles) {
      try {
        const content = await this.app.vault.read(file);
        fileContents.push({
          fileName: file.basename,
          lines: content.split(/\r?\n/),
        });
      } catch (e) {
        console.error(`Failed reading ${file.path}:`, e);
      }
    }

    return fileContents;
  }
}
