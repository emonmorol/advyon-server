import { createServer, Server } from 'http';
import mongoose from 'mongoose';
import app from './app';
import seedSuperAdmin from './app/DB';
import config from './app/config';
import { socketService } from './app/modules/socket/socket.service';

let server: Server;

async function main() {
  try {
    await mongoose.connect(config.database_url as string);

    seedSuperAdmin();
    
    // Create HTTP server for both Express and Socket.io
    server = createServer(app);
    
    // Initialize WebSocket service (Phase 8)
    socketService.initialize(server);
    
    server.listen(config.port, () => {
      console.log(`🚀 Server listening on port ${config.port}`);
      console.log(`📡 WebSocket server ready`);
    });
  } catch (err) {
    console.log(err);
  }
}

main();

process.on('unhandledRejection', (err) => {
  console.log(`😈 unahandledRejection is detected , shutting down ...`, err);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  }
  process.exit(1);
});

process.on('uncaughtException', () => {
  console.log(`😈 uncaughtException is detected , shutting down ...`);
  process.exit(1);
});
