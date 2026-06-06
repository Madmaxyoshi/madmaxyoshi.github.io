/**
 * Studio One 7 AI辞書 - バックエンドサーバー
 *
 * Claude API への安全なプロキシ。APIキーはサーバー側でのみ保持し、
 * クライアントには絶対に露出させない。
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT_JA, SYSTEM_PROMPT_EN } from './system-prompt';

dotenv.config();

function buildSystemPrompt(language: 'ja' | 'en'): string {
  const basePrompt = language === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_JA;
  try {
    const kbFile = language === 'en' ? 'knowledge-en.md' : 'knowledge.md';
    const kbPath = path.join(__dirname, `../data/${kbFile}`);
    const kb = fs.readFileSync(kbPath, 'utf-8');
    const prefix = language === 'en'
      ? '\n\n# Reference Knowledge Base (Verified Operation Information)\nThe following are verified operations. Prioritize this as the basis for your answers.\n\n'
      : '\n\n# 参照知識ベース（正確な操作情報）\n以下は検証済みの操作情報です。回答の根拠として優先してください。\n\n';
    return basePrompt + prefix + kb;
  } catch {
    return basePrompt;
  }
}

const FULL_SYSTEM_PROMPT_JA = buildSystemPrompt('ja');
const FULL_SYSTEM_PROMPT_EN = buildSystemPrompt('en');

const app = express();
app.use(cors());
app.use(express.json());

// 静的ファイル（フロントエンド）を配信
app.use(express.static(path.join(__dirname, '../public')));

// Will be initialized per request with key from header or env
function getAnthropicClient(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

// ヘルスチェック（Railway用）
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'studio-one-ai', timestamp: new Date().toISOString() });
});

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * 質問エンドポイント。会話履歴を受け取り、Studio One 7 専門の回答を返す。
 * APIキー取得元：リクエストヘッダ（X-API-Key）→ 環境変数（ANTHROPIC_API_KEY）
 * クエリパラメータ: ?language=en (デフォルト: ja)
 */
app.post('/api/ask', async (req, res) => {
  try {
    const { messages } = req.body as { messages: ChatMessage[] };
    const language = (req.query.language as string || 'ja') as 'ja' | 'en';
    const apiKeyHeader = req.headers['x-api-key'] as string;
    const apiKey = apiKeyHeader || process.env.ANTHROPIC_API_KEY || '';

    if (!Array.isArray(messages) || messages.length === 0) {
      const error = language === 'en' ? 'Empty question.' : '質問が空です。';
      return res.status(400).json({ error });
    }

    if (!apiKey) {
      const error = language === 'en'
        ? 'API key not configured.'
        : 'APIキーが未設定です。';
      return res.status(503).json({ error });
    }

    const systemPrompt = language === 'en' ? FULL_SYSTEM_PROMPT_EN : FULL_SYSTEM_PROMPT_JA;
    const trimmed = messages.slice(-20);
    const anthropic = getAnthropicClient(apiKey);

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: trimmed.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const answer =
      response.content[0].type === 'text' ? response.content[0].text : '';

    res.json({ answer });
  } catch (error: any) {
    const language = (req.query.language as string || 'ja') as 'ja' | 'en';
    console.error('ask error:', error?.message || error);
    const errorMsg = language === 'en'
      ? 'Error generating response. Please try again.'
      : '回答の生成中にエラーが発生しました。';
    res.status(500).json({ error: errorMsg });
  }
});

const port = process.env.PORT || 3200;
app.listen(port, () => {
  console.log(`✅ Studio One 7 AI辞書 server listening on port ${port}`);
  console.log(`📖 http://localhost:${port}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.log('⚠️  ANTHROPIC_API_KEY 未設定（/api/ask は503を返します）');
  }
});

export default app;
