const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('client/src');

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('const  = usePathname();')) {
    const newContent = content.replace(/const  = usePathname\(\);/g, 'const pathname = usePathname();');
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Fixed ${file}`);
  }
  if (content.includes('const true = usePathname();')) {
    const newContent = content.replace(/const true = usePathname\(\);/g, 'const pathname = usePathname();');
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
