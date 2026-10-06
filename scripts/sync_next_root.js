const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const srcNext = path.join(rootDir, 'portal', '.next');
const destNext = path.join(rootDir, '.next');
const srcPublic = path.join(rootDir, 'portal', 'public');
const destPublic = path.join(rootDir, 'public');

console.log('[sync_next_root] Configuring root artifacts for Vercel deployment...');

// 1. Create .next symlink at root pointing to portal/.next
try {
  let isSymlink = false;
  try {
    const stat = fs.lstatSync(destNext);
    isSymlink = stat.isSymbolicLink();
  } catch (e) {
    // doesn't exist
  }

  if (fs.existsSync(destNext) || isSymlink) {
    fs.rmSync(destNext, { recursive: true, force: true });
  }

  const targetPath = process.platform === 'win32' ? srcNext : 'portal/.next';
  fs.symlinkSync(targetPath, destNext, process.platform === 'win32' ? 'junction' : 'dir');
  console.log(`[sync_next_root] Successfully linked .next -> ${targetPath}`);
} catch (err) {
  console.warn('[sync_next_root] Symlink creation warning:', err.message);
}

// 2. Ensure public assets are available at root
try {
  if (fs.existsSync(srcPublic)) {
    if (!fs.existsSync(destPublic)) {
      fs.mkdirSync(destPublic, { recursive: true });
    }
    fs.cpSync(srcPublic, destPublic, { recursive: true, force: true });
    console.log('[sync_next_root] Public assets deeply synchronized to root public/.');
  }
} catch (err) {
  console.warn('[sync_next_root] Public sync warning:', err.message);
}

console.log('[sync_next_root] Completed successfully.');
