const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
  });
}

const clientSrcDir = path.join(__dirname, '../client/src');
const appDir = path.join(__dirname, '../app');

function refactorFile(filePath) {
  if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Replace import.meta.env with process.env
  content = content.replace(/import\.meta\.env\.VITE_/g, 'process.env.NEXT_PUBLIC_');
  content = content.replace(/import\.meta\.env/g, 'process.env');

  // 2. Replace wouter imports
  // Basic <Link> replacement
  if (content.includes('wouter')) {
    content = content.replace(/import\s+\{([^}]*)\}\s+from\s+['"]wouter['"]/g, (match, imports) => {
      let nextImports = [];
      let navImports = [];
      if (imports.includes('Link')) nextImports.push('Link from "next/link"');
      if (imports.includes('useLocation')) navImports.push('usePathname', 'useRouter');
      if (imports.includes('useRoute')) navImports.push('useParams');
      
      let res = '';
      if (nextImports.length > 0) res += `import Link from "next/link";\n`;
      if (navImports.length > 0) res += `import { ${navImports.join(', ')} } from "next/navigation";\n`;
      return res;
    });

    // Replace useLocation hook usage
    // wouter: const [location, setLocation] = useLocation();
    // next: const pathname = usePathname(); const router = useRouter(); 
    // This is tricky via regex, doing a basic approximation
    content = content.replace(/const\s+\[(.*?),\s*(.*?)\]\s*=\s*useLocation\(\);?/g, 
      'const $1 = usePathname();\n  const router = useRouter();\n  const $2 = (path) => router.push(path);');
    
    // Replace useRoute hook usage
    // wouter: const [match, params] = useRoute('/path/:id');
    // next: const params = useParams(); const match = true;
    content = content.replace(/const\s+\[(.*?),\s*(.*?)\]\s*=\s*useRoute\((.*?)\);?/g, 
      'const $2 = useParams();\n  const $1 = true; // migrated route match');
  }

  // 3. Remove Link component's `asChild` if it causes type errors, but Next.js Link supports asChild conceptually if legacyBehavior or passHref is used? Actually Next.js 13+ Link works directly with children, but Radix UI might need asChild. Let's just leave it for now.

  if (content !== original) {
    fs.writeFileSync(filePath, content);
    console.log(`Refactored: ${filePath}`);
  }
}

console.log('Refactoring client files...');
if (fs.existsSync(clientSrcDir)) {
  walkDir(clientSrcDir, refactorFile);
}
console.log('Refactoring app files...');
if (fs.existsSync(appDir)) {
  walkDir(appDir, refactorFile);
}
console.log('Done.');
