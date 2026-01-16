const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const inquirer = require('inquirer');
const { showProgress } = require('../utils/helpers');

/**
 * Find and delete overlay files (interactive)
 */
async function deleteOverlays(rootDir, dryRun) {
    console.log('\n=== Delete Overlay Files ===');
    const patterns = [
        '**/*-overlay.png',
        '**/*-overlay.webp',
        '**/*overlay~*.png',      // Chat media overlays (e.g., 2025-11-05_overlay~...)
        '**/*overlay~*.webp',
        '**/*_extracted_2.png'    // Overlays from extracted zips
    ];

    // Search in both rootDir and ~/Downloads/chat_media
    const searchDirs = [rootDir];
    const chatMediaDir = path.join(require('os').homedir(), 'Downloads', 'chat_media');
    if (fs.existsSync(chatMediaDir)) {
        searchDirs.push(chatMediaDir);
    }

    let files = [];
    for (const dir of searchDirs) {
        for (const pat of patterns) {
            files = files.concat(glob.sync(pat, { cwd: dir, absolute: true, nodir: true }));
        }
    }

    // Remove duplicates
    files = [...new Set(files)];

    if (!files.length) {
        console.log('No overlay files found.');
        return;
    }

    console.log(`Found ${files.length} overlay files:`);
    files.slice(0, 10).forEach(f => console.log(`  ${path.basename(f)}`));
    if (files.length > 10) console.log(`  ... and ${files.length - 10} more`);

    const { proceed } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'proceed',
            message: `Delete ALL ${files.length} overlay files?`,
            default: false,
        },
    ]);

    if (!proceed) return;

    const bar = showProgress('Deleting overlays', files.length);
    let deleted = 0;

    for (const file of files) {
        try {
            if (dryRun) {
                console.log(`Would delete: ${path.basename(file)}`);
            } else {
                await fs.remove(file);
            }
        } catch (err) {
            console.error(`Error deleting ${path.basename(file)}: ${err.message}`);
        }
        bar.update(++deleted);
    }

    bar.stop();
    console.log(`\n${dryRun ? 'Would have' : ''} deleted ${deleted} overlay files.`);
}

module.exports = deleteOverlays;
