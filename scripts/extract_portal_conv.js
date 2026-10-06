const fs = require('fs');

const transPath = 'C:\\Users\\franc\\.gemini\\antigravity\\brain\\33d11463-5db1-43c3-a668-3e08d35d66fc\\.system_generated\\logs\\transcript.jsonl';

const lines = fs.readFileSync(transPath, 'utf8').split('\n').filter(Boolean);
console.log('Total steps:', lines.length);

// Extract the last 15 user requests and key assistant responses
const userRequests = [];
lines.forEach((l, idx) => {
  try {
    const obj = JSON.parse(l);
    if (obj.type === 'USER_INPUT' && obj.content && obj.content.includes('<USER_REQUEST>')) {
      const match = obj.content.match(/<USER_REQUEST>([\s\S]*?)<\/USER_REQUEST>/);
      if (match) {
        userRequests.push({ step: obj.step_index || idx, time: obj.created_at, text: match[1].trim() });
      }
    }
  } catch(e) {}
});

console.log('Total user requests:', userRequests.length);
userRequests.slice(-20).forEach(u => {
  console.log(`\n[${u.time}] (Step ${u.step}):\n${u.text}`);
});
