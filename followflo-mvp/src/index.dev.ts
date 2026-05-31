import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database.mock';
import { getCompletionMetrics, getTeamMetrics, getOverdueItems } from './metrics.mock';
import apiRouter from './api';

dotenv.config();

const expressApp = express();

expressApp.use(cors());
expressApp.use(express.json());
expressApp.use(apiRouter);

// Serve static dashboard
expressApp.use(express.static('frontend'));
expressApp.get('/', (req, res) => {
  res.sendFile(__dirname + '/../frontend/index.html');
});

async function start() {
  try {
    await initDatabase();
    console.log('✅ Mock Database initialized');

    const port = process.env.PORT || 3000;

    expressApp.listen(port, () => {
      console.log(`✅ Express server listening on port ${port}`);
      console.log(`📊 Dashboard: http://localhost:${port}`);
      console.log('🎯 Using mock data for demonstration');
    });
  } catch (error) {
    console.error('❌ Error starting app:', error);
    process.exit(1);
  }
}

start();
