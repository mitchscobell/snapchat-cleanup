const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const { showProgress } = require('../utils/helpers');

/**
 * Move all files from subdirectories to the root directory
 */
async function flattenSubdirectories(rootDir, dryRun) {
    console.log('\n=== Flatten Subdirectories ===');
    const files = glob.sync('**/*', { cwd: rootDir, nodir: true, absolute: true })
        .filter(f => path.dirname(f) !== rootDir); // Only files in subdirectories

    if (!files.length) {
        console.log('No files in subdirectories.');
        return;
    }

    const bar = showProgress('Flattening', files.length);
    let moved = 0;

    for (const fullPath of files) {
        const relPath = path.relative(rootDir, fullPath);
        const baseName = path.basename(fullPath);
        let target = path.join(rootDir, baseName);

        let counter = 1;
        while (await fs.pathExists(target)) {
            const { name, ext } = path.parse(baseName);
            target = path.join(rootDir, `${name}_copy${counter}${ext}`);
            counter++;
        }

        try {
            if (dryRun) {
                console.log(`Would move: ${relPath} → ${path.basename(target)}`);
            } else {
                await fs.move(fullPath, target, { overwrite: false });
            }
        } catch (err) {
            console.error(`Error moving ${relPath}: ${err.message}`);
        }
        bar.update(++moved);
    }

    bar.stop();
    console.log(`\n${dryRun ? 'Would have' : ''} moved ${moved} files to root.`);

    // Clean up empty subdirectories
    if (!dryRun && moved > 0) {
        const dirs = glob.sync('**/', { cwd: rootDir, absolute: true })
            .filter(d => d !== rootDir + '/' && d !== rootDir);

        for (const dir of dirs.reverse()) {
            try {
                const items = await fs.readdir(dir);
                if (items.length === 0) {
                    await fs.remove(dir);
                }
            } catch (err) {
                // Directory might already be deleted
            }
        }
        console.log('Cleaned up empty subdirectories.');
    }
}

module.exports = flattenSubdirectories;
