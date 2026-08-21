const { execSync } = require('child_process');
const output = execSync('grep -rn "<button" ui/src/ui/').toString();
console.log(output);
