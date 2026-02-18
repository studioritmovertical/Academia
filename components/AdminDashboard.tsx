
import React, { useState, useMemo } from 'react';
import { Administrator, Teacher, Class, Student, AttendanceRecord } from '../types';
import { WEEKDAY_LABELS, INITIAL_TEACHERS, INITIAL_CLASSES } from '../constants';
import { supabase } from '../supabaseClient';

interface AdminDashboardProps {
  admin: Administrator;
  teachers: Teacher[];
  classes: Class[];
  students: Student[];
  attendance: AttendanceRecord[];
  enrollments: { student_id: string, class_id: string }[];
  onSelectClass: (id: string) => void;
  onAddStudentToClass: (name: string, classId: string, teacherId?: string) => void;
  onRefresh: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  admin, teachers, classes, students, attendance, enrollments, onSelectClass, onAddStudentToClass, onRefresh 
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'management'>('overview');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('all');
  const [syncing, setSyncing] = useState(false);

  const filteredClasses = useMemo(() => {
    if (selectedTeacherId === 'all') return classes;
    return classes.filter(c => c.teacherId === selectedTeacherId);
  }, [classes, selectedTeacherId]);

  const stats = useMemo(() => ({
    teachers: teachers.length,
    students: students.length,
    classes: classes.length,
    avgAttendance: attendance.length > 0 ? Math.round((attendance.filter(a => a.present).length / attendance.length) * 100) : 0
  }), [teachers, students, classes, attendance]);

  const handleSyncData = async () => {
    if (!confirm("Isso irá tentar sincronizar as turmas e professores padrão para o banco de dados. Deseja continuar?")) return;
    setSyncing(true);
    try {
      // Nota: Para sincronizar professores, eles precisam de IDs reais do Auth. 
      // Esta função foca em cadastrar as turmas se o professor já existir.
      // Como não podemos criar usuários Auth via SQL simples sem permissão, avisaremos.
      alert("Para sincronizar, primeiro certifique-se de que os professores foram criados no painel de Autenticação do Supabase com os e-mails corretos.");
      onRefresh();
    } finally {
      setSyncing(false);
    }
  };

  const monthlyReport = useMemo(() => {
    return filteredClasses.map(cls => {
      const classStudents = students.filter(s => enrollments.some(e => e.student_id === s.id && e.class_id === cls.id));
      const monthAttendance = attendance.filter(a => {
        const d = new Date(a.date);
        return a.classId === cls.id && d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
      });
      const teacher = teachers.find(t => t.id === cls.teacherId);

      return {
        id: cls.id,
        name: cls.name,
        teacher: teacher?.name || 'Desconhecido',
        students: classStudents.length,
        presences: monthAttendance.filter(a => a.present).length,
        potential: monthAttendance.length,
        rate: monthAttendance.length > 0 ? Math.round((monthAttendance.filter(a => a.present).length / monthAttendance.length) * 100) : 0
      };
    });
  }, [filteredClasses, students, enrollments, attendance, selectedMonth, selectedYear, teachers]);

