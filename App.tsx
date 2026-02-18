
import React, { useState, useEffect, useRef } from 'react';
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
  const [errorStatus, setErrorStatus] = useState<{message: string, debug?: string} | null>(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const initSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (isMounted.current) {
          const currentSession = data.session;
          setSession(currentSession);
          if (currentSession?.user) {
            await fetchUserProfile(currentSession.user.id);
          } else {
            setLoading(false);
          }
        }
      } catch (err: any) {
        console.error("Erro na inicialização:", err);
        if (isMounted.current) {
          setLoading(false);
          setErrorStatus({
            message: "Erro de conexão com o banco de dados.",
            debug: err.message
          });
        }
      }
    };

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted.current) return;
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && newSession?.user) {
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
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    if (!isMounted.current) return;
    setLoading(true);
    try {
      const { data: adminData } = await supabase.from('administrators').select('*').eq('id', userId).maybeSingle();
      
      if (adminData) {
        setCurrentUser(adminData);
        setUserRole('admin');
        await fetchAllData();
      } else {
        const { data: teacherData } = await supabase.from('teachers').select('*').eq('id', userId).maybeSingle();
        if (teacherData) {
          setCurrentUser(teacherData);
          setUserRole('teacher');
          await fetchData(userId);
        } else {
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar perfil:", err);
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
        id: c.id, teacherId: c.teacher_id, name: c.name, scheduleDays: c.schedule_days || [],
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
    finally { setLoading(false); }
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
        id: c.id, teacherId: c.teacher_id, name: c.name, scheduleDays: c.schedule_days || [],
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
    finally { setLoading(false); }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorStatus(null);
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const email = fd.get('email') as string;
    const password = fd.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) { 
      setErrorStatus({ message: "Login falhou. Verifique e-mail e senha.", debug: error.message }); 
      setLoading(false); 
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      // Redireciona para a origem (limpa a URL de qualquer caminho residual)
      window.location.href = window.location.origin;
    } catch (err) {
      console.error("Erro ao sair:", err);
      window.location.reload();
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white p-6">
      <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6"></div>
      <p className="font-black text-xs uppercase tracking-[0.3em] animate-pulse">Ritmo Vertical</p>
      <p className="mt-2 text-[10px] text-slate-500 font-bold uppercase">Iniciando sistema...</p>
    </div>
  );

  if (isSelfRegistering) {
    return <StudentSelfRegistration onBack={() => setIsSelfRegistering(false)} />;
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
          
          {errorStatus && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-xl text-[11px] font-bold border-l-4 border-red-500">
              {errorStatus.message}
              {errorStatus.debug && <p className="text-[9px] opacity-60 mt-1 font-mono break-all">{errorStatus.debug}</p>}
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

          <button onClick={() => setIsSelfRegistering(true)} className="w-full bg-indigo-50 text-indigo-700 font-black py-5 rounded-2xl border-2 border-indigo-100 hover:bg-indigo-100 transition-all">
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
        <button onClick={handleLogout} className="px-4 py-2 text-slate-400 hover:text-red-500 font-bold text-xs uppercase transition-colors">Sair</button>
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
                onAddStudentToClass={async (name, cid) => {
                  const { data } = await supabase.from('students').insert([{ name }]).select().single();
                  if (data) await supabase.from('student_classes').insert([{ student_id: data.id, class_id: cid }]);
                  fetchAllData();
                }}
                onRefresh={fetchAllData}
            />
          ) : (
            <ClassDetails
                activeClass={classes.find(c => c.id === activeClassId)!}
                students={students.filter(s => enrollments.some(e => e.student_id === s.id && e.class_id === activeClassId))}
                attendance={attendance}
                onBack={() => setActiveClassId(null)}
                onAddStudent={async (name, cid) => {
                   await supabase.from('students').insert([{ name }]);
                   fetchAllData();
                }} 
                onDeleteStudent={async (id) => {
                   await supabase.from('student_classes').delete().match({ student_id: id, class_id: activeClassId });
                   fetchAllData();
                }}
                onToggleAttendance={async (sid, cid, d) => {
                  const existing = attendance.find(a => a.studentId === sid && a.classId === cid && a.date === d);
                  if (existing) await supabase.from('attendance').delete().eq('id', existing.id);
                  else await supabase.from('attendance').insert([{ student_id: sid, class_id: cid, attendance_date: d, present: true }]);
                  fetchAllData();
                }}
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
                onAddStudent={async (name, cid) => {
                   const { data } = await supabase.from('students').insert([{ name }]).select().single();
                   if (data) await supabase.from('student_classes').insert([{ student_id: data.id, class_id: cid }]);
                   fetchData(currentUser!.id);
                }}
                onDeleteStudent={async (id) => {
                   await supabase.from('student_classes').delete().match({ student_id: id, class_id: activeClassId });
                   fetchData(currentUser!.id);
                }}
                onToggleAttendance={async (sid, cid, d) => {
                   const existing = attendance.find(a => a.studentId === sid && a.classId === cid && a.date === d);
                   if (existing) await supabase.from('attendance').delete().eq('id', existing.id);
                   else await supabase.from('attendance').insert([{ student_id: sid, class_id: cid, attendance_date: d, present: true }]);
                   fetchData(currentUser!.id);
                }}
            />
          )
        )}
      </main>
    </div>
  );
};

export default App;
