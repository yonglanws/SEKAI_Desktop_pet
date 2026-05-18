const { spawn } = require('child_process')
const path = require('path')

const vite = spawn('npx', ['vite'], {
  shell: true,
  stdio: 'inherit',
  cwd: __dirname,
})

vite.on('error', (err) => {
  console.error('Failed to start vite:', err.message)
  process.exit(1)
})

setTimeout(() => {
  const electron = spawn('npx', ['electron', '.'], {
    shell: true,
    stdio: 'inherit',
    cwd: __dirname,
    env: { ...process.env, NODE_ENV: 'development' },
  })

  electron.on('error', (err) => {
    console.error('Failed to start electron:', err.message)
  })
}, 3000)
