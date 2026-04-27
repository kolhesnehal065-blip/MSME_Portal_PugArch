
const fs = require('fs');
const content = fs.readFileSync('c:/Users/Sneh/Downloads/pugarch-msme-marketplace (2) (2)/pugarch-msme-marketplace (1)/src/pages/BuyerOnboarding.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
lines.forEach((line, index) => {
  const lineNum = index + 1;
  const divMatches = [...line.matchAll(/<div/g)];
  const closingDivMatches = [...line.matchAll(/<\/div>/g)];

  divMatches.forEach(match => {
    stack.push({ type: 'open', line: lineNum, content: line.trim() });
  });
  closingDivMatches.forEach(match => {
    if (stack.length > 0) {
      stack.pop();
    } else {
      console.log(`Extra closing div at line ${lineNum}: ${line.trim()}`);
    }
  });
});

console.log('--- Unclosed tags ---');
stack.forEach(s => {
  console.log(`Unclosed div at line ${s.line}: ${s.content}`);
});
