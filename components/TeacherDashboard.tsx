
import React from 'react';
import { Teacher, Class } from '../types';
import { WEEKDAY_LABELS } from '../constants';
import { supabase } from '../supabaseClient';

interface TeacherDashboardProps {
  teacher: Teacher;
  classes: Class[];
  onSelectClass: (id: string) => void;
  onAddClass: (classData: any) => void;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ teacher, classes, onSelectClass, onAddClass }) => {
  
  const createQuickClass = async () => {
    const name = prompt("Nome da Turma (Ex: Turma 01 - Iniciantes):");
    if (!name) return;
    
    const startTime = prompt("Horário de Início (HH:MM):", "18:00");
    const endTime = prompt("Horário de Término (HH:MM):", "19:00");
    
    onAddClass({
      teacher_id: teacher.id,
      name,
      schedule_days: [1, 3], 
      start_time: (startTime || "18:00") + ":00",
      end_time: (endTime || "19:00") + ":00",
      description: 'Nova turma cadastrada via painel'
    });
  };

  return (
    <div className="animate-fade-in space-y-10">
      {/* Header & Stats Section */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Olá, Prof. {teacher.name.split(' ')[0]}! 👋</h2>
          <p className="text-slate-500 font-medium">Você tem <span className="text-indigo-600 font-bold">{classes.length} turmas</span> sob sua gestão no {teacher.modality}.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100 flex-1 md:flex-none">
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Status</div>
            <div className="flex items-center gap-2 text-green-600 font-bold text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Conectado
            </div>
          </div>
          <button 
            onClick={createQuickClass}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 active:scale-95 flex-1 md:flex-none"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Nova Turma
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {classes.length === 0 ? (
          <div className="col-span-full py-24 text-center bg-white border-2 border-dashed border-slate-200 rounded-[3rem] shadow-inner">
            <div className="mb-6 inline-flex p-6 bg-indigo-50 text-indigo-400 rounded-[2rem]">
               <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2">Sua lista está vazia</h3>
            <p className="text-slate-400 max-w-sm mx-auto mb-10 font-medium leading-relaxed">Clique no botão abaixo ou no topo para cadastrar as turmas que você ministra no Studio.</p>
            <button 
              onClick={createQuickClass}
              className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors"
            >
              Começar Agora
            </button>
          </div>
        ) : (
          classes.map((cls) => (
            <button
              key={cls.id}
              onClick={() => onSelectClass(cls.id)}
              className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:border-indigo-100 hover:-translate-y-1 transition-all text-left group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                <div className="w-10 h-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {cls.scheduleDays.map(day => (
                  <span key={day} className="text-[10px] px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl font-black uppercase tracking-[0.1em]">
                    {WEEKDAY_LABELS[day]}
                  </span>
                ))}
              </div>
              
              <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-indigo-600 transition-colors leading-tight">{cls.name}</h3>
              <p className="text-slate-400 mb-10 font-medium line-clamp-2 text-sm leading-relaxed">{cls.description}</p>
              
              <div className="flex items-center justify-between border-t border-slate-50 pt-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-indigo-50 group-hover:text-indigo-500 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-sm font-black text-slate-800 tracking-tight">
                    {cls.startTime.substring(0, 5)} - {cls.endTime.substring(0, 5)}
                  </div>
                </div>
                <div className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">Ativa</div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
