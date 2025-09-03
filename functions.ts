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

export const filterAndAggregateTasks = (
  currentState: Array<TasksForDate>
): Array<TasksForDate> => {
  let newState: Array<TasksForDate> = [];

  let checkedTasksSet: Set<string> = new Set();
  let uncheckedTasksSet: Set<string> = new Set();

  for (const tfd of currentState) {
    let uncheckedTasksForDay = tfd.uncheckedTasks;
    let checkedTasksForDay = tfd.checkedTasks;

    let newUncheckedTasks: Array<string> = [];

    for (const uct of uncheckedTasksForDay) {
      if (!uncheckedTasksSet.has(uct) && !checkedTasksSet.has(uct)) {
        newUncheckedTasks.push(uct);
        uncheckedTasksSet.add(uct);
      }
    }

    for (const ct of checkedTasksForDay) {
      checkedTasksSet.add(ct);
    }

    if (newUncheckedTasks.length > 0) {
      let newTasksForDate: TasksForDate = {
        date: tfd.date,
        uncheckedTasks: newUncheckedTasks,
        checkedTasks: [],
      };
      newState.push(newTasksForDate);
    }
  }

  return newState;
};

export const generateOutput = (allFinalTasks: Array<TasksForDate>): string => {
  let output = "";

  for (const tfd of allFinalTasks) {
    output += tfd.date.toISOString().split("T")[0] + "\n";
    for (const t of tfd.uncheckedTasks) {
      output += "- [ ] " + t + "\n";
    }
    output += "\n";
  }

  return output;
};
