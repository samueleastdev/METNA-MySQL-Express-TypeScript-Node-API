const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function getEmail() {
  return new Promise((resolve) => {
    rl.question('Enter Audibase email: ', (email) => {
      resolve(email);
    });
  });
}

function getPassword() {
  return new Promise((resolve) => {
    rl.question('Enter Audibase password: ', (password) => {
      resolve(password);
    });
  });
}

function getRemotePath() {
  return new Promise((resolve) => {
    rl.question('Enter the remote path: ', (remotePath) => {
      resolve(remotePath);
    });
  });
}

function askQuestion(question, options) {
  return new Promise((resolve) => {
    const ask = () => {
      rl.question(question, (answer) => {
        const normalizedAnswer = answer.toLowerCase();
        if (options.includes(normalizedAnswer)) {
          resolve(normalizedAnswer);
        } else {
          console.log(`Please enter one of the following: ${options.join(', ')}`);
          ask(); // ask again
        }
      });
    };
    ask();
  });
}

// Usage example:
async function getDestination() {
  const destination = await askQuestion('Pull or push?: ', ['pull', 'push']);
  console.log(`You selected: ${destination}`);
  return destination;
}

module.exports = { getEmail, getPassword, getRemotePath, getDestination };
