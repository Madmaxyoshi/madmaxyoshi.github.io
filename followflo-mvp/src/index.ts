import { App } from '@slack/bolt';
import dotenv from 'dotenv';
import { initDatabase } from './database';
import { registerCommands } from './commands';
import { registerListeners } from './listeners';
import { registerDashboard } from './dashboard';
import { checkAndExecuteEscalations } from './escalation';

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

    // Start escalation scheduler (every 30 minutes)
    setInterval(async () => {
      try {
        await checkAndExecuteEscalations(app);
        console.log('✅ Escalation check completed');
      } catch (error) {
        console.error('❌ Escalation check error:', error);
      }
    }, 30 * 60 * 1000);

    // Run initial escalation check after 2 minutes
    setTimeout(() => {
      checkAndExecuteEscalations(app).catch(error =>
        console.error('❌ Initial escalation check error:', error)
      );
    }, 2 * 60 * 1000);

    console.log('✅ Escalation scheduler started');

    await app.start(process.env.PORT || 3000);
    console.log('✅ FollowFlo MVP started (Lightning mode)');
  } catch (error) {
    console.error('❌ Error starting app:', error);
    process.exit(1);
  }
}

start();
