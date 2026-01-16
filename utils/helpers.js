const fs = require('fs-extra');
const cliProgress = require('cli-progress');
const path = require('path');
const ExifReader = require('exifreader');

/**
 * Format a date to YYYY-MM-DD_ prefix
 */
function formatDate(date) {
    return date.toISOString().slice(0, 10) + '_'; // yyyy-mm-dd_
}

/**
 * Get file creation or modification date with EXIF support
 */
async function getFileDate(filepath) {
    try {
        const filename = path.basename(filepath);

        // First, try to extract Unix timestamp from filename (e.g., 1468516444000_image.jpg)
        const timestampMatch = filename.match(/^(\d{13})/);
        if (timestampMatch) {
            const timestamp = parseInt(timestampMatch[1], 10);
            const date = new Date(timestamp);
            if (!isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2030) {
                return date;
            }
        }

        const ext = path.extname(filepath).toLowerCase();

        // Try to read EXIF data for images
        if (['.jpg', '.jpeg', '.png', '.webp', '.heic'].includes(ext)) {
            try {
                const tags = await ExifReader.load(filepath);

                // Try different EXIF date fields in order of preference
                const dateFields = [
                    'DateTimeOriginal',
                    'DateTime',
                    'DateTimeDigitized',
                    'CreateDate'
                ];

                for (const field of dateFields) {
                    if (tags[field] && tags[field].description) {
                        // Parse EXIF date format: "YYYY:MM:DD HH:MM:SS"
                        const exifDate = tags[field].description.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
                        const date = new Date(exifDate);
                        if (!isNaN(date.getTime())) {
                            return date;
                        }
                    }
                }
            } catch (exifErr) {
                // EXIF reading failed, fall through to filesystem date
            }
        }

        // Fallback to filesystem date
        const stat = await fs.stat(filepath);
        return new Date(stat.birthtimeMs || stat.mtimeMs);
    } catch (err) {
        console.error(`Error getting date for ${filepath}: ${err.message}`);
        return new Date();
    }
}

/**
 * Create and return a progress bar
 */
function showProgress(title, total) {
    const bar = new cliProgress.SingleBar({
        format: `${title} |{bar}| {percentage}% || {value}/{total} || ETA: {eta}s`,
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    }, cliProgress.Presets.shades_classic);

    bar.start(total, 0);
    return bar;
}

module.exports = {
    formatDate,
    getFileDate,
    showProgress
};
