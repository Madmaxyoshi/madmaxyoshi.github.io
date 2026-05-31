import { App } from '@slack/bolt';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database.mock';
import { registerCommands } from './commands';
import { registerListeners } from './listeners';
import { registerDashboard } from './dashboard';
import { checkAndExecuteEscalations } from './escalation';
import apiRouter from './api';

dotenv.config();

const expressApp = express();
const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

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
    console.log('✅ Database initialized');

    registerCommands(slackApp);
    console.log('✅ Commands registered');

    registerListeners(slackApp);
    console.log('✅ Listeners registered');

    await registerDashboard(slackApp);
    console.log('✅ Dashboard registered');

    // Start escalation scheduler (every 30 minutes)
    setInterval(async () => {
      try {
        await checkAndExecuteEscalations(slackApp);
        console.log('✅ Escalation check completed');
      } catch (error) {
        console.error('❌ Escalation check error:', error);
      }
    }, 30 * 60 * 1000);

    // Run initial escalation check after 2 minutes
    setTimeout(() => {
      checkAndExecuteEscalations(slackApp).catch(error =>
        console.error('❌ Initial escalation check error:', error)
      );
    }, 2 * 60 * 1000);

    console.log('✅ Escalation scheduler started');

    const port = process.env.PORT || 3000;

    expressApp.listen(port, async () => {
      console.log(`✅ Express server listening on port ${port}`);
      await slackApp.start();
      console.log('✅ FLOWFLLOW MVP started');
    });
  } catch (error) {
    console.error('❌ Error starting app:', error);
    process.exit(1);
  }
}

start();
