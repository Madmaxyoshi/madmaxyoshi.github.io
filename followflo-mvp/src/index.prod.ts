import { App } from '@slack/bolt';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './database';
import { registerCommands } from './commands';
import { registerListeners } from './listeners';
import { registerDashboard } from './dashboard';
import { checkAndExecuteEscalations } from './escalation';
import apiRouter from './api';

dotenv.config();

const requiredEnvVars = [
  'SLACK_BOT_TOKEN',
  'SLACK_SIGNING_SECRET',
  'SLACK_APP_TOKEN',
];
const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error(`❌ 環境変数が不足しています: ${missing.join(', ')}`);
  process.exit(1);
}

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

expressApp.use(express.static('frontend'));
expressApp.get('/', (_req, res) => {
  res.sendFile(__dirname + '/../frontend/index.html');
});

expressApp.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function start() {
  try {
    await initDatabase();
    console.log('✅ Database initialized (PostgreSQL)');

    registerCommands(slackApp);
    registerListeners(slackApp);
    await registerDashboard(slackApp);

    setInterval(async () => {
      try {
        await checkAndExecuteEscalations(slackApp);
      } catch (error) {
        console.error('❌ Escalation check error:', error);
      }
    }, 30 * 60 * 1000);

    setTimeout(() => {
      checkAndExecuteEscalations(slackApp).catch(err =>
        console.error('❌ Initial escalation check error:', err)
      );
    }, 2 * 60 * 1000);

    const port = process.env.PORT || 3000;
    expressApp.listen(port, async () => {
      console.log(`✅ FLOWFLLOW サーバー起動 port:${port}`);
      await slackApp.start();
      console.log('✅ Slack Bot 起動完了');
    });
  } catch (error) {
    console.error('❌ 起動エラー:', error);
    process.exit(1);
  }
}

start();
