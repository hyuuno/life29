-- =============================================
-- Life29 - Album 表 RLS 策略
-- 允许所有认证用户和匿名用户访问
-- =============================================

-- 启用 RLS
ALTER TABLE public.album ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果有）
DROP POLICY IF EXISTS "Allow public read access" ON public.album;
DROP POLICY IF EXISTS "Allow public insert access" ON public.album;
DROP POLICY IF EXISTS "Allow public update access" ON public.album;
DROP POLICY IF EXISTS "Allow public delete access" ON public.album;

-- 创建允许所有人读取的策略
CREATE POLICY "Allow public read access"
ON public.album
FOR SELECT
TO public
USING (true);

-- 创建允许所有人插入的策略
CREATE POLICY "Allow public insert access"
ON public.album
FOR INSERT
TO public
WITH CHECK (true);

-- 创建允许所有人更新的策略
CREATE POLICY "Allow public update access"
ON public.album
FOR UPDATE
TO public
USING (true)
WITH CHECK (true);

-- 创建允许所有人删除的策略
CREATE POLICY "Allow public delete access"
ON public.album
FOR DELETE
TO public
USING (true);

-- =============================================
-- 可选：如果需要更严格的控制，可以使用以下策略
-- 只允许认证用户访问（需要登录）
-- =============================================

-- DROP POLICY IF EXISTS "Allow authenticated read access" ON public.album;
-- DROP POLICY IF EXISTS "Allow authenticated insert access" ON public.album;
-- DROP POLICY IF EXISTS "Allow authenticated update access" ON public.album;
-- DROP POLICY IF EXISTS "Allow authenticated delete access" ON public.album;

-- CREATE POLICY "Allow authenticated read access"
-- ON public.album
-- FOR SELECT
-- TO authenticated
-- USING (true);

-- CREATE POLICY "Allow authenticated insert access"
-- ON public.album
-- FOR INSERT
-- TO authenticated
-- WITH CHECK (true);

-- CREATE POLICY "Allow authenticated update access"
-- ON public.album
-- FOR UPDATE
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- CREATE POLICY "Allow authenticated delete access"
-- ON public.album
-- FOR DELETE
-- TO authenticated
-- USING (true);
