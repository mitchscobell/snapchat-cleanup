const fs = require('fs-extra');
const path = require('path');
const { formatDate, getFileDate, showProgress } = require('../utils/helpers');

/**
 * Add date prefix (YYYY-MM-DD_) to files that don't have one
 */
async function renameWithDatePrefix(rootDir, dryRun) {
    console.log('\n=== Rename with Date Prefix ===');
    const dateRegex = /^\d{4}[-_]\d{2}[-_]\d{2}/;
    const allFiles = await fs.readdir(rootDir);
    const files = [];
    for (const f of allFiles) {
        const stat = await fs.stat(path.join(rootDir, f));
        if (stat.isFile()) files.push(f);
    }

    if (!files.length) {
        console.log('No files to rename.');
        return;
    }

    const bar = showProgress('Renaming', files.length);
    let renamed = 0;

    for (const file of files) {
        if (dateRegex.test(file)) {
            bar.update(++renamed);
            continue;
        }

        const fullPath = path.join(rootDir, file);
        const date = await getFileDate(fullPath);
        const prefix = formatDate(date);

        let newName = prefix + file;
        let counter = 1;
        while (await fs.pathExists(path.join(rootDir, newName))) {
            const { name, ext } = path.parse(file);
            newName = `${prefix}${name}_copy${counter}${ext}`;
            counter++;
        }

        try {
            if (dryRun) {
                console.log(`Would rename: ${file} → ${newName}`);
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

module.exports = renameWithDatePrefix;
