import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './api';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(apiRouter);

const port = process.env.PORT || 4000;

app.listen(port, () => {
  console.log(`✅ StackMix MVP サーバー起動 http://localhost:${port}`);
  console.log('🎵 音楽版Frame.io — コラボレーションプラットフォーム');
});
