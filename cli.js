#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');

// Import operations
const flattenSubdirectories = require('./operations/flatten');
const renameWithDatePrefix = require('./operations/rename');
const deleteOverlays = require('./operations/deleteOverlays');
const findAndMoveDuplicates = require('./operations/findDuplicates');
const shortenFilenames = require('./operations/shortenFilenames');

// Parse command-line arguments
program
    .description('Interactive Snapchat Memories Cleanup Tool')
    .option('--dry-run', 'Preview changes only (default: true)', true)
    .option('-d, --dir <path>', 'Directory to clean up (default: current directory)', process.cwd())
    .parse();

const opts = program.opts();
const rootDir = path.resolve(opts.dir);

// Validate directory exists
if (!fs.existsSync(rootDir)) {
    console.error(`Error: Directory does not exist: ${rootDir}`);
    process.exit(1);
}

console.log(`Working in: ${rootDir}`);
console.log(`Dry-run mode: ${opts.dryRun ? 'ON (preview only)' : 'OFF (changes will be applied)'}\n`);

/**
 * Main interactive menu
 */
async function main() {
    const { action } = await inquirer.prompt([
        {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
                '1. Flatten subdirectories + Rename with date prefix',
                '2. Delete overlay files (*overlay*.png / *.webp)',
                '3. Find & move duplicates',
                '4. Run ALL steps in sequence',
                '5. Shorten filenames (Photos.app compatibility)',
                new inquirer.Separator(),
                'Toggle dry-run mode',
                'Exit',
            ],
        },
    ]);

    if (action.includes('Toggle')) {
        opts.dryRun = !opts.dryRun;
        console.log(`Dry-run is now ${opts.dryRun ? 'ON' : 'OFF'}`);
        return main();
    }

    if (action.includes('Exit')) {
        console.log('Goodbye!');
        process.exit(0);
    }

    if (action.includes('ALL')) {
        await flattenSubdirectories(rootDir, opts.dryRun);
        await renameWithDatePrefix(rootDir, opts.dryRun);
        await deleteOverlays(rootDir, opts.dryRun);
        await findAndMoveDuplicates(rootDir, opts.dryRun);
    } else if (action.includes('Flatten')) {
        await flattenSubdirectories(rootDir, opts.dryRun);
        await renameWithDatePrefix(rootDir, opts.dryRun);
    } else if (action.includes('Delete overlay')) {
        await deleteOverlays(rootDir, opts.dryRun);
    } else if (action.includes('Find & move')) {
        await findAndMoveDuplicates(rootDir, opts.dryRun);
    } else if (action.includes('Shorten filenames')) {
        await shortenFilenames(rootDir, opts.dryRun);
    }

    main(); // Loop back to menu
}

// Start the application
main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
