import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import { initDatabase } from './database';
import { registerCommands } from './commands';
import { registerListeners } from './listeners';

dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

async function start() {
  try {
    // Initialize database
    await initDatabase();
    console.log('✅ Database initialized');

    // Register Slack commands
    registerCommands(app);
    console.log('✅ Commands registered');

    // Register event listeners
    registerListeners(app);
    console.log('✅ Listeners registered');

    // Start the app
    await app.start(process.env.PORT || 3000);
    console.log('✅ FollowFlo app started');
  } catch (error) {
    console.error('❌ Error starting app:', error);
    process.exit(1);
  }
}

start();
