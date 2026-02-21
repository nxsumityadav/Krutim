const fs = require('fs');
const path = require('path');

function replaceIsDarkTernary(content) {
    const regex = /isDark\s*\?\s*"([^"]+)"\s*:\s*"([^"]+)"/g;
    return content.replace(regex, (match, darkClass, lightClass) => {
        const darkClasses = darkClass.split(/\s+/).filter(Boolean).map(c => `dark:${c}`).join(' ');
        const lightClasses = lightClass.split(/\s+/).filter(Boolean).join(' ');
        return `"${lightClasses} ${darkClasses}"`;
    });
}

function processFile(filePath) {
    const fullPath = path.resolve(__dirname, filePath);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    // Convert mounted + isDark back to direct resolvedTheme (only for values that we need, e.g. `<MarkdownRenderer isDark={isDark} />`)
    // Because server outputting `isDark={false}` (meaning light theme) on server but `isDark={true}` on client doesn't cause hydration errors IF it doesn't manifest as HTML attr mismatch!
    // But `true/false` to `MarkdownRenderer` might cause syntax highlighter output to mismatch if it actually renders different HTML elements for oneDark vs oneLight. 
    // And actually, if we want NO hydration mismatches or flashes, we should remove the mounted checks and let it be. But if we use CSS classes for structure, then `resolvedTheme === "dark"` is fine for `MarkdownRenderer` to hydrate.
    // However, the issue the user faces is "when users are in dark mode it show light mode and automatically came in dark mode (flash)".
    // So if we remove the mounted check and simply use `resolvedTheme === "dark"`, does it fix the flash? Wait! `resolvedTheme` is initialized to `getEffectiveTheme()`, which relies on `localStorage` which throws if on the server (`typeof window === 'undefined'`). Note that the `ThemeProvider` uses `typeof window === 'undefined' ? "light" : ...` to return `light` on server.

    // To fix FOUC (flash of unstyled content), we HAVE TO use Tailwind CSS `dark:` pseudo-classes for structure. 

    // Replace the specific `isDark ? "..." : "..."` strings with tailwind classes
    content = replaceIsDarkTernary(content);

    // Some specific cases: `isDark ? "text-foreground" : "text-[var(--chat-text)]"`
    // `className={isDark ? "..." : "..."}` was changed to `className={"... dark:..."}` by the regex.
    // If it was inside cn(): `cn("flex", isDark ? "dark" : "light")` -> `cn("flex", "light dark:dark")`

    // We still need `isDark` declared for things that didn't get replaced, like `isDark={isDark}`.
    // So we just redefine it without mounted.
    content = content.replace(/const \[mounted,\s*setMounted\]\s*=\s*(?:React\.)?useState\(false\);\s*(?:React\.)?useEffect\(\(\) => \{\s*setMounted\(true\);\s*\}, \[\]\);\s*const isDark\s*=\s*mounted \? resolvedTheme === "dark" : false;/g, 'const isDark = resolvedTheme === "dark";');
    content = content.replace(/const \[mounted,\s*setMounted\]\s*=\s*useState\(false\);\s*useEffect\(\(\) => \{\s*setMounted\(true\);\s*\}, \[\]\);\s*const isDark\s*=\s*mounted \? resolvedTheme === "dark" : false;/g, 'const isDark = resolvedTheme === "dark";');

    fs.writeFileSync(fullPath, content);
}

['src/app/chat/page.tsx', 'src/app/models/page.tsx', 'src/app/settings/page.tsx'].forEach(processFile);
console.log('Done!');
