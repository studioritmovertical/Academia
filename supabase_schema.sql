
-- ==========================================================
-- STUDIO RITMO VERTICAL - DATABASE SCHEMA
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ==========================================================

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS
CREATE TABLE IF NOT EXISTS public.teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    modality TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    schedule_days INTEGER[] NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.student_classes (
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
    PRIMARY KEY (student_id, class_id)
);

CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    present BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(student_id, class_id, attendance_date)
);

-- 3. SEGURANÇA (RLS)
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso perfil próprio" ON public.teachers FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Gerenciar suas turmas" ON public.classes FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Gerenciar seus alunos" ON public.students FOR ALL USING (teacher_id = auth.uid());
CREATE POLICY "Gerenciar matriculas" ON public.student_classes FOR ALL 
USING (EXISTS (SELECT 1 FROM public.classes WHERE id = student_classes.class_id AND teacher_id = auth.uid()));
CREATE POLICY "Gerenciar frequencia" ON public.attendance FOR ALL 
USING (EXISTS (SELECT 1 FROM public.classes WHERE id = attendance.class_id AND teacher_id = auth.uid()));

-- 4. AUTOMAÇÃO DE PERFIL E TURMAS
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    teacher_name TEXT;
    teacher_modality TEXT;
BEGIN
    IF new.email = 'adriano@ritmovertical.com' THEN teacher_name := 'Adriano Galucio'; teacher_modality := 'Karatê';
    ELSIF new.email = 'mario@ritmovertical.com' THEN teacher_name := 'Mário Santiago'; teacher_modality := 'Judô';
    ELSIF new.email = 'james@ritmovertical.com' THEN teacher_name := 'James Carlos'; teacher_modality := 'Jiu Jitsu / Muay Thai / MMA';
    ELSIF new.email = 'joice@ritmovertical.com' THEN teacher_name := 'Joice Iara'; teacher_modality := 'Ginástica Rítmica';
    ELSIF new.email = 'nathalia@ritmovertical.com' THEN teacher_name := 'Nathalia Dias'; teacher_modality := 'Ballet Infantil (Terça)';
    ELSIF new.email = 'gaby@ritmovertical.com' THEN teacher_name := 'Gaby Roxa'; teacher_modality := 'Ballet Infantil (Quinta)';
    ELSIF new.email = 'jaqueline@ritmovertical.com' THEN teacher_name := 'Jaqueline Resplandes'; teacher_modality := 'Pilates Solo';
    ELSE teacher_name := COALESCE(new.raw_user_meta_data->>'name', 'Professor'); teacher_modality := 'Geral';
    END IF;

    INSERT INTO public.teachers (id, name, email, modality)
    VALUES (new.id, teacher_name, new.email, teacher_modality);

    IF new.email = 'adriano@ritmovertical.com' THEN
        INSERT INTO public.classes (teacher_id, name, schedule_days, start_time, end_time, description) VALUES
        (new.id, 'Turma 01 - Iniciantes', '{1,3}', '18:30:00', '19:30:00', 'Segundas e Quartas'),
        (new.id, 'Turma 02 - Graduados', '{1,3}', '19:30:00', '21:00:00', 'Segundas e Quartas'),
        (new.id, 'Turma 03 - Iniciantes (3x)', '{1,3,5}', '18:30:00', '19:30:00', 'Seg, Qua e Sex'),
        (new.id, 'Turma 03 - Graduados (3x)', '{1,3,5}', '19:30:00', '21:00:00', 'Seg, Qua e Sex');
    ELSIF new.email = 'mario@ritmovertical.com' THEN
        INSERT INTO public.classes (teacher_id, name, schedule_days, start_time, end_time, description) VALUES
        (new.id, 'Turma 01 - Judô', '{2,4}', '15:00:00', '16:00:00', 'Terças e Quintas'),
        (new.id, 'Turma 02 - Judô', '{2,4}', '16:00:00', '17:00:00', 'Terças e Quintas');
    ELSIF new.email = 'james@ritmovertical.com' THEN
        INSERT INTO public.classes (teacher_id, name, schedule_days, start_time, end_time, description) VALUES
        (new.id, 'Jiu Jitsu - Turma 01', '{2,4}', '09:00:00', '10:00:00', 'Terças e Quintas'),
        (new.id, 'Jiu Jitsu - Turma 02', '{2,4}', '10:00:00', '11:00:00', 'Terças e Quintas'),
        (new.id, 'Muay Thai - Turma 01', '{2,4}', '20:30:00', '21:30:00', 'Terças e Quintas'),
        (new.id, 'MMA - Turma 01', '{2,4}', '21:30:00', '22:30:00', 'Terças e Quintas');
    ELSIF new.email = 'joice@ritmovertical.com' THEN
        INSERT INTO public.classes (teacher_id, name, schedule_days, start_time, end_time, description) VALUES
        (new.id, 'GR - Turma 01', '{1,3}', '15:30:00', '16:30:00', 'Segundas e Quartas'),
        (new.id, 'GR - Turma 02', '{1,3}', '16:30:00', '17:30:00', 'Segundas e Quartas'),
        (new.id, 'GR - Turma 03', '{1,3}', '17:30:00', '18:30:00', 'Segundas e Quartas'),
        (new.id, 'GR - Turma 04', '{1,3}', '18:30:00', '19:30:00', 'Segundas e Quartas');
    ELSIF new.email = 'nathalia@ritmovertical.com' THEN
        INSERT INTO public.classes (teacher_id, name, schedule_days, start_time, end_time, description) VALUES
        (new.id, 'Ballet Baby - T1', '{2}', '18:00:00', '18:50:00', 'Terças-feiras'),
        (new.id, 'Ballet Pré-Infantil - T2', '{2}', '19:00:00', '19:50:00', 'Terças-feiras'),
        (new.id, 'Ballet Infantil - T3', '{2}', '20:00:00', '21:00:00', 'Terças-feiras');
    ELSIF new.email = 'gaby@ritmovertical.com' THEN
        INSERT INTO public.classes (teacher_id, name, schedule_days, start_time, end_time, description) VALUES
        (new.id, 'Ballet Baby - T1', '{4}', '18:00:00', '18:50:00', 'Quintas-feiras'),
        (new.id, 'Ballet Pré-Infantil - T2', '{4}', '19:00:00', '19:50:00', 'Quintas-feiras'),
        (new.id, 'Ballet Infantil - T3', '{4}', '20:00:00', '21:00:00', 'Quintas-feiras');
    ELSIF new.email = 'jaqueline@ritmovertical.com' THEN
        INSERT INTO public.classes (teacher_id, name, schedule_days, start_time, end_time, description) VALUES
        (new.id, 'Pilates Solo - T1', '{2,4}', '18:00:00', '19:00:00', 'Terças e Quintas'),
        (new.id, 'Pilates Solo - T2', '{2,4}', '19:00:00', '20:00:00', 'Terças e Quintas');
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
