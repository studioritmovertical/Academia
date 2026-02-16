
-- ==========================================================
-- STUDIO RITMO VERTICAL - FULL DATABASE SCHEMA
-- ==========================================================

-- 1. TABELA DE PROFESSORES
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    modality TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. TABELA DE ADMINISTRADORES (A nova tabela solicitada)
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

-- 4. TABELA DE ALUNOS
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
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
-- CONFIGURAÇÕES DE SEGURANÇA (RLS)
-- ==========================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- FUNÇÃO AUXILIAR PARA VERIFICAR SE O USUÁRIO É ADMIN
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.administrators WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- POLÍTICAS PARA ADMINISTRADORES (ACESSO TOTAL)
CREATE POLICY "Admin total access" ON public.teachers FOR ALL USING (public.is_admin());
CREATE POLICY "Admin total access admin" ON public.administrators FOR ALL USING (public.is_admin() OR auth.uid() = id);
CREATE POLICY "Admin total access classes" ON public.classes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin total access students" ON public.students FOR ALL USING (public.is_admin());
CREATE POLICY "Admin total access enroll" ON public.student_classes FOR ALL USING (public.is_admin());
CREATE POLICY "Admin total access atten" ON public.attendance FOR ALL USING (public.is_admin());

-- POLÍTICAS PARA PROFESSORES (ACESSO RESTRITO AOS SEUS DADOS)
CREATE POLICY "Teacher own profile" ON public.teachers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Teacher manage own classes" ON public.classes FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Teacher manage own students" ON public.students FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Teacher manage own enrollments" ON public.student_classes FOR ALL USING (
    EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND teacher_id = auth.uid())
);
CREATE POLICY "Teacher manage own attendance" ON public.attendance FOR ALL USING (
    EXISTS (SELECT 1 FROM public.classes WHERE id = class_id AND teacher_id = auth.uid())
);
