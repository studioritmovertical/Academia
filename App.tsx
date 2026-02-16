
import React, { useState, useEffect } from 'react';
import { Teacher, Class, Student, AttendanceRecord } from './types';
import TeacherDashboard from './components/TeacherDashboard';
import ClassDetails from './components/ClassDetails';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<Teacher | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<{ student_id: string, class_id: string }[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');

  const isOfficialEmail = emailInput.toLowerCase().endsWith('@ritmovertical.com');

  useEffect(() => {
    const initSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      // Verifica se o usuário veio de um link de recuperação de senha
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        setIsRecovering(true);
      }

      setSession(currentSession);
      if (currentSession?.user) {
        await fetchTeacherProfile(currentSession.user.id);
      } else {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }

      if (newSession?.user) {
        await fetchTeacherProfile(newSession.user.id);
      } else {
        setCurrentUser(null);
        setClasses([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchTeacherProfile = async (userId: string) => {
    setLoading(true);
    try {
      let { data, error } = await supabase.from('teachers').select('*').eq('id', userId).single();
      
      if (!data && !error) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const retry = await supabase.from('teachers').select('*').eq('id', userId).single();
        data = retry.data;
      }

      if (data) {
        setCurrentUser(data);
        await fetchData(userId);
      } else if (!isRecovering) {
        setAuthError("Perfil não encontrado. Verifique seu cadastro.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Erro ao carregar dados do servidor.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (userId: string) => {
    const [classesRes, studentsRes, enrollRes, attendanceRes] = await Promise.all([
      supabase.from('classes').select('*').eq('teacher_id', userId),
      supabase.from('students').select('*').eq('teacher_id', userId),
      supabase.from('student_classes').select('*'),
      supabase.from('attendance').select('*')
    ]);

    if (classesRes.data) setClasses(classesRes.data.map(c => ({
      id: c.id, teacherId: c.teacher_id, name: c.name, scheduleDays: c.schedule_days,
      startTime: c.start_time, endTime: c.end_time, description: c.description
    })));

    if (studentsRes.data) setStudents(studentsRes.data.map(s => ({
      id: s.id, teacherId: s.teacher_id, name: s.name, active: s.active
    })));

    if (enrollRes.data) setEnrollments(enrollRes.data);

    if (attendanceRes.data) setAttendance(attendanceRes.data.map(a => ({
      id: a.id, studentId: a.student_id, classId: a.class_id, date: a.attendance_date, present: a.present
    })));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const { error } = await supabase.auth.signInWithPassword({
      email: fd.get('email') as string,
      password: fd.get('password') as string,
    });
    if (error) { 
      setAuthError(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message); 
      setLoading(false); 
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const newPassword = fd.get('new_password') as string;
    
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      setAuthError(error.message);
      setLoading(false);
    } else {
      setAuthSuccess("Senha atualizada com sucesso! Você já pode acessar o sistema.");
      setIsRecovering(false);
      setLoading(false);
      // Limpar o hash da URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const email = fd.get('email') as string;
    const name = fd.get('name') as string;
    
    const { error } = await supabase.auth.signUp({
      email,
      password: fd.get('password') as string,
      options: { 
        data: { name },
        emailRedirectTo: window.location.origin 
      }
    });
    
    if (error) { 
      setAuthError(error.message); 
      setLoading(false); 
    } else { 
      setAuthSuccess('Cadastro realizado! Se você é um professor oficial, suas turmas já aparecerão.'); 
      setIsRegistering(false); 
      setLoading(false); 
    }
  };

  const handleResetPassword = async () => {
    if (!emailInput) {
      setAuthError("Digite seu e-mail no campo acima para recuperar a senha.");
      return;
    }
    setLoading(true);
    setAuthError(null);
    setAuthSuccess(null);
    
    const { error } = await supabase.auth.resetPasswordForEmail(emailInput, {
      redirectTo: window.location.origin,
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthSuccess("Link de recuperação enviado! Verifique sua caixa de entrada.");
    }
    setLoading(false);
  };

  const handleAddStudentToClass = async (name: string, classId: string) => {
    if (!currentUser) return;
    const { data: student } = await supabase.from('students')
      .insert([{ name, teacher_id: currentUser.id }]).select().single();

    if (student) {
      await supabase.from('student_classes').insert([{ student_id: student.id, class_id: classId }]);
      setStudents([...students, { id: student.id, teacherId: student.teacher_id, name: student.name, active: student.active }]);
      setEnrollments([...enrollments, { student_id: student.id, class_id: classId }]);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!confirm('Excluir este aluno permanentemente?')) return;
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (!error) setStudents(students.filter(s => s.id !== id));
  };

  const handleToggleAttendance = async (studentId: string, classId: string, date: string) => {
    const existing = attendance.find(a => a.studentId === studentId && a.classId === classId && a.date === date);
    if (existing) {
      const { error } = await supabase.from('attendance').delete().eq('id', existing.id);
      if (!error) setAttendance(attendance.filter(a => a.id !== existing.id));
    } else {
      const { data } = await supabase.from('attendance')
        .insert([{ student_id: studentId, class_id: classId, attendance_date: date, present: true }]).select().single();
      if (data) setAttendance([...attendance, { id: data.id, studentId: data.student_id, classId: data.class_id, date: data.attendance_date, present: data.present }]);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="font-bold text-indigo-300 tracking-widest animate-pulse uppercase text-xs">Carregando...</p>
    </div>
  );

  if (isRecovering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-2xl border border-white/20">
          <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-3xl text-white font-black text-3xl mb-4">🔑</div>
             <h1 className="text-3xl font-black text-slate-900 leading-tight">Nova Senha</h1>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Defina sua nova credencial de acesso</p>
          </div>

          {authError && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border-l-4 border-red-500">{authError}</div>}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative group">
              <input name="new_password" type="password" required placeholder="Digite a nova senha" title="Mínimo 6 caracteres" className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              <svg className="absolute left-4 top-4 w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-indigo-700 transition-all active:scale-95">
              Salvar Nova Senha
            </button>
          </form>
          <button onClick={() => setIsRecovering(false)} className="w-full mt-4 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-indigo-600">Cancelar e voltar</button>
        </div>
      </div>
    );
  }

  if (!session || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.5)] border border-white/20">
          <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-3xl text-white font-black text-3xl mb-4 shadow-xl shadow-indigo-200">R</div>
             <h1 className="text-3xl font-black text-slate-900 leading-tight">Ritmo Vertical</h1>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em] mt-2">Controle de Frequência</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-xl text-sm font-medium animate-fade-in flex gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              <span>{authError}</span>
            </div>
          )}

          {authSuccess && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded-xl text-sm font-medium animate-fade-in flex gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{authSuccess}</span>
            </div>
          )}

          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && (
              <div className="relative group">
                <input name="name" required placeholder="Nome Completo" className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
                <svg className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              </div>
            )}
            
            <div className="relative group">
              <input 
                name="email" 
                type="email" 
                required 
                placeholder="E-mail (@ritmovertical.com)" 
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
              />
              <svg className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>

            <div className="relative group">
              <input name="password" type="password" required placeholder="Senha" className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all" />
              <svg className="absolute left-4 top-4 w-5 h-5 text-slate-300 group-focus-within:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-[0.98] mt-2">
              {isRegistering ? 'Criar minha conta' : 'Acessar Painel'}
            </button>
          </form>
          
          <div className="mt-8 flex flex-col items-center gap-3">
            <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); setAuthSuccess(null); }} className="text-sm text-slate-400 font-medium hover:text-indigo-600 transition-colors">
              {isRegistering ? 'Já é cadastrado? ' : 'Ainda não tem conta? '}
              <span className="text-indigo-600 font-bold underline underline-offset-4">{isRegistering ? 'Fazer Login' : 'Cadastre-se'}</span>
            </button>
            
            {!isRegistering && (
               <button onClick={handleResetPassword} className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-indigo-600">
                 Esqueci minha senha
               </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveClassId(null)}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl group-hover:rotate-12 transition-transform shadow-lg shadow-indigo-100">R</div>
          <div className="hidden sm:block">
            <div className="font-black text-slate-900 text-lg leading-none uppercase">Ritmo Vertical</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Painel Administrativo</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-black text-slate-900 leading-none">{currentUser.name}</div>
            <div className="text-[10px] text-indigo-500 font-bold uppercase tracking-widest mt-1">{currentUser.modality}</div>
          </div>
          <div className="h-8 w-px bg-slate-100 mx-2 hidden sm:block"></div>
          <button 
            onClick={() => supabase.auth.signOut()} 
            className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:text-red-500 font-bold text-xs uppercase tracking-wider transition-colors rounded-xl hover:bg-red-50"
          >
            Sair
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {!activeClassId ? (
          <TeacherDashboard teacher={currentUser} classes={classes} onSelectClass={setActiveClassId} />
        ) : (
          <ClassDetails
            activeClass={classes.find(c => c.id === activeClassId)!}
            students={students.filter(s => enrollments.some(e => e.student_id === s.id && e.class_id === activeClassId))}
            attendance={attendance}
            onBack={() => setActiveClassId(null)}
            onAddStudent={handleAddStudentToClass}
            onDeleteStudent={handleDeleteStudent}
            onToggleAttendance={handleToggleAttendance}
          />
        )}
      </main>

      <footer className="mt-20 py-8 border-t border-slate-100 text-center text-slate-400 text-xs font-medium uppercase tracking-widest">
        &copy; {new Date().getFullYear()} Studio Ritmo Vertical • Gestão Profissional
      </footer>
    </div>
  );
};

export default App;
