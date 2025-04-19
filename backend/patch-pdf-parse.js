import fs from 'fs';
import path from 'path';

const filePath = path.join('node_modules', 'pdf-parse', 'index.js');
let fileContent = fs.readFileSync(filePath, 'utf8');

const startToken = 'if (isDebugMode)';
const endToken = '});\n\n}';

const startIndex = fileContent.indexOf(startToken);
const endIndex = fileContent.indexOf(endToken, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const before = fileContent.slice(0, startIndex);
  const after = fileContent.slice(endIndex + endToken.length);
  const cleaned = before + '// Debug block removed\n' + after;

  fs.writeFileSync(filePath, cleaned, 'utf8');
  console.log('✅ pdf-parse patched successfully');
} else {
  console.warn('⚠️ Debug block not found or already removed');
}
