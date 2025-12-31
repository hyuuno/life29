-- Songs 表新增字段
-- 用于支持 thoughts 作者/时间 和 feedback/comments 功能

-- 添加 thoughts 相关字段
ALTER TABLE songs ADD COLUMN IF NOT EXISTS thoughts_author TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS thoughts_time TIMESTAMPTZ;

-- 添加 feedback (comments) 相关字段
ALTER TABLE songs ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS feedback_author TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS feedback_time TIMESTAMPTZ;

-- 如果需要创建完整的 songs 表，使用以下语句：
/*
CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    album TEXT,
    language TEXT,
    genre TEXT,
    cover TEXT,
    file TEXT,
    thoughts TEXT,
    thoughts_author TEXT,
    thoughts_time TIMESTAMPTZ,
    feedback TEXT,
    feedback_author TEXT,
    feedback_time TIMESTAMPTZ,
    uploaded_by TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取
CREATE POLICY "Allow public read" ON songs FOR SELECT USING (true);

-- 允许所有人插入和更新
CREATE POLICY "Allow public insert" ON songs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON songs FOR UPDATE USING (true);
*/
