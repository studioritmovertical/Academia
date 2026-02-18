
-- 1. Garante que as colunas existam na tabela de estudantes
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- 2. Habilita o RLS
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de inserção pública para a página de auto-matrícula
DROP POLICY IF EXISTS "Permitir inserção de alunos" ON public.students;
CREATE POLICY "Permitir inserção de alunos" ON public.students FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir inserção de matriculas" ON public.student_classes;
CREATE POLICY "Permitir inserção de matriculas" ON public.student_classes FOR INSERT WITH CHECK (true);

-- 4. Políticas de leitura para o carômetro funcionar
DROP POLICY IF EXISTS "Leitura pública de estudantes" ON public.students;
CREATE POLICY "Leitura pública de estudantes" ON public.students FOR SELECT USING (true);

DROP POLICY IF EXISTS "Leitura pública de matriculas" ON public.student_classes;
CREATE POLICY "Leitura pública de matriculas" ON public.student_classes FOR SELECT USING (true);
