import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import { initDatabase } from './database';
import { registerCommands } from './commands';
import { registerListeners } from './listeners';
import { registerDashboard } from './dashboard';

dotenv.config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: true,
});

async function start() {
  try {
    await initDatabase();
    console.log('✅ Database initialized');

    registerCommands(app);
    console.log('✅ Commands registered');

    registerListeners(app);
    console.log('✅ Listeners registered');

    await registerDashboard(app);
    console.log('✅ Dashboard registered');

    await app.start(process.env.PORT || 3000);
    console.log('✅ FollowFlo MVP started (Lightning mode)');
  } catch (error) {
    console.error('❌ Error starting app:', error);
    process.exit(1);
  }
}

start();
