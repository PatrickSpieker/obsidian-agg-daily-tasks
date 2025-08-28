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
  extractCheckedTasks,
  processTasksWithOverrides,
  createTaskOwnershipMap,
  buildFinalTasksByDate,
  buildNonGroupedTasks,
  generateOutput,
  DEDUPLICATE,
  SORT,
  REVERSE_CHRONO,
  OVERRIDE_WITH_NEWER_CHECKED,
  GROUP_BY_DATE,
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

    // 1. Get daily note files (excluding today)
    var dailyFiles = this.getDailyNoteFiles();
    if (dailyFiles.length === 0) {
      new Notice("No daily notes matching YYYY-MM-DD.md found.");
      return;
    }

    // 2. Read file contents
    const fileContents = await this.readDailyNoteFiles(dailyFiles);
    if (fileContents.length === 0) {
      new Notice("No readable daily notes found.");
      return;
    }

    // 3. Process tasks using pure functions
    const newerChecked = extractCheckedTasks(fileContents);
    const { tasksByDate, allTasks } = processTasksWithOverrides(
      fileContents,
      newerChecked,
      REVERSE_CHRONO
    );

    if (allTasks.length === 0) {
      new Notice("No unchecked tasks found in daily notes.");
      return;
    }

    // 4. Generate final output
    let finalOutput: string;
    let taskCount: number;

    if (GROUP_BY_DATE) {
      const taskOwnership = createTaskOwnershipMap(tasksByDate);
      const { finalTasksByDate, allFinalTasks } = buildFinalTasksByDate(
        tasksByDate,
        taskOwnership,
        SORT
      );
      finalOutput = generateOutput(
        finalTasksByDate,
        allFinalTasks,
        REVERSE_CHRONO
      );
      taskCount = allFinalTasks.length;
    } else {
      const finalTasks = buildNonGroupedTasks(allTasks, SORT);
      finalOutput = generateOutput({}, finalTasks, REVERSE_CHRONO);
      taskCount = finalTasks.length;
    }

    // 5. Insert output and show notice
    const editor = view.editor;
    editor.replaceSelection(finalOutput);

    new Notice(
      `Inserted ${taskCount} unchecked task${taskCount === 1 ? "" : "s"}.`
    );
  }

  private getDailyNoteFiles(): TFile[] {
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const todayFileName = `${today}.md`;

    const dailyFiles: TFile[] = this.app.vault
      .getMarkdownFiles()
      .filter((f) => DAILY_NOTE_REGEX.test(f.name) && f.name !== todayFileName);

    // Sort daily files chronologically then optionally reverse for reverse-chronological processing
    dailyFiles.sort((a, b) => a.basename.localeCompare(b.basename));
    if (REVERSE_CHRONO) {
      dailyFiles.reverse();
    }

    return dailyFiles;
  }

  private async readDailyNoteFiles(
    dailyFiles: TFile[]
  ): Promise<FileContent[]> {
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
