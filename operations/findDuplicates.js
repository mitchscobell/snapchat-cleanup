const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const md5File = require('md5-file');
const inquirer = require('inquirer');
const { showProgress } = require('../utils/helpers');

/**
 * Find duplicate files by content hash and move them to duplicates/ folder
 */
async function findAndMoveDuplicates(rootDir, dryRun) {
    console.log('\n=== Find & Move Duplicates ===');

    const dupDir = path.join(rootDir, 'duplicates');
    if (!dryRun) await fs.ensureDir(dupDir);

    const sizeMap = new Map();
    const files = glob.sync('**/*', { cwd: rootDir, nodir: true, absolute: true, ignore: ['duplicates/**'] });

    const barSize = showProgress('Scanning sizes', files.length);
    for (const fp of files) {
        try {
            const size = (await fs.stat(fp)).size;
            if (!sizeMap.has(size)) sizeMap.set(size, []);
            sizeMap.get(size).push(fp);
        } catch (err) {
            console.error(`Error scanning ${fp}: ${err.message}`);
        }
        barSize.update(barSize.value + 1);
    }
    barSize.stop();

    const potential = [...sizeMap.values()].filter(a => a.length > 1);
    if (!potential.length) {
        console.log('No potential duplicates.');
        return;
    }

    const confirmed = [];
    const hashBar = showProgress('Hashing potential duplicates', potential.flat().length);

    for (const group of potential) {
        const hashMap = new Map();
        for (const fp of group) {
            try {
                const hash = await md5File(fp);
                if (!hashMap.has(hash)) hashMap.set(hash, []);
                hashMap.get(hash).push(fp);
            } catch (err) {
                console.error(`Error hashing ${fp}: ${err.message}`);
            }
            hashBar.update(hashBar.value + 1);
        }

        for (const paths of hashMap.values()) {
            if (paths.length > 1) {
                const sorted = paths.sort((a, b) => a.localeCompare(b));
                confirmed.push(...sorted.slice(1));
            }
        }
    }

    hashBar.stop();

    if (!confirmed.length) {
        console.log('No confirmed duplicates.');
        return;
    }

    console.log(`Found ${confirmed.length} duplicates:`);
    confirmed.slice(0, 10).forEach(p => console.log(`  ${path.basename(p)}`));
    if (confirmed.length > 10) console.log(`  ... and ${confirmed.length - 10} more`);

    const { proceed } = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'proceed',
            message: `Move ${confirmed.length} duplicates to duplicates/ folder?`,
            default: false,
        },
    ]);

    if (!proceed) return;

    const moveBar = showProgress('Moving duplicates', confirmed.length);
    let moved = 0;

    for (const dup of confirmed) {
        let target = path.join(dupDir, path.basename(dup));
        let i = 1;
        while (await fs.pathExists(target)) {
            const { name, ext } = path.parse(path.basename(dup));
            target = path.join(dupDir, `${name}_${i}${ext}`);
            i++;
        }

        try {
            if (dryRun) {
                console.log(`Would move: ${path.basename(dup)}`);
            } else {
                await fs.move(dup, target);
            }
        } catch (err) {
            console.error(`Error moving ${path.basename(dup)}: ${err.message}`);
        }
        moveBar.update(++moved);
    }

    moveBar.stop();
    console.log(`\n${dryRun ? 'Would have' : ''} moved ${moved} duplicates.`);
}

module.exports = findAndMoveDuplicates;
