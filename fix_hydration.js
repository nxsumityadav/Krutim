const fs = require('fs');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove mounted state definitions
    content = content.replace(/const \[mounted, setMounted\] = (?:React\.)?useState\(false\);\s*useEffect\(\(\) => \{\s*setMounted\(true\);\s*\}, \[\]\);\s*const isDark = mounted \? resolvedTheme === "dark" : false;/g, '');
    content = content.replace(/const \[mounted, setMounted\] = (?:React\.)?useState\(false\);\s*(?:React\.)?useEffect\(\(\) => \{\s*setMounted\(true\);\s*\}, \[\]\);\s*const isDark = mounted \? resolvedTheme === "dark" : false;/g, '');

    // Replace the simple isDark with a true dark class logic where we can
    // We will do this manually for files, or by replacing common patterns
    fs.writeFileSync(filePath, content);
}

// processFile('src/app/chat/page.tsx');
// processFile('src/app/models/page.tsx');
// processFile('src/app/settings/page.tsx');
