# Aggregate Daily Tasks

> **Obsidian Community Plugin** – Collect all unchecked tasks from your Daily Notes and paste them at the cursor in the current note.

![GitHub release (latest by date)](https://img.shields.io/github/v/release/patrickspieker/obsidian-agg-daily-tasks)
![Obsidian version](https://img.shields.io/badge/obsidian-1.6.0%2B-purple)

## Context

I'm always writing thoughts, todos, or tasks in my Obsidian daily notes (often with indeterminate time horizons for completion!), but I don't always get to them throughout the day.

I built this to make sure I don't miss things!

## Features

| Capability                | Details                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- |
| ️**Daily-note scan**      | Finds every file named `YYYY-MM-DD.md` in your vault.                            |
| **Checked-task override** | If a newer note has the same task _checked_, older unchecked copies are ignored. |
| **De-duplication**        | Identical unchecked tasks are listed only once (toggle).                         |
| **Reverse chrono order**  | Outputs newest-to-oldest by default (toggle).                                    |
| **One-click / command**   | Ribbon icon or `Aggregate Daily Tasks` command palette entry.                    |

## Installation

### Community Plugins (recommended)

Search "aggregate daily tasks" in the community plugin browser

### Manual

1. Download the latest release .zip from the [GitHub Releases](https://github.com/patrickspieker/aggregate-unchecked-daily-tasks/releases) page.
2. Extract the contents (`manifest.json`, `main.js`, `styles.css` if present) into your vault under  
   `.obsidian/plugins/agg-daily-tasks/`.
3. Reload Obsidian and enable the plugin.

### Manual installation for development

1. Clone this repository.
2. Install dependencies with `pnpm install` (or `npm install`).
3. Run `pnpm run install:obsidian /path/to/your/vault` (or `npm run install:obsidian -- /path/to/your/vault`).
4. Reload Obsidian with `Cmd/Ctrl+R`.
5. Go to `Settings -> Community Plugins` and enable `Aggregate Daily Tasks` if it is not already enabled.

The install script builds the plugin and copies `main.js` and `manifest.json` into `.obsidian/plugins/agg-daily-tasks/`. If `styles.css` exists in the repo, it copies that too.

## Usage

1. Open any note where you want the aggregated list.
2. **Run** `Aggregate Daily Tasks` from the Command Palette _or_ click the ribbon check-mark icon.
3. A `### Unchecked Tasks` section is inserted at the cursor containing all outstanding tasks.

### Optional Toggles

Edit the top of `main.ts` if building from source (or fork + re-compile):

```ts
const DEDUPLICATE = true; // Only unique tasks
const SORT = false; // Alphabetical list
const REVERSE_CHRONO = true; // Newest first
const OVERRIDE_WITH_NEWER_CHECKED = true; // Supersede with newer checked
```

### Development

To work on the plugin with automatic rebuilds and live-copying into your vault:

1. Set `OBSIDIAN_VAULT` to your vault path:
   ```sh
   export OBSIDIAN_VAULT="/path/to/your/vault"
   ```
2. Start the watcher:
   ```sh
   pnpm dev         # or: npm run dev
   ```
   On every file save, esbuild rebuilds `main.js` and copies it (plus `manifest.json`)
   into `.obsidian/plugins/agg-daily-tasks/` inside your vault.

3. Reload the plugin in Obsidian after each rebuild: use **Reload app without saving**
   (`Cmd/Ctrl+R`) or toggle the plugin off/on in `Settings → Community Plugins`.

> You can also point `OBSIDIAN_VAULT` directly at the plugin subdirectory:
> `export OBSIDIAN_VAULT="/path/to/vault/.obsidian/plugins/agg-daily-tasks"`

If `OBSIDIAN_VAULT` is unset, the watcher still rebuilds `main.js` in the repo —
deploy manually or use `pnpm run install:obsidian /path/to/vault`.

#### Available scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Watch mode — rebuilds on every save, auto-copies to vault if `OBSIDIAN_VAULT` is set |
| `pnpm build` | Production build (minified, no source maps) |
| `pnpm run install:obsidian <vault-path>` | One-shot build + copy to vault |
| `pnpm test:run` | Run tests once |
| `pnpm test` | Run tests with debugger attached |
| `pnpm test:ui` | Run tests with Vitest UI |
