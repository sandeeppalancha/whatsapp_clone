// server/src/server.js
require('dotenv').config();
const app = require('./app');
const { createServer } = require('http');
const configureSocket = require('./socket/socket');

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = createServer(app);

// Configure Socket.io
configureSocket(server);

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});