// Pure functions extracted for testing (without Obsidian dependencies)

// Types for data processing
export interface FileContent {
  fileName: string;
  lines: string[];
}

export interface TasksForDate {
  date: Date;
  uncheckedTasks: Array<string>;
  checkedTasks: Array<string>;
}

const CHECKED_TASK_REGEX = /^[\t >-]*[-*+]\s+\[[xX]\]\s.+$/;
const UNCHECKED_TASK_REGEX = /^[\t >-]*[-*+]\s+\[ \]\s.+$/;

// Pure functions for data manipulation
export const normalizeTaskText = (line: string): string | null => {
  const m = line.match(/^[\t >-]*[-*+]\s+\[[ xX]\]\s+(.*)$/);
  return m ? m[1].trim() : null;
};

// export const getCurrentTasksStateSortedByDate = (
//   vaultContents: Promise<FileContent[]>
// ): Array<TasksForDate> => {
//   let sortedCurrentTasksState: Array<TasksForDate> = [];
//   return sortedCurrentTasksState;
// };

export const parseTasksForDate = (noteContents: FileContent): TasksForDate => {
  let uncheckedTasks = [];
  let checkedTasks = [];
  for (const line of noteContents.lines) {
    if (CHECKED_TASK_REGEX.test(line)) {
      const txt = normalizeTaskText(line);
      checkedTasks.push(txt);
    } else if (UNCHECKED_TASK_REGEX.test(line)) {
      const txt = normalizeTaskText(line);
      uncheckedTasks.push(txt);
    }
  }

  let tfd: TasksForDate = {
    // assuming iso xxxx here
    date: new Date(noteContents.fileName.slice(0, -3)),
    uncheckedTasks: uncheckedTasks,
    checkedTasks: checkedTasks,
  };
  return tfd;
};

export const generateOutput = (allFinalTasks: string[]): string => {
  let output = "";

  return output;
};