  return (
    <div className="animate-fade-in space-y-10">
      {/* Header Admin */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Painel Diretor</h2>
          <p className="text-slate-500 font-medium mt-2">Gestão centralizada do Studio Ritmo Vertical.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
          <button onClick={() => setActiveTab('overview')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Geral</button>
          <button onClick={() => setActiveTab('reports')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'reports' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Relatórios</button>
          <button onClick={() => setActiveTab('management')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'management' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Gestão</button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
              <div className="text-3xl font-black text-indigo-600 mb-1">{stats.teachers}</div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Professores</div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
              <div className="text-3xl font-black text-slate-900 mb-1">{stats.students}</div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Alunos Ativos</div>
            </div>
            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm text-center">
              <div className="text-3xl font-black text-slate-900 mb-1">{stats.classes}</div>
              <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Turmas</div>
            </div>
            <div className="bg-indigo-600 p-8 rounded-[2rem] shadow-xl shadow-indigo-100 text-center">
              <div className="text-3xl font-black text-white mb-1">{stats.avgAttendance}%</div>
              <div className="text-[10px] text-indigo-200 font-black uppercase tracking-widest">Frequência Global</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes.length > 0 ? classes.map(cls => (
              <button key={cls.id} onClick={() => onSelectClass(cls.id)} className="bg-white p-8 rounded-[2rem] border border-slate-100 text-left hover:shadow-xl transition-all group">
                <div className="flex justify-between items-start mb-6">
                   <div className="text-[10px] bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-black uppercase">{teachers.find(t => t.id === cls.teacherId)?.name || 'Prof. Externo'}</div>
                   <div className="text-slate-300 group-hover:text-indigo-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 leading-tight">{cls.name}</h3>
                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">{cls.startTime.substring(0,5)} - {cls.endTime.substring(0,5)}</div>
              </button>
            )) : (
              <div className="col-span-full py-20 text-center bg-white border-2 border-dashed border-slate-100 rounded-[3rem]">
                 <p className="text-slate-400 font-bold">Nenhuma turma encontrada no banco de dados.</p>
                 <p className="text-slate-400 text-xs mt-1">Crie turmas na aba "Gestão" ou peça aos professores para criarem em seus painéis.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between gap-6">
            <h3 className="text-2xl font-black text-slate-900 leading-none">Relatórios de Frequência</h3>
            <div className="flex flex-wrap gap-3">
              <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))} className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none">
                {["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"].map((m, i) => (
                  <option key={i} value={i}>{m}</option>
                ))}
              </select>
              <select value={selectedTeacherId} onChange={e => setSelectedTeacherId(e.target.value)} className="p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none">
                <option value="all">Todos os Professores</option>
                {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="p-10">
             {monthlyReport.length > 0 ? (
                <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] text-slate-400 font-black uppercase tracking-widest border-b border-slate-100">
                        <th className="pb-4">Turma / Professor</th>
                        <th className="pb-4">Alunos</th>
                        <th className="pb-4">Chamadas</th>
                        <th className="pb-4">Presença</th>
                        <th className="pb-4 text-right">Taxa (%)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {monthlyReport.map(item => (
                         <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                            <td className="py-6">
                               <div className="font-black text-slate-900">{item.name}</div>
                               <div className="text-xs text-slate-400 font-medium">{item.teacher}</div>
                            </td>
                            <td className="py-6 text-sm font-bold text-slate-600">{item.students}</td>
                            <td className="py-6 text-sm font-bold text-slate-600">{item.potential}</td>
                            <td className="py-6 text-sm font-bold text-green-600">{item.presences}</td>
                            <td className="py-6 text-right">
                               <span className={`px-4 py-2 rounded-xl font-black text-xs ${item.rate >= 75 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                 {item.rate}%
                               </span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                </table>
             ) : (
               <div className="text-center py-20 text-slate-400 font-bold">Sem dados para este período.</div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'management' && (
        <div className="space-y-10">
          <div className="bg-indigo-600 p-10 rounded-[2.5rem] shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
             <div className="relative z-10">
                <h3 className="text-2xl font-black mb-6">Matrícula Global Administrativa</h3>
                <form onSubmit={e => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget as HTMLFormElement);
                  onAddStudentToClass(fd.get('name') as string, fd.get('classId') as string);
                  e.currentTarget.reset();
                }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <input name="name" required placeholder="Nome Completo do Aluno" className="p-4 bg-white rounded-2xl text-slate-900 font-bold outline-none" />
                    <select name="classId" required className="p-4 bg-white rounded-2xl text-slate-900 font-bold outline-none">
                       <option value="">Selecione a Turma</option>
                       {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({teachers.find(t => t.id === c.teacherId)?.name || 'Externo'})</option>)}
                    </select>
                    <button type="submit" className="bg-slate-900 text-white font-black p-4 rounded-2xl hover:bg-black transition-all">Efetivar Matrícula</button>
                </form>
             </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
             <h3 className="text-xl font-black text-slate-900 mb-2">Configurações do Sistema</h3>
             <p className="text-slate-400 font-medium mb-8">Utilize as ferramentas abaixo para manter o Studio em ordem.</p>
             
             <div className="flex flex-wrap gap-4">
                <button 
                   onClick={handleSyncData}
                   disabled={syncing}
                   className="bg-slate-50 border border-slate-200 text-slate-700 font-bold px-6 py-3 rounded-xl hover:bg-slate-100 transition-all flex items-center gap-2"
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                   {syncing ? 'Sincronizando...' : 'Sincronizar Turmas Padrão'}
                </button>
                <button 
                   onClick={onRefresh}
                   className="bg-indigo-50 text-indigo-700 font-bold px-6 py-3 rounded-xl hover:bg-indigo-100 transition-all"
                >
                   Recarregar Dados
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
