
import React, { useState, useEffect } from 'react';
import { Teacher, Administrator, Class, Student, AttendanceRecord } from './types';
import TeacherDashboard from './components/TeacherDashboard';
import ClassDetails from './components/ClassDetails';
import AdminDashboard from './components/AdminDashboard';
import StudentSelfRegistration from './components/StudentSelfRegistration';
import { supabase } from './supabaseClient';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<Teacher | Administrator | null>(null);
  const [userRole, setUserRole] = useState<'teacher' | 'admin' | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [isSelfRegistering, setIsSelfRegistering] = useState(false);
  
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [enrollments, setEnrollments] = useState<{ student_id: string, class_id: string }[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const initSession = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (mounted) {
          setSession(currentSession);
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Erro na sessão:", err);
        if (mounted) setLoading(false);
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!mounted) return;
      
      if (event === 'SIGNED_IN' && newSession?.user) {
        setSession(newSession);
        await fetchUserProfile(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setSession(null);
        setCurrentUser(null);
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    setLoading(true);
    setAuthError(null);
    try {
      // Busca em paralelo para ser mais rápido
      const [adminRes, teacherRes] = await Promise.all([
        supabase.from('administrators').select('*').eq('id', userId).maybeSingle(),
        supabase.from('teachers').select('*').eq('id', userId).maybeSingle()
      ]);

      if (adminRes.data) {
        setCurrentUser(adminRes.data);
        setUserRole('admin');
        await fetchAllData();
      } else if (teacherRes.data) {
        setCurrentUser(teacherRes.data);
        setUserRole('teacher');
        await fetchData(userId);
      } else {
        setAuthError("Perfil não encontrado. Verifique se o ID no banco coincide com o ID de autenticação.");
        console.warn("Usuário logado mas sem perfil correspondente no banco (ID):", userId);
      }
    } catch (err) {
      console.error("Erro ao buscar perfil:", err);
      setAuthError("Erro de comunicação com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  const fetchData = async (userId: string) => {
    try {
      const [classesRes, studentsRes, enrollRes, attendanceRes] = await Promise.all([
        supabase.from('classes').select('*').eq('teacher_id', userId),
        supabase.from('students').select('*'),
        supabase.from('student_classes').select('*'),
        supabase.from('attendance').select('*')
      ]);

      if (classesRes.data) setClasses(classesRes.data.map(c => ({
        id: c.id, teacherId: c.teacher_id, name: c.name, scheduleDays: c.schedule_days,
        startTime: c.start_time, endTime: c.end_time, description: c.description
      })));
      if (studentsRes.data) setStudents(studentsRes.data.map(s => ({
        id: s.id, name: s.name, active: s.active ?? true, email: s.email, phone: s.phone, photo_url: s.photo_url
      })));
      if (enrollRes.data) setEnrollments(enrollRes.data);
      if (attendanceRes.data) setAttendance(attendanceRes.data.map(a => ({
        id: a.id, studentId: a.student_id, classId: a.class_id, date: a.attendance_date, present: a.present
      })));
    } catch (err) { console.error(err); }
  };

  const fetchAllData = async () => {
    try {
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
        id: s.id, name: s.name, active: s.active ?? true, email: s.email, phone: s.phone, photo_url: s.photo_url
      })));
      if (enrollRes.data) setEnrollments(enrollRes.data);
      if (attendanceRes.data) setAttendance(attendanceRes.data.map(a => ({
        id: a.id, studentId: a.student_id, classId: a.class_id, date: a.attendance_date, present: a.present
      })));
    } catch (err) { console.error(err); }
  };

  const handleAddStudent = async (name: string, classId: string) => {
    try {
      const { data: newStudent, error: sError } = await supabase.from('students').insert([{ name }]).select().single();
      if (sError) throw sError;
      const { error: eError } = await supabase.from('student_classes').insert([{ student_id: newStudent.id, class_id: classId }]);
      if (eError) throw eError;
      if (userRole === 'admin') await fetchAllData();
      else await fetchData(currentUser!.id);
    } catch (err: any) { alert("Erro ao cadastrar aluno: " + err.message); }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Remover aluno desta turma?")) return;
    try {
      const { error } = await supabase.from('student_classes').delete().match({ student_id: studentId, class_id: activeClassId });
      if (error) throw error;
      if (userRole === 'admin') await fetchAllData();
      else await fetchData(currentUser!.id);
    } catch (err: any) { alert("Erro ao remover: " + err.message); }
  };

  const handleToggleAttendance = async (studentId: string, classId: string, date: string) => {
    try {
      const existing = attendance.find(a => a.studentId === studentId && a.classId === classId && a.date === date);
      if (existing) {
        await supabase.from('attendance').delete().eq('id', existing.id);
      } else {
        await supabase.from('attendance').insert([{
          student_id: studentId,
          class_id: classId,
          attendance_date: date,
          present: true
        }]);
      }
      if (userRole === 'admin') await fetchAllData();
      else await fetchData(currentUser!.id);
    } catch (err: any) { console.error(err); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) { 
      setAuthError(error.message === "Invalid login credentials" ? "E-mail ou senha incorretos." : error.message); 
      setLoading(false); 
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-bold text-xs uppercase tracking-widest animate-pulse">Sincronizando Studio...</p>
    </div>
  );

  if (isSelfRegistering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <StudentSelfRegistration onBack={() => {
          setIsSelfRegistering(false);
          if (userRole === 'admin') fetchAllData();
          else if (currentUser) fetchData(currentUser.id);
        }} />
      </div>
    );
  }

  if (!session || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 shadow-2xl">
          <div className="text-center mb-8">
             <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl text-white font-black text-3xl mb-4">R</div>
             <h1 className="text-2xl font-black text-slate-900 leading-tight">Ritmo Vertical</h1>
             <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Área de Membros</p>
          </div>
          
          {authError && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-xs font-bold border-l-4 border-red-500">
              {authError}
              <button onClick={handleLogout} className="block mt-2 underline text-[10px] uppercase">Tentar outro login</button>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <input name="email" type="email" required placeholder="E-mail" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
            <input name="password" type="password" required placeholder="Senha" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium" />
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-lg hover:bg-black transition-all">Acessar Painel</button>
          </form>

          <div className="relative my-8">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
             <div className="relative flex justify-center text-xs font-black uppercase tracking-widest"><span className="bg-white px-4 text-slate-400">Ou</span></div>
          </div>

          <button 
            onClick={() => setIsSelfRegistering(true)}
            className="w-full bg-indigo-50 text-indigo-700 font-black py-5 rounded-2xl border-2 border-indigo-100 hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            Quero me Matricular
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveClassId(null)}>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl">R</div>
          <div className="hidden sm:block">
            <div className="font-black text-slate-900 uppercase leading-none">Ritmo Vertical</div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{userRole === 'admin' ? 'Gestão Administrativa' : 'Painel Docente'}</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-black text-slate-900 leading-none">{currentUser.name}</div>
            <div className="text-[10px] text-indigo-500 font-bold uppercase mt-1">
                {userRole === 'admin' ? 'Diretor' : (currentUser as Teacher).modality}
            </div>
          </div>
          <button onClick={handleLogout} className="px-4 py-2 text-slate-400 hover:text-red-500 font-bold text-xs uppercase transition-colors">Sair</button>
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
                onAddStudentToClass={handleAddStudent}
                onRefresh={fetchAllData}
            />
          ) : (
            <ClassDetails
                activeClass={classes.find(c => c.id === activeClassId)!}
                students={students.filter(s => enrollments.some(e => e.student_id === s.id && e.class_id === activeClassId))}
                attendance={attendance}
                onBack={() => setActiveClassId(null)}
                onAddStudent={handleAddStudent} 
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
                onAddStudent={handleAddStudent}
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
