
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
  const [view, setView] = useState<'attendance' | 'students' | 'carometro'>('attendance');
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
        Painel Principal
      </button>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Header Turma */}
        <div className="p-8 md:p-10 bg-gradient-to-r from-slate-50 to-white flex flex-col md:flex-row justify-between items-start md:items-center gap-8 border-b border-slate-50">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-lg uppercase tracking-widest">Turma Selecionada</span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none mb-4">{activeClass.name}</h1>
            <div className="flex items-center gap-3 bg-white border border-slate-100 w-fit px-4 py-2 rounded-2xl shadow-sm">
               <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
               <div className="text-sm font-black text-slate-600 tracking-tight uppercase">
                 {activeClass.startTime.substring(0,5)} — {activeClass.endTime.substring(0,5)}
               </div>
            </div>
          </div>
          
          <div className="bg-slate-100 p-1.5 rounded-2xl flex shadow-inner w-full md:w-auto">
            <button 
              onClick={() => setView('attendance')} 
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all ${view === 'attendance' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Chamada
            </button>
            <button 
              onClick={() => setView('carometro')} 
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all ${view === 'carometro' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Carômetro
            </button>
            <button 
              onClick={() => setView('students')} 
              className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-black transition-all ${view === 'students' ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Lista
            </button>
          </div>
        </div>

        <div className="p-8 md:p-10">
          {view === 'attendance' ? (
            <div className="space-y-10">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                <div className="w-full lg:w-auto">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-1">Selecione a Data</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border-2 border-slate-200 p-4 rounded-2xl text-base font-black outline-none bg-white" />
                </div>
                <div className="flex gap-4 w-full lg:w-auto overflow-x-auto pb-2">
                   <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[100px]">
                      <div className="text-2xl font-black text-slate-900">{attendanceStats.total}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase">Total</div>
                   </div>
                   <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-center min-w-[100px]">
                      <div className="text-2xl font-black text-green-600">{attendanceStats.present}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase">Presentes</div>
                   </div>
                   <div className="bg-indigo-600 p-4 rounded-2xl shadow-xl shadow-indigo-100 text-center min-w-[120px] text-white">
                      <div className="text-2xl font-black">{attendanceStats.percentage}%</div>
                      <div className="text-[10px] font-black uppercase opacity-80">Taxa</div>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map(s => {
                  const present = attendance.some(a => a.studentId === s.id && a.classId === activeClass.id && a.date === date);
                  return (
                    <button 
                      key={s.id} 
                      onClick={() => onToggleAttendance(s.id, activeClass.id, date)}
                      className={`flex justify-between items-center p-4 border-2 rounded-[2rem] transition-all active:scale-[0.98] ${present ? 'bg-green-50 border-green-200' : 'bg-white border-slate-100'}`}
                    >
                      <div className="flex items-center gap-4">
                         <div className="w-14 h-14 bg-slate-100 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                            {s.photo_url ? <img src={s.photo_url} className="w-full h-full object-cover" alt={s.name} /> : <div className="w-full h-full flex items-center justify-center text-slate-300 font-black text-xs">S/F</div>}
                         </div>
                         <div className="text-left">
                            <div className={`font-black text-lg ${present ? 'text-green-900' : 'text-slate-800'}`}>{s.name}</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase">{present ? '✓ Presença Confirmada' : 'Aguardando Chamada'}</div>
                         </div>
                      </div>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${present ? 'bg-green-500 text-white' : 'bg-slate-50 text-slate-200'}`}>
                         <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth="4" /></svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : view === 'carometro' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 animate-fade-in">
               {students.map(s => (
                 <div key={s.id} className="group relative aspect-[3/4] bg-slate-50 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-sm hover:shadow-xl transition-all hover:-translate-y-2">
                    {s.photo_url ? (
                      <img src={s.photo_url} className="w-full h-full object-cover" alt={s.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300 font-black italic p-4 text-center">Sem Foto Cadastrada</div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent p-6 pt-12">
                       <div className="text-white font-black text-sm leading-tight mb-1">{s.name}</div>
                       <div className="text-[9px] text-white/60 font-black uppercase tracking-widest">{s.phone || 'S/ Tel'}</div>
                    </div>
                 </div>
               ))}
               {students.length === 0 && <div className="col-span-full py-20 text-center font-bold text-slate-300 italic">Nenhum aluno matriculado para exibir no carômetro.</div>}
            </div>
          ) : (
            <div className="space-y-10 animate-fade-in">
              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row justify-between items-center gap-6">
                 <div>
                   <h3 className="text-xl font-black">Adicionar Aluno Manualmente</h3>
                   <p className="text-white/40 text-xs font-bold uppercase mt-1">Uso administrativo interno</p>
                 </div>
                 <form onSubmit={e => { e.preventDefault(); if(newName) { onAddStudent(newName, activeClass.id); setNewName(''); } }} className="flex gap-2 w-full md:w-auto">
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Nome Completo" className="flex-1 p-4 bg-white/10 rounded-xl outline-none focus:bg-white focus:text-slate-900 font-bold transition-all" />
                    <button type="submit" className="bg-indigo-600 px-6 py-4 rounded-xl font-black hover:bg-indigo-700 transition-all">Matricular</button>
                 </form>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {students.map(s => (
                  <div key={s.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-50 rounded-xl overflow-hidden">
                        {s.photo_url && <img src={s.photo_url} className="w-full h-full object-cover" alt={s.name} />}
                      </div>
                      <div>
                        <div className="font-black text-slate-900">{s.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">{s.email || 'Email não informado'}</div>
                      </div>
                    </div>
                    <button onClick={() => onDeleteStudent(s.id)} className="w-10 h-10 bg-red-50 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;
