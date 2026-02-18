
-- ==========================================================
-- STUDIO RITMO VERTICAL - DATABASE SCHEMA V2
-- ==========================================================

-- 1. TABELA DE PROFESSORES
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    modality TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABELA DE ADMINISTRADORES
CREATE TABLE IF NOT EXISTS public.administrators (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. TABELA DE TURMAS
CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    schedule_days INTEGER[] NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. TABELA DE ALUNOS (Global para o Studio)
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. TABELA DE RELAÇÃO ALUNO-TURMA (Matrículas)
CREATE TABLE IF NOT EXISTS public.student_classes (
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    PRIMARY KEY (student_id, class_id)
);

-- 6. TABELA DE FREQUÊNCIA
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE NOT NULL,
    attendance_date DATE NOT NULL,
    present BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- ==========================================================
-- CONFIGURAÇÕES DE SEGURANÇA (RLS) - ACESSO PÚBLICO PARA MATRÍCULA
-- ==========================================================

ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Funções auxiliares
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.administrators WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICAS PUBLICAS (Para Matrícula de Alunos)
CREATE POLICY "Public teachers access" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Public classes access" ON public.classes FOR SELECT USING (true);
CREATE POLICY "Public student insert" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Public enrollment insert" ON public.student_classes FOR INSERT WITH CHECK (true);

-- POLÍTICAS PRIVADAS (Professores/Admin)
CREATE POLICY "Admin total access" ON public.teachers FOR ALL USING (public.is_admin());
CREATE POLICY "Admin total access admins" ON public.administrators FOR ALL USING (public.is_admin() OR auth.uid() = id);
CREATE POLICY "Teacher own profile" ON public.teachers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Teacher/Admin select students" ON public.students FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Teacher/Admin manage classes" ON public.classes FOR ALL USING (public.is_admin() OR teacher_id = auth.uid());
CREATE POLICY "Teacher/Admin manage enrollments" ON public.student_classes FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Teacher/Admin manage attendance" ON public.attendance FOR ALL USING (auth.uid() IS NOT NULL);
