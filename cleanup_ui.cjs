const fs = require('fs');
const path = require('path');

// 1. Clean AuthModal.jsx
const authModalFile = path.join(__dirname, 'src/components/AuthModal.jsx');
let authCode = fs.readFileSync(authModalFile, 'utf8');

// Remove authRole entirely or just fix its usage. 
// We will replace the toggle buttons entirely.
authCode = authCode.replace(
  /<div className="flex gap-2 p-1 bg-zinc-100 rounded-2xl mb-6">[\s\S]*?<\/div>/m, 
  ''
);
// Remove the admin specific UI block
authCode = authCode.replace(
  /\{\/\* ============================================================ \*\/\}\s*\{\/\* DUKANDAR SECURE PORTAL LOGIN \*\/\}\s*\{\/\* ============================================================ \*\/\}\s*\{activeStep === 'phone' && authRole === 'dukandar' && \([\s\S]*?<\/div>\s*\)\}/m,
  ''
);
// Make the phone condition strict to 'customer' logic or just remove the authRole condition.
authCode = authCode.replace(/&& authRole === 'customer'/g, '');

fs.writeFileSync(authModalFile, authCode, 'utf8');


// 2. Clean Navbar.jsx
const navbarFile = path.join(__dirname, 'src/components/Navbar.jsx');
let navCode = fs.readFileSync(navbarFile, 'utf8');
navCode = navCode.replace(
  /<button\s*onClick=\{onOpenAdminPortal\}[\s\S]*?<\/button>/m,
  ''
);
fs.writeFileSync(navbarFile, navCode, 'utf8');


// 3. Clean AdminPortal component import from older App.jsx
// Actually we already overwrote App.jsx.

console.log('UI cleanup successful!');
