#!/usr/bin/env node

const child_process = require('child_process')
const inquirer      = require('inquirer')

const exec = command => new Promise((resolve, reject) =>
  child_process.exec(command, (err, stdout) => err ? reject(err) : resolve(stdout)))

const parseBranches = stdout => stdout.split('\n').map(b => b.trim()).filter(Boolean)
const cleanBranchName = name => name.replace(/^\*/, '')

const ask = (title, items) => inquirer.prompt(
  {
    type:    'list',
    name:    'value',
    message: title,
    choices: items,
  }
).then(choice => choice.value)

const selectBranch = () => exec('git branch')
  .then(parseBranches)
  .then(branches => branches.length ? ask('Select a branch', branches) : Promise.reject('No branches found...'))
  .then(branch   => selectAction(cleanBranchName(branch)))

const selectAction = branch => ask('What would you like to do ?', ['checkout', 'delete'])
  .then(action => {
    switch (action) {
      case 'checkout':
        return exec(`git co ${branch}`)
      case 'delete':
        return deleteBranch(branch)
    }
    return Promise.resolve()
  })

const deleteBranch = branch => ask('Are you sure ?', ['yes', 'no'])
  .then(response => response === 'yes' ? exec(`git branch -D ${branch}`) : selectBranch())

// 🏁 Let's Go 🏁
selectBranch()
  .catch(err => console.log(`❌  ${err}`))
  .then(() => process.exit(0))
