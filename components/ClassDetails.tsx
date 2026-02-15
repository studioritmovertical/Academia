
import React, { useState, useMemo } from 'react';
import { Class, Student, AttendanceRecord } from '../types';

interface ClassDetailsProps {
  activeClass: Class;
  students: Student[];
  attendance: AttendanceRecord[];
  onBack: () => void;
  onAddStudent: (name: string, classId: string) => void;
  onDeleteStudent: (id: string) => void;
  onToggleAttendance: (studentId: string, classId: string, date: string) => void;
}

const ClassDetails: React.FC<ClassDetailsProps> = ({
  activeClass, students, attendance, onBack, onAddStudent, onDeleteStudent, onToggleAttendance
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [view, setView] = useState<'attendance' | 'students'>('attendance');
  const [newName, setNewName] = useState('');

  const attendanceStats = useMemo(() => {
    const presentCount = students.filter(s => 
      attendance.some(a => a.studentId === s.id && a.classId === activeClass.id && a.date === date)
    ).length;
    return {
      total: students.length,
      present: presentCount,
      percentage: students.length > 0 ? Math.round((presentCount / students.length) * 100) : 0
    };
  }, [students, attendance, activeClass.id, date]);

  return (
    <div className="animate-fade-in space-y-8">
      <button 
        onClick={onBack} 
        className="group text-slate-400 hover:text-indigo-600 flex items-center gap-3 font-bold transition-all mb-4 px-2"
      >
        <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        Voltar
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Header Turma */}
        <div className="p-10 bg-gradient-to-r from-slate-50 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-lg uppercase tracking-widest">Ativa</span>
              <span className="text-xs text-slate-400 font-bold">{activeClass.description}</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">{activeClass.name}</h1>
            <div className="flex items-center gap-3">
               <div className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-2xl font-bold text-sm shadow-sm shadow-indigo-50">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 {activeClass.startTime.substring(0,5)} — {activeClass.endTime.substring(0,5)}
               </div>
            </div>
          </div>
          
          <div className="bg-slate-100 p-1.5 rounded-2xl flex shadow-inner">
            <button 
              onClick={() => setView('attendance')} 
              className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${view === 'attendance' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Frequência
            </button>
            <button 
              onClick={() => setView('students')} 
              className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${view === 'students' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Alunos
            </button>
          </div>
        </div>

        <div className="p-10">
          {view === 'attendance' ? (
            <div className="space-y-10">
              {/* Controles de Chamada */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="w-full lg:w-auto">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Data da Chamada</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={date} 
                      onChange={e => setDate(e.target.value)} 
                      className="w-full border-2 border-slate-200 p-4 rounded-2xl text-base font-black outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white transition-all appearance-none" 
                    />
                    <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 w-full lg:w-auto">
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center flex-1">
                    <div className="text-3xl font-black text-slate-900">{attendanceStats.total}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center flex-1">
                    <div className="text-3xl font-black text-green-600">{attendanceStats.present}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Presentes</div>
                  </div>
                  <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-100 text-center flex-1 col-span-2 sm:col-span-1">
                    <div className="text-3xl font-black text-white">{attendanceStats.percentage}%</div>
                    <div className="text-[10px] text-indigo-200 font-bold uppercase tracking-wider">Frequência</div>
                  </div>
                </div>
              </div>

              {/* Lista de Presença */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.length === 0 ? (
                  <div className="col-span-full py-20 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                    <div className="text-slate-400 font-bold text-lg mb-2">Turma sem alunos matriculados</div>
                    <button onClick={() => setView('students')} className="text-indigo-600 font-black underline underline-offset-4">Ir para gestão de alunos</button>
                  </div>
                ) : (
                  students.map(s => {
                    const present = attendance.some(a => a.studentId === s.id && a.classId === activeClass.id && a.date === date);
                    return (
                      <button 
                        key={s.id} 
                        onClick={() => onToggleAttendance(s.id, activeClass.id, date)}
                        className={`flex justify-between items-center p-6 border-2 rounded-3xl transition-all group active:scale-[0.97] ${
                          present 
                          ? 'bg-green-50 border-green-200 shadow-md shadow-green-100' 
                          : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                        }`}
                      >
                        <div className="text-left">
                           <div className={`font-black text-xl transition-colors ${present ? 'text-green-800' : 'text-slate-800'}`}>
                             {s.name}
                           </div>
                           <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${present ? 'text-green-600' : 'text-slate-400'}`}>
                             {present ? 'Confirmado' : 'Aguardando'}
                           </div>
                        </div>
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-inner ${
                          present 
                          ? 'bg-green-500 text-white scale-110 rotate-0' 
                          : 'bg-slate-100 text-slate-300 group-hover:bg-slate-200'
                        }`}>
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="bg-indigo-600 p-10 rounded-[2.5rem] shadow-2xl shadow-indigo-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
                   <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 14a7 7 0 100-14 7 7 0 000 14zM12 16c-7 0-9 4-9 4v2h18v-2s-2-4-9-4z"/></svg>
                </div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-white mb-6">Nova Matrícula</h3>
                  <form onSubmit={e => { e.preventDefault(); if(newName) { onAddStudent(newName, activeClass.id); setNewName(''); } }} className="flex flex-col sm:flex-row gap-4">
                    <input 
                      value={newName} 
                      onChange={e => setNewName(e.target.value)} 
                      placeholder="Nome completo do aluno" 
                      className="flex-1 border-0 p-5 rounded-2xl shadow-xl outline-none focus:ring-4 focus:ring-white/30 text-slate-900 font-bold" 
                    />
                    <button type="submit" className="bg-white text-indigo-700 font-black px-10 py-5 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-xl">
                      Matricular Aluno
                    </button>
                  </form>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Alunos Matriculados ({students.length})</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {students.map(s => (
                    <div key={s.id} className="bg-white border border-slate-100 p-6 rounded-3xl flex justify-between items-center group hover:border-red-100 hover:shadow-lg transition-all">
                      <div>
                        <span className="font-black text-slate-900 text-lg block">{s.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Ativo</span>
                      </div>
                      <button 
                        onClick={() => onDeleteStudent(s.id)} 
                        className="w-12 h-12 flex items-center justify-center text-slate-300 hover:text-white bg-slate-50 hover:bg-red-500 rounded-2xl transition-all shadow-sm"
                        title="Remover matrícula"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  {students.length === 0 && (
                    <div className="col-span-full py-10 text-center text-slate-400 font-medium italic">
                      Nenhum aluno cadastrado para esta turma.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;
