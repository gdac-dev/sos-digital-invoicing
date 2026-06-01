// CommonJS bootstrap for loading the ESM server in Electron
// Using .cjs extension guarantees CommonJS mode regardless of package.json "type"
const path = require('path');
const { pathToFileURL } = require('url');

// Catch ALL unhandled errors
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT_EXCEPTION:', err.message);
  console.error(err.stack);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED_REJECTION:', reason);
});

(async () => {
  try {
    const serverFile = path.join(__dirname, 'index.js');
    const serverURL = pathToFileURL(serverFile).href;
    console.log('BOOTSTRAP: Loading server from:', serverURL);
    console.log('BOOTSTRAP: DATABASE_URL:', process.env.DATABASE_URL);
    console.log('BOOTSTRAP: PORT:', process.env.PORT);
    await import(serverURL);
    console.log('BOOTSTRAP: Server module loaded successfully');
  } catch (err) {
    console.error('BOOTSTRAP_FATAL:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
})();
