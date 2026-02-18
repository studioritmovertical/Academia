
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Teacher, Class } from '../types';
import { WEEKDAY_LABELS } from '../constants';
import { supabase } from '../supabaseClient';

interface StudentSelfRegistrationProps {
  onBack: () => void;
}

const StudentSelfRegistration: React.FC<StudentSelfRegistrationProps> = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form states
  const [selectedModality, setSelectedModality] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [studentData, setStudentData] = useState({
    name: '',
    email: '',
    phone: '',
    photo: ''
  });

  // Camera refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [tRes, cRes] = await Promise.all([
          supabase.from('teachers').select('*'),
          supabase.from('classes').select('*')
        ]);
        
        if (tRes.data) setTeachers(tRes.data);
        if (cRes.data) setClasses(cRes.data.map(c => ({
          id: c.id, 
          teacherId: c.teacher_id, 
          name: c.name, 
          scheduleDays: c.schedule_days,
          startTime: c.start_time, 
          endTime: c.end_time, 
          description: c.description
        })));
      } catch (err) {
        console.error("Erro ao carregar dados iniciais:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      alert("Não foi possível acessar a câmera. Verifique as permissões de vídeo.");
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6); 
        setStudentData(prev => ({ ...prev, photo: dataUrl }));
        
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        setCameraActive(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentData.name || !selectedClassId) {
      alert("Preencha o nome e selecione uma turma.");
      return;
    }
    
    setSubmitting(true);
    try {
      const { data: newStudent, error: sError } = await supabase
        .from('students')
        .insert([{ 
          name: studentData.name, 
          email: studentData.email || null, 
          phone: studentData.phone || null,
          photo_url: studentData.photo || null,
          active: true
        }])
        .select()
        .single();

      if (sError) throw sError;

      const { error: eError } = await supabase
        .from('student_classes')
        .insert([{ 
          student_id: newStudent.id, 
          class_id: selectedClassId 
        }]);

      if (eError) throw eError;

      setSuccess(true);
    } catch (err: any) {
      console.error("Falha na matrícula:", err);
      alert("Erro ao salvar: " + (err.message || "Tente novamente mais tarde."));
    } finally {
      setSubmitting(false);
    }
  };

  const modalities = useMemo(() => Array.from(new Set(teachers.map(t => t.modality))), [teachers]);
  
  const filteredClasses = useMemo(() => {
    // Identifica os IDs dos professores que dão a modalidade selecionada
    const teacherIdsForModality = teachers
      .filter(t => t.modality === selectedModality)
      .map(t => t.id);
    
    // Retorna apenas as turmas que pertencem a esses professores
    return classes.filter(c => teacherIdsForModality.includes(c.teacherId));
  }, [selectedModality, teachers, classes]);

  if (loading) return (
    <div className="bg-white p-20 rounded-[3rem] shadow-2xl flex flex-col items-center">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="mt-4 font-black text-slate-400 uppercase tracking-widest text-xs">Conectando...</p>
    </div>
  );

  if (success) return (
    <div className="bg-white p-12 rounded-[3rem] shadow-2xl text-center max-w-lg w-full animate-fade-in">
      <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" d="M5 13l4 4L19 7" /></svg>
      </div>
      <h2 className="text-3xl font-black text-slate-900 mb-2">Matrícula Realizada!</h2>
      <p className="text-slate-500 font-medium mb-10 leading-relaxed">Você foi cadastrado(a) na turma de <b>{selectedModality}</b>.</p>
      <button onClick={onBack} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all">Sair</button>
    </div>
  );

  return (
    <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-2xl animate-fade-in max-w-2xl w-full min-h-[550px] flex flex-col relative overflow-hidden">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Cadastro de Aluno</h2>
          <div className="flex gap-1 mt-1">
             {[1,2,3,4].map(i => <div key={i} className={`h-1 w-8 rounded-full ${step >= i ? 'bg-indigo-600' : 'bg-slate-100'}`} />)}
          </div>
        </div>
        <button onClick={onBack} className="text-slate-400 hover:text-red-500 font-black text-[10px] uppercase">Fechar</button>
      </div>

      <div className="flex-1">
        {step === 1 && (
          <div className="space-y-6 animate-fade-in">
            <h3 className="text-lg font-black text-slate-800">Selecione o que deseja praticar:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {modalities.length > 0 ? modalities.map(m => (
                <button key={m} onClick={() => { setSelectedModality(m); setStep(2); }} className="p-6 border-2 border-slate-50 rounded-2xl text-left hover:border-indigo-600 hover:bg-indigo-50 transition-all font-black text-slate-900 uppercase tracking-tight">{m}</button>
              )) : (
                <p className="text-slate-400 col-span-full py-10 text-center font-bold">Nenhuma modalidade encontrada no sistema.</p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-fade-in">
            <button onClick={() => setStep(1)} className="text-xs font-black text-indigo-600 uppercase">← Voltar</button>
            <h3 className="text-lg font-black text-slate-800">Escolha a turma e horário:</h3>
            <div className="space-y-3">
              {filteredClasses.length > 0 ? filteredClasses.map(c => (
                <button key={c.id} onClick={() => { setSelectedClassId(c.id); setStep(3); }} className="w-full p-6 border-2 border-slate-50 rounded-2xl text-left hover:border-indigo-600 flex justify-between items-center group">
                  <div>
                    <div className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{c.name}</div>
                    <div className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">
                       {c.scheduleDays && c.scheduleDays.map(d => WEEKDAY_LABELS[d]).join(' / ')} • {c.startTime.substring(0,5)}
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">→</div>
                </button>
              )) : (
                <div className="py-10 text-center">
                  <p className="text-slate-400 font-bold mb-4">Nenhum horário disponível para {selectedModality}.</p>
                  <button onClick={() => setStep(1)} className="text-indigo-600 font-black uppercase text-xs">Voltar e escolher outra</button>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-fade-in">
            <button onClick={() => setStep(2)} className="text-xs font-black text-indigo-600 uppercase">← Voltar</button>
            <h3 className="text-lg font-black text-slate-800">Seus dados de contato:</h3>
            <div className="space-y-4">
              <input value={studentData.name} onChange={e => setStudentData({...studentData, name: e.target.value})} placeholder="Nome Completo *" className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold" />
              <input value={studentData.email} onChange={e => setStudentData({...studentData, email: e.target.value})} type="email" placeholder="E-mail" className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold" />
              <input value={studentData.phone} onChange={e => setStudentData({...studentData, phone: e.target.value})} placeholder="Telefone / WhatsApp" className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold" />
            </div>
            <button 
              disabled={!studentData.name}
              onClick={() => setStep(4)} 
              className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 mt-4 disabled:opacity-50"
            >
              Próximo: Foto
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-fade-in">
            <button onClick={() => setStep(3)} className="text-xs font-black text-indigo-600 uppercase">← Voltar</button>
            <h3 className="text-lg font-black text-slate-800 text-center">Foto para o Carômetro:</h3>
            
            <div className="aspect-square w-full max-w-[260px] mx-auto bg-slate-100 rounded-[2rem] overflow-hidden relative border-4 border-white shadow-inner flex items-center justify-center">
               {studentData.photo ? (
                 <img src={studentData.photo} className="w-full h-full object-cover" alt="Sua foto" />
               ) : (
                 <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${!cameraActive ? 'hidden' : ''}`} />
               )}
               <canvas ref={canvasRef} className="hidden" />
               {!cameraActive && !studentData.photo && <p className="text-[10px] font-black uppercase text-slate-300">Câmera desligada</p>}
            </div>

            <div className="space-y-3">
              {!studentData.photo ? (
                 !cameraActive ? (
                   <button onClick={startCamera} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black flex items-center justify-center gap-2">
                     Ativar Câmera
                   </button>
                 ) : (
                   <button onClick={takePhoto} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black">Capturar Foto</button>
                 )
              ) : (
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={handleSubmit} 
                    disabled={submitting} 
                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 disabled:opacity-50"
                  >
                    {submitting ? 'Salvando...' : 'Finalizar Matrícula'}
                  </button>
                  <button onClick={() => { setStudentData({...studentData, photo: ''}); startCamera(); }} className="w-full py-3 bg-slate-100 text-slate-500 rounded-xl font-bold text-sm">Tirar outra foto</button>
                </div>
              )}
            </div>
            <p className="text-center text-[9px] text-slate-400 font-black uppercase tracking-widest">Sua foto ajuda o professor a identificar você na chamada.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSelfRegistration;
