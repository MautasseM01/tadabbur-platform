import fs from 'fs';
import path from 'path';
import { generateLinksMarkdown } from '../lib/generateLinksMd';

const outPath = path.join(process.cwd(), 'docs', 'links.md');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, generateLinksMarkdown(), 'utf-8');
console.log(`docs/links.md regenerated (${fs.statSync(outPath).size} bytes)`);
