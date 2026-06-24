import fs from 'fs';
import path from 'path';

const componentsDir = path.join(process.cwd(), 'src', 'components');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace button classes
  content = content.replace(/<button([^>]*)className="([^"]*)rounded-(lg|xl|2xl|md)([^"]*)"/g, '<button$1className="$2rounded-full$4"');
  content = content.replace(/<button([^>]*)className=\{`([^`]*)rounded-(lg|xl|2xl|md)([^`]*)`\}/g, '<button$1className={`$2rounded-full$4`}');

  // Replace input/select/textarea classes
  content = content.replace(/<(input|select|textarea)([^>]*)className="([^"]*)rounded-(lg|xl|2xl|md)([^"]*)"/g, '<$1$2className="$3rounded-[1.5rem]$5"');
  
  // Replace card classes (divs with bg-white and rounded-xl)
  content = content.replace(/<div([^>]*)className="([^"]*)bg-white([^"]*)rounded-(lg|xl)([^"]*)"/g, '<div$1className="$2bg-white$3rounded-[2rem]$5"');
  
  // Add strokeWidth={1.5} to lucide icons. Lucide icons start with capital letters and are imported from lucide-react.
  // We can just add strokeWidth={1.5} to any self-closing tag starting with capital letter inside src components, if it's an icon.
  // Actually, let's just do it for specific known icons or generally if they don't have strokeWidth.
  const icons = ["MapPin", "Search", "Sparkles", "Navigation", "Plus", "Camera", "Check", "AlertTriangle", "ArrowLeft", "ChevronRight", "Info", "Eye", "Trees", "LayoutGrid", "Database", "Brain", "RefreshCw", "User", "Menu", "X", "Leaf", "Flower", "Cloud", "CloudOff", "Edit", "Trash2", "FileDown", "Map", "Activity", "ShieldAlert", "TreePine"];
  
  icons.forEach(icon => {
    const regex = new RegExp(`<${icon}\\b([^>]*?)(?<!strokeWidth={.*?})(/?)>`, 'g');
    content = content.replace(regex, (match, p1, p2) => {
      if (p1.includes('strokeWidth')) return match;
      return `<${icon}${p1} strokeWidth={1.5}${p2}>`;
    });
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated UI in ${filePath}`);
}

const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));
files.forEach(f => processFile(path.join(componentsDir, f)));

// Also do it for App.tsx
processFile(path.join(process.cwd(), 'src', 'App.tsx'));
