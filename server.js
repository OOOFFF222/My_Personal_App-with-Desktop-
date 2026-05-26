const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 8080;

// Supabase 클라이언트
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// 미들웨어
app.use(cors());
app.use(express.json());

// ═══════════════════════════════════════════════════════════
// 주간 할 일
// ═══════════════════════════════════════════════════════════

// 조회
app.get('/api/weekly', async (req, res) => {
  const { data, error } = await supabase
    .from('weekly')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// 추가
app.post('/api/weekly', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  
  const { data, error } = await supabase
    .from('weekly')
    .insert([{ text, done: false }])
    .select();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// 수정 (토글)
app.patch('/api/weekly/:id', async (req, res) => {
  const { id } = req.params;
  const { done, text } = req.body;
  
  const { data, error } = await supabase
    .from('weekly')
    .update({ done, text })
    .eq('id', id)
    .select();
  
  if (error) return res.status(500).json({ error: error.message });
  
  // 같은 텍스트의 오늘 할 일도 동기화
  if (text) {
    await supabase
      .from('today')
      .update({ done })
      .eq('text', text);
  }
  
  res.json(data[0]);
});

// 삭제
app.delete('/api/weekly/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('weekly')
    .delete()
    .eq('id', id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════
// 오늘 할 일
// ═══════════════════════════════════════════════════════════

// 조회
app.get('/api/today', async (req, res) => {
  const { data, error } = await supabase
    .from('today')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// 추가
app.post('/api/today', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text required' });
  
  const { data, error } = await supabase
    .from('today')
    .insert([{ text, done: false }])
    .select();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

// 수정 (토글)
app.patch('/api/today/:id', async (req, res) => {
  const { id } = req.params;
  const { done, text } = req.body;
  
  const { data, error } = await supabase
    .from('today')
    .update({ done, text })
    .eq('id', id)
    .select();
  
  if (error) return res.status(500).json({ error: error.message });
  
  // 같은 텍스트의 주간 할 일도 동기화
  if (text) {
    await supabase
      .from('weekly')
      .update({ done })
      .eq('text', text);
  }
  
  res.json(data[0]);
});

// 삭제
app.delete('/api/today/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('today')
    .delete()
    .eq('id', id);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// ═══════════════════════════════════════════════════════════
// 논문
// ═══════════════════════════════════════════════════════════

// 저장
app.post('/api/papers', async (req, res) => {
  const { keyword, papers } = req.body;
  if (!keyword || !papers) return res.status(400).json({ error: 'keyword and papers required' });
  
  const papersToInsert = papers.map(p => ({
    keyword,
    title: p.title,
    authors: p.authors,
    year: p.year,
    journal: p.journal,
    abstract_en: p.abstract_en,
    abstract_kr: p.abstract_kr,
    contribution: p.contribution
  }));
  
  const { data, error } = await supabase
    .from('papers')
    .insert(papersToInsert)
    .select();
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// 조회
app.get('/api/papers', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ error: 'keyword required' });
  
  const { data, error } = await supabase
    .from('papers')
    .select('*')
    .eq('keyword', keyword)
    .order('created_at', { ascending: false })
    .limit(2);
  
  if (error) return res.status(500).json({ error: error.message });
  res.json(data || []);
});

// 헬스 체크
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 시작
app.listen(PORT, () => {
  console.log(`\n✅ Server running on port ${PORT}`);
  console.log(`📍 Railway URL: Check your Railway dashboard\n`);
});
