
import React, { useState, useEffect } from 'react';
import { Teacher, Administrator, Class, Student, AttendanceRecord } from './types';
import TeacherDashboard from './components/TeacherDashboard';
import ClassDetails from './components/ClassDetails';
import AdminDashboard from './components/AdminDashboard';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<Teacher | Administrator | null>(null);
  const [userRole, setUserRole] = useState<'teacher' | 'admin' | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]); // Apenas para Admin
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<{ student_id: string, class_id: string }[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');

  useEffect(() => {
    const initSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      if (currentSession?.user) {
        await fetchUserProfile(currentSession.user.id);
      } else {
        setLoading(false);
      }
    };
    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') setIsRecovering(true);
      if (newSession?.user) {
        await fetchUserProfile(newSession.user.id);
      } else {
        setCurrentUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    setLoading(true);
    try {
      // 1. Tenta buscar em Administrators
      const { data: adminData } = await supabase.from('administrators').select('*').eq('id', userId).single();
      if (adminData) {
        setCurrentUser(adminData);
        setUserRole('admin');
        await fetchAllData();
        setLoading(false);
        return;
      }

      // 2. Se não for admin, tenta em Teachers
      const { data: teacherData } = await supabase.from('teachers').select('*').eq('id', userId).single();
      if (teacherData) {
        setCurrentUser(teacherData);
        setUserRole('teacher');
        await fetchData(userId);
      } else if (!isRecovering) {
        setAuthError("Perfil não encontrado. Contate o administrador.");
      }
    } catch (err) {
      console.error(err);
      setAuthError("Erro ao carregar dados do servidor.");
    } finally {
      setLoading(false);
    }
  };

  // Busca dados restritos ao professor
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

  // Busca TODOS os dados para o administrador
  const fetchAllData = async () => {
    const [teachersRes, classesRes, studentsRes, enrollRes, attendanceRes] = await Promise.all([
      supabase.from('teachers').select('*'),
      supabase.from('classes').select('*'),
      supabase.from('students').select('*'),
      supabase.from('student_classes').select('*'),
      supabase.from('attendance').select('*')
    ]);
    if (teachersRes.data) setTeachers(teachersRes.data);
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
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const { error } = await supabase.auth.updateUser({ password: fd.get('new_password') as string });
    if (error) {
      setAuthError(error.message);
      setLoading(false);
    } else {
      setAuthSuccess("Senha atualizada!");
      setIsRecovering(false);
      setLoading(false);
      window.history.replaceState(null, '', window.location.pathname);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const { error } = await supabase.auth.signUp({
      email: fd.get('email') as string,
      password: fd.get('password') as string,
      options: { data: { name: fd.get('name') as string }, emailRedirectTo: window.location.origin }
    });
    if (error) { setAuthError(error.message); setLoading(false); }
    else { setAuthSuccess('Cadastro realizado! Se você é um professor oficial, suas turmas já aparecerão.'); setIsRegistering(false); setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!emailInput) { setAuthError("Digite seu e-mail."); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(emailInput, { redirectTo: window.location.origin });
    if (error) setAuthError(error.message);
    else setAuthSuccess("Link enviado!");
    setLoading(false);
  };

  const handleAddStudentToClass = async (name: string, classId: string, customTeacherId?: string) => {
    const teacherId = customTeacherId || (userRole === 'teacher' ? (currentUser as Teacher).id : null);
    if (!teacherId) {
      const cls = classes.find(c => c.id === classId);
      if (!cls) return;
      var targetTeacherId = cls.teacherId;
    } else {
      var targetTeacherId = teacherId;
    }

    const { data: student } = await supabase.from('students')
      .insert([{ name, teacher_id: targetTeacherId }]).select().single();

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
          <h1 className="text-3xl font-black text-slate-900 text-center mb-8">Nova Senha</h1>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <input name="new_password" type="password" required placeholder="Digite a nova senha" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-indigo-700">Salvar Nova Senha</button>
          </form>
          <button onClick={() => setIsRecovering(false)} className="w-full mt-4 text-slate-400 text-xs font-bold uppercase hover:text-indigo-600">Voltar</button>
        </div>
      </div>
    );
  }

  if (!session || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-4">
        <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-[2.5rem] p-10 shadow-2xl">
          <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-3xl text-white font-black text-3xl mb-4">R</div>
             <h1 className="text-3xl font-black text-slate-900">Ritmo Vertical</h1>
             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Acesso Restrito</p>
          </div>
          {authError && <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-sm font-medium border-l-4 border-red-500">{authError}</div>}
          {authSuccess && <div className="mb-6 p-4 bg-green-50 text-green-700 rounded-xl text-sm font-medium border-l-4 border-green-500">{authSuccess}</div>}
          <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
            {isRegistering && <input name="name" required placeholder="Nome Completo" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />}
            <input name="email" type="email" required placeholder="E-mail" value={emailInput} onChange={e => setEmailInput(e.target.value)} className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
            <input name="password" type="password" required placeholder="Senha" className="w-full p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500" />
            <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-lg hover:bg-indigo-700">{isRegistering ? 'Cadastrar' : 'Entrar'}</button>
          </form>
          <div className="mt-8 flex flex-col items-center gap-3">
            <button onClick={() => { setIsRegistering(!isRegistering); setAuthError(null); }} className="text-sm text-slate-400 font-medium">
              {isRegistering ? 'Já tem conta? Fazer Login' : 'Ainda não tem conta? Cadastre-se'}
            </button>
            {!isRegistering && <button onClick={handleResetPassword} className="text-[10px] text-slate-400 font-bold uppercase hover:text-indigo-600">Esqueci minha senha</button>}
          </div>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    supabase.auth.signOut();
    setCurrentUser(null);
    setUserRole(null);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => setActiveClassId(null)}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl">R</div>
          <div className="hidden sm:block">
            <div className="font-black text-slate-900 text-lg uppercase leading-none">Ritmo Vertical</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{userRole === 'admin' ? 'Gestão Administrativa' : 'Painel do Professor'}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-black text-slate-900 leading-none">{currentUser.name}</div>
            <div className="text-[10px] text-indigo-500 font-bold uppercase mt-1">
                {userRole === 'admin' ? 'Diretor' : (currentUser as Teacher).modality}
            </div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-slate-400 hover:text-red-500 font-bold text-xs uppercase tracking-wider transition-colors">Sair</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-8">
        {userRole === 'admin' ? (
          !activeClassId ? (
            <AdminDashboard 
                admin={currentUser as Administrator} 
                teachers={teachers} 
                classes={classes} 
                students={students} 
                attendance={attendance}
                enrollments={enrollments}
                onSelectClass={setActiveClassId}
                onAddStudentToClass={handleAddStudentToClass}
                onRefresh={fetchAllData}
            />
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
          )
        ) : (
          !activeClassId ? (
            <TeacherDashboard teacher={currentUser as Teacher} classes={classes} onSelectClass={setActiveClassId} />
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
          )
        )}
      </main>
    </div>
  );
};

export default App;
