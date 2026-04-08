// Pure functions extracted for testing (without Obsidian dependencies)

// Types for data processing
export interface FileContent {
  fileName: string;
  lines: string[];
}

export interface Task {
  indent: string; // leading whitespace before bullet
  text: string; // content after checkbox
}

export interface TaskGroup {
  tasks: Task[];
}

export interface TasksForDate {
  date: Date;
  uncheckedGroups: TaskGroup[];
  checkedTasks: Task[];
}

const CHECKED_TASK_REGEX = /^[\t >-]*[-*+]\s+\[[xX]\]\s.+$/;
const UNCHECKED_TASK_REGEX = /^[\t >-]*[-*+]\s+\[ \]\s.+$/;

// Pure functions for data manipulation
export const parseTaskLine = (line: string): Task | null => {
  const m = line.match(/^(\s*)([-*+])\s+\[[ xX]\]\s+(.*)$/);
  return m ? { indent: m[1], text: m[3].trim() } : null;
};

export const taskKey = (t: Task): string => `${t.indent}\0${t.text}`;

export const parseTasksForDate = (noteContents: FileContent): TasksForDate => {
  const uncheckedGroups: TaskGroup[] = [];
  const checkedTasks: Task[] = [];
  let currentGroup: Task[] | null = null;

  for (const line of noteContents.lines) {
    if (UNCHECKED_TASK_REGEX.test(line)) {
      const task = parseTaskLine(line);
      if (task) {
        if (!currentGroup) currentGroup = [];
        currentGroup.push(task);
      }
    } else if (CHECKED_TASK_REGEX.test(line)) {
      const task = parseTaskLine(line);
      if (task) checkedTasks.push(task);
      // checked tasks don't break the current unchecked group
    } else {
      // non-task line: finalize current group
      if (currentGroup && currentGroup.length > 0) {
        uncheckedGroups.push({ tasks: currentGroup });
      }
      currentGroup = null;
    }
  }

  // finalize any remaining group
  if (currentGroup && currentGroup.length > 0) {
    uncheckedGroups.push({ tasks: currentGroup });
  }

  return {
    date: new Date(noteContents.fileName),
    uncheckedGroups,
    checkedTasks,
  };
};

export const filterAndAggregateTasks = (
  currentState: Array<TasksForDate>
): Array<TasksForDate> => {
  let newStateWithDup: Array<TasksForDate> = [];
  const checkedTasksSet: Set<string> = new Set();

  // Pass 1: moving from present to past, removing tasks checked in newer notes
  for (const tfd of currentState) {
    const newUncheckedGroups: TaskGroup[] = [];

    for (const group of tfd.uncheckedGroups) {
      const filteredTasks = group.tasks.filter(
        (t) => !checkedTasksSet.has(taskKey(t))
      );
      if (filteredTasks.length > 0) {
        newUncheckedGroups.push({ tasks: filteredTasks });
      }
    }

    for (const ct of tfd.checkedTasks) {
      checkedTasksSet.add(taskKey(ct));
    }

    if (newUncheckedGroups.length > 0) {
      newStateWithDup.push({
        date: tfd.date,
        uncheckedGroups: newUncheckedGroups,
        checkedTasks: [],
      });
    }
  }

  // Pass 2: backward (past to present), deduplicating
  const newState: Array<TasksForDate> = [];
  const uncheckedTasksSet: Set<string> = new Set();

  for (let i = newStateWithDup.length - 1; i >= 0; i--) {
    const tfd = newStateWithDup[i];
    const newUncheckedGroups: TaskGroup[] = [];

    for (const group of tfd.uncheckedGroups) {
      const filteredTasks = group.tasks.filter((t) => {
        const key = taskKey(t);
        if (!uncheckedTasksSet.has(key)) {
          uncheckedTasksSet.add(key);
          return true;
        }
        return false;
      });
      if (filteredTasks.length > 0) {
        newUncheckedGroups.push({ tasks: filteredTasks });
      }
    }

    if (newUncheckedGroups.length > 0) {
      newState.push({
        date: tfd.date,
        uncheckedGroups: newUncheckedGroups,
        checkedTasks: [],
      });
    }
  }

  // resorting
  return newState.sort((a, b) => b.date.getTime() - a.date.getTime());
};

export const generateOutput = (allFinalTasks: Array<TasksForDate>): string => {
  let output = "";

  for (const tfd of allFinalTasks) {
    output += "#### " + tfd.date.toISOString().split("T")[0] + "\n";
    for (let i = 0; i < tfd.uncheckedGroups.length; i++) {
      if (i > 0) output += "\n";
      for (const t of tfd.uncheckedGroups[i].tasks) {
        output += t.indent + "- [ ] " + t.text + "\n";
      }
    }
    output += "\n";
  }

  return output;
};
