const fs = require('fs');

const transPath = 'C:\\Users\\franc\\.gemini\\antigravity\\brain\\33d11463-5db1-43c3-a668-3e08d35d66fc\\.system_generated\\logs\\transcript.jsonl';
console.log('Exists:', fs.existsSync(transPath));

if (fs.existsSync(transPath)) {
  const stat = fs.statSync(transPath);
  console.log('File size:', stat.size);
  
  const lines = fs.readFileSync(transPath, 'utf8').split('\n').filter(Boolean);
  console.log('Total steps/lines:', lines.length);

  lines.forEach((l, idx) => {
    try {
      const obj = JSON.parse(l);
      if (obj.type === 'USER_INPUT' || obj.source === 'USER_EXPLICIT' || (obj.content && obj.content.includes('<USER_REQUEST>'))) {
        console.log(`\n=== USER INPUT [Step ${obj.step_index || idx}] (${obj.created_at}) ===`);
        console.log(obj.content ? obj.content.slice(0, 500) : '');
      }
    } catch(e) {}
  });
}
