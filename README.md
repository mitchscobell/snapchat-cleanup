# Snapchat Memories Cleanup Tool

An interactive command-line tool to organize and clean up Snapchat Memories exports. Helps you flatten directories, rename files with dates, remove overlay files, and find duplicates.

## Features

- 🗂️ **Flatten Subdirectories** - Move all files from nested folders to the root directory
- 📅 **Auto-Date Renaming** - Add date prefixes (YYYY-MM-DD\_) to files based on EXIF data, filename timestamps, or file dates
- 🗑️ **Remove Overlays** - Delete Snapchat overlay files (including chat_media overlays)
- 🔍 **Duplicate Detection** - Find and move duplicate files using content-based MD5 hashing
- ✂️ **Shorten Filenames** - Simplify filenames to short sequential format (YYYY-MM-DD-001.jpg) for Photos.app compatibility
- 🛡️ **Dry-Run Mode** - Preview changes before applying them (enabled by default)
- 📊 **Progress Tracking** - Real-time progress bars for all operations
- ✅ **Confirmation Prompts** - Interactive confirmations before destructive actions

## Installation

```bash
npm install
```

## Usage

### Basic Usage

Run in the current directory:

```bash
node cli.js
```

Or make it executable:

```bash
chmod +x cli.js
./cli.js
```

### Command-Line Options

```bash
# Specify a different directory
node cli.js --dir /path/to/snapchat/export

# Start with dry-run disabled (apply changes immediately)
node cli.js --dry-run=false

# Combine options
node cli.js --dir /path/to/export --dry-run=false
```

## Operations

### 1. Flatten Subdirectories + Rename with Date Prefix

Moves all files from subdirectories to the root folder and adds date prefixes:

**Before:**

```
photos/
  IMG_1234.jpg
  IMG_5678.jpg
videos/
  VID_9012.mp4
```

**After:**

```
2023-12-15_IMG_1234.jpg
2023-12-15_IMG_5678.jpg
2024-01-10_VID_9012.mp4
```

### 2. Delete Overlay Files

Finds and removes Snapchat overlay files that match:

- `*overlay*.png`
- `*overlay*.webp`

Shows a preview and requires confirmation before deletion.

### 3. Find & Move Duplicates

Uses a two-phase approach:

1. **Size filtering** - Groups files by size (fast)
2. **MD5 hashing** - Confirms duplicates by content hash (accurate)

Moves duplicates to a `duplicates/` folder, keeping the first occurrence alphabetically.

### 4. Run ALL Steps

Executes all operations in sequence:

1. Flatten subdirectories
2. Rename with date prefix
3. Delete overlays (with confirmation)
4. Find and move duplicates (with confirmation)

### 5. Shorten Filenames (Photos.app Compatibility)

Simplifies filenames to a clean sequential format for importing into Photos.app:

**Before:**

```
2018-04-27_b~EiQSFXF3cjhOdTRURmFYQ2Nxd1VDWXJVeRoAGgAyAXxIAlAEYAE.jpg
2018-04-27_media~Snapchat-12345.mp4
```

**After:**

```
2018-04-27-001.jpg
2018-04-27-002.mp4
```

Also removes quarantine flags that prevent Photos.app import.

**⚠️ Important:** After running this operation, **you must restart Photos.app** before importing. macOS caches the quarantine status of files, and Photos.app will continue showing import errors until the app is completely quit and relaunched. If you see "unknown error" or files won't import, quit Photos.app (Cmd+Q) and reopen it.

## Project Structure

```
cleanup/
├── cli.js                    # Main entry point & interactive menu
├── operations/
│   ├── flatten.js           # Flatten subdirectories
│   ├── rename.js            # Add date prefixes
│   ├── deleteOverlays.js    # Remove overlay files
│   ├── findDuplicates.js    # Duplicate detection & removal
│   └── shortenFilenames.js  # Simplify filenames for Photos.app
├── utils/
│   └── helpers.js           # Shared utilities (progress bars, date formatting)
├── package.json             # Dependencies
└── README.md                # This file
```

## Safety Features

- **Dry-run by default** - No changes are made until you toggle it off
- **Conflict resolution** - Automatically handles filename conflicts with `_copy1`, `_copy2`, etc.
- **Interactive confirmations** - Prompts before deleting overlays or moving duplicates
- **Error handling** - Continues processing even if individual files fail
- **Preview mode** - See what will happen before committing changes

## Dependencies

- [commander](https://www.npmjs.com/package/commander) - CLI argument parsing
- [inquirer](https://www.npmjs.com/package/inquirer) - Interactive prompts
- [fs-extra](https://www.npmjs.com/package/fs-extra) - Enhanced file operations
- [glob](https://www.npmjs.com/package/glob) - File pattern matching
- [md5-file](https://www.npmjs.com/package/md5-file) - Content hashing for d
- [exifreader](https://www.npmjs.com/package/exifreader) - EXIF metadata extractionuplicates
- [cli-progress](https://www.npmjs.com/package/cli-progress) - Progress bars

## Tips

1. **Always start with dry-run enabled** to preview changes
2. **Back up your files** before running with dry-run disabled
3. **Review the duplicate list** before confirming - the tool keeps the first file alphabetically
4. Files already with date prefixes (YYYY-MM-DD or YYYY_MM_DD format) are skipped during renaming

## Example Workflow

```bash
# 1. Navigate to your Snapchat export
cd ~/Downloads/snapchat-memories-export

# 2. Run the tool (dry-run is ON by default)
node /path/to/cleanup/cli.js

# 3. Select "4. Run ALL steps in sequence"
# 4. Review the preview output
# 5. Toggle dry-run mode to OFF
# 6. Run "4. Run ALL steps in sequence" again to apply changes
```

## License

ISC
