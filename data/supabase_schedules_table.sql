-- Life29 Schedule 数据表
-- 用于存储【做咩】页面的日程数据

CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    week_key VARCHAR(50) UNIQUE NOT NULL,  -- 格式: schedule-YYYY-MM-DD (周一日期)
    wiwi_data JSONB DEFAULT '{}',          -- wiwi 的日程数据
    yuyu_data JSONB DEFAULT '{}',          -- yuyu 的日程数据
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_schedules_week_key ON schedules(week_key);
CREATE INDEX IF NOT EXISTS idx_schedules_updated_at ON schedules(updated_at);

-- 启用 RLS (行级安全)
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;

-- 创建公开访问策略 (允许所有操作，适合个人项目)
CREATE POLICY "Allow all operations on schedules" ON schedules
    FOR ALL
    TO public
    USING (true)
    WITH CHECK (true);

-- 示例数据结构说明:
-- wiwi_data / yuyu_data 的 JSON 格式:
-- {
--   "0-0": { "content": "会议内容", "color": "bg-blue" },
--   "0-1": { "content": "其他事项", "color": "bg-green" },
--   ...
-- }
-- 其中 key 格式为 "行号-列号"
-- 行号: 0-23 (对应 3:00-2:00 的时间段)
-- 列号: 0-6 (对应周一到周日)
-- color 可选值: bg-orange, bg-blue, bg-green, bg-pink, bg-purple, bg-yellow, bg-teal, bg-gray
