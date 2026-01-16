const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { showProgress } = require('../utils/helpers');

/**
 * Shorten filenames and remove special characters for Photos.app compatibility
 */
async function shortenFilenames(rootDir, dryRun) {
    console.log('\n=== Shorten Filenames for Photos.app ===');
    const dateRegex = /^(\d{4})[-_](\d{2})[-_](\d{2})[-_]/;
    const allFiles = await fs.readdir(rootDir);
    const files = [];

    for (const f of allFiles) {
        const stat = await fs.stat(path.join(rootDir, f));
        if (stat.isFile()) files.push(f);
    }

    if (!files.length) {
        console.log('No files to process.');
        return;
    }

    const bar = showProgress('Shortening filenames', files.length);
    let renamed = 0;
    const nameMap = new Map(); // Track sequential numbers per date

    for (const file of files) {
        const fullPath = path.join(rootDir, file);
        const { ext } = path.parse(file);

        // Extract date prefix if exists (e.g., 2018-04-27_ or 2018-04-27-)
        const dateMatch = file.match(dateRegex);

        if (!dateMatch) {
            bar.update(++renamed);
            continue; // Skip files without date prefix
        }

        // Normalize date format to YYYY-MM-DD-
        const datePrefix = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}-`;

        // Create simple sequential name
        if (!nameMap.has(datePrefix)) {
            nameMap.set(datePrefix, 1);
        }
        const seq = nameMap.get(datePrefix);
        nameMap.set(datePrefix, seq + 1);

        // Format: YYYY-MM-DD-001.jpg (very simple, just date + sequence)
        const seqStr = seq.toString().padStart(3, '0');
        let newName = `${datePrefix}${seqStr}${ext.toLowerCase()}`;

        // Skip if name hasn't changed
        if (newName === file) {
            bar.update(++renamed);
            continue;
        }

        // Handle collisions
        let counter = 1;
        while (await fs.pathExists(path.join(rootDir, newName))) {
            const extraSeq = (seq + counter).toString().padStart(3, '0');
            newName = `${datePrefix}${extraSeq}${ext.toLowerCase()}`;
            counter++;
        }

        try {
            if (dryRun) {
                if (renamed < 20) {  // Show first 20 examples
                    console.log(`Would rename: ${file} → ${newName}`);
                }
            } else {
                await fs.rename(fullPath, path.join(rootDir, newName));
            }
        } catch (err) {
            console.error(`Error renaming ${file}: ${err.message}`);
        }
        bar.update(++renamed);
    }

    bar.stop();
    console.log(`\n${dryRun ? 'Would have' : ''} renamed ${renamed} files.`);
}

module.exports = shortenFilenames;
