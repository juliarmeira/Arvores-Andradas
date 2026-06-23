import fs from 'fs';
import path from 'path';

const srcDir = 'C:\\Users\\Prefeitura\\.gemini\\antigravity-ide\\brain\\f07c96f5-4ffa-418f-999c-2e802d18a18c';
const destDir = 'c:\\Users\\Prefeitura\\.gemini\\antigravity\\scratch\\vistoria_ambiental\\public\\refs';

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

try {
  const files = fs.readdirSync(srcDir);
  console.log('Files in source:', files);
  files.forEach(file => {
    if (file.startsWith('media__') && file.endsWith('.png')) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} to public/refs/`);
    }
  });
} catch (e) {
  console.error('Error copying files:', e);
}
