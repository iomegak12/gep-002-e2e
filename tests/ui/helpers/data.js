const fs = require('fs');
const path = require('path');

// Reads non-empty, non-comment lines from a text file under data/.
// Lines starting with '#' are ignored. Returns [] if the file is missing.
function readLines(filename) {
  const p = path.join(__dirname, '..', 'data', filename);
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf-8')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('#'));
}

module.exports = { readLines };
