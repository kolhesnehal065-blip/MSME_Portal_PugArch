
const fs = require('fs');
const content = fs.readFileSync('c:/Users/Sneh/Downloads/pugarch-msme-marketplace (2) (2)/pugarch-msme-marketplace (1)/src/pages/BuyerOnboarding.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, index) => {
  const lineNum = index + 1;
  const divMatches = [...line.matchAll(/<div/g)];
  const closingDivMatches = [...line.matchAll(/<\/div>/g)];

  divMatches.forEach(match => {
    stack.push({ line: lineNum });
  });
  closingDivMatches.forEach(match => {
    if (stack.length > 0) {
      stack.pop();
    }
  });
  
  if (lineNum >= 314 && lineNum <= 370) {
     console.log(`Line ${lineNum}: stack size ${stack.length}`);
  }
});
