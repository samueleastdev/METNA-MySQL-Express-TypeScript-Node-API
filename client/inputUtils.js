const prompts = require('prompts');

async function getLogoutData() {

  const response = await prompts([
    {
      type: 'text',
      name: 'remote',
      message: `Enter remote url:`
    },
    {
      type: 'autocomplete',
      name: 'option',
      message: 'Pick an option',
      hint: '- Space to select. Return to submit',
      choices: [
        { title: 'push', value: 'push' },
        { title: 'pull', value: 'pull' },
        { title: 'diff', value: 'diff' },
        { title: 'list', value: 'list' },
      ]
    },
    {
      type: 'text',
      name: 'email',
      message: `Enter Audibase email:`
    },
    {
      type: 'password',
      name: 'password',
      message: `Enter Audibase password:`
    },
  ]);

  return response;
}

async function getLoginData() {

  const response = await prompts([
    {
      type: 'autocomplete',
      name: 'option',
      message: 'Pick an option',
      hint: '- Space to select. Return to submit',
      choices: [
        { title: 'push', value: 'push' },
        { title: 'pull', value: 'pull' },
        { title: 'list', value: 'list' },
      ]
    },
    {
      type: 'password',
      name: 'password',
      message: `Enter Audibase password:`
    },
  ]);

  return response;
}

module.exports = { getLogoutData, getLoginData };
