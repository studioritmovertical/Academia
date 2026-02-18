
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
          scheduleDays: c.schedule_days || [],
          startTime: c.start_time, 
          endTime: c.end_time, 
          description: c.description
        })));
      } catch (err) {
        console.error("Erro ao carregar turmas:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const modalities = useMemo(() => Array.from(new Set(teachers.map(t => t.modality))), [teachers]);
  
  const filteredClasses = useMemo(() => {
    const teacherIds = teachers.filter(t => t.modality === selectedModality).map(t => t.id);
    return classes.filter(c => teacherIds.includes(c.teacherId));
  }, [selectedModality, teachers, classes]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      alert("Câmera bloqueada ou indisponível.");
    }
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
      setStudentData(prev => ({ ...prev, photo: canvas.toDataURL('image/jpeg', 0.6) }));
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
      setCameraActive(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: s, error: se } = await supabase.from('students').insert([{
        name: studentData.name,
        email: studentData.email || null,
        phone: studentData.phone || null,
        photo_url: studentData.photo || null,
        active: true
      }]).select().single();
      if (se) throw se;
      await supabase.from('student_classes').insert([{ student_id: s.id, class_id: selectedClassId }]);
      setSuccess(true);
    } catch (e: any) {
      alert("Erro ao salvar: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="text-white font-black animate-pulse">Carregando Turmas...</div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6">
       <div className="bg-white p-12 rounded-[3rem] text-center max-w-sm w-full">
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">✓</div>
          <h2 className="text-2xl font-black mb-2">Matrícula Confirmada!</h2>
          <p className="text-slate-500 mb-8 font-medium">Seja bem-vindo(a) ao Studio Ritmo Vertical.</p>
          <button onClick={onBack} className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl">Voltar ao Início</button>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 md:p-12 shadow-2xl animate-fade-in relative overflow-hidden">
        <div className="flex justify-between items-center mb-8">
           <h2 className="text-2xl font-black text-slate-900">Auto-Matrícula</h2>
           <button onClick={onBack} className="text-[10px] font-black uppercase text-slate-400">Cancelar</button>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <h3 className="font-black text-slate-800">Qual modalidade você deseja?</h3>
            <div className="grid grid-cols-1 gap-3">
               {modalities.map(m => (
                 <button key={m} onClick={() => { setSelectedModality(m); setStep(2); }} className="p-6 border-2 border-slate-50 rounded-2xl text-left font-black uppercase hover:border-indigo-600 hover:bg-indigo-50 transition-all">{m}</button>
               ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <button onClick={() => setStep(1)} className="text-xs font-black text-indigo-600 underline">← Voltar</button>
            <h3 className="font-black text-slate-800">Escolha o melhor horário:</h3>
            <div className="grid grid-cols-1 gap-3">
               {filteredClasses.length > 0 ? filteredClasses.map(c => (
                 <button key={c.id} onClick={() => { setSelectedClassId(c.id); setStep(3); }} className="p-6 border-2 border-slate-50 rounded-2xl text-left group hover:border-indigo-600 transition-all">
                    <div className="font-black text-slate-900 group-hover:text-indigo-600">{c.name}</div>
                    <div className="text-xs font-bold text-slate-400 mt-1">
                      {c.scheduleDays.map(d => WEEKDAY_LABELS[d]).join(' / ')} • {c.startTime.substring(0,5)}
                    </div>
                 </button>
               )) : (
                 <p className="text-slate-400 font-bold py-10 text-center">Nenhum horário disponível no momento.</p>
               )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <button onClick={() => setStep(2)} className="text-xs font-black text-indigo-600 underline">← Voltar</button>
            <h3 className="font-black text-slate-800">Seus Dados de Contato:</h3>
            <div className="space-y-3">
               <input value={studentData.name} onChange={e => setStudentData({...studentData, name: e.target.value})} placeholder="Nome Completo *" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-600" />
               <input value={studentData.phone} onChange={e => setStudentData({...studentData, phone: e.target.value})} placeholder="WhatsApp (Opcional)" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none" />
            </div>
            <button disabled={!studentData.name} onClick={() => setStep(4)} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-100 disabled:opacity-50">Próximo: Foto</button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 text-center">
             <button onClick={() => setStep(3)} className="text-xs font-black text-indigo-600 underline block text-left">← Voltar</button>
             <h3 className="font-black text-slate-800">Foto para Identificação:</h3>
             
             <div className="w-64 h-64 mx-auto bg-slate-100 rounded-[2rem] overflow-hidden border-4 border-white shadow-inner flex items-center justify-center relative">
                {studentData.photo ? (
                  <img src={studentData.photo} className="w-full h-full object-cover" alt="Sua foto" />
                ) : (
                  <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover ${!cameraActive ? 'hidden' : ''}`} />
                )}
                <canvas ref={canvasRef} className="hidden" />
             </div>

             <div className="space-y-3">
                {!studentData.photo ? (
                  !cameraActive ? (
                    <button onClick={startCamera} className="w-full py-5 bg-slate-900 text-white font-black rounded-2xl">Ativar Câmera</button>
                  ) : (
                    <button onClick={takePhoto} className="w-full py-5 bg-indigo-600 text-white font-black rounded-2xl">Capturar Foto</button>
                  )
                ) : (
                  <>
                    <button disabled={submitting} onClick={handleSubmit} className="w-full py-5 bg-green-600 text-white font-black rounded-2xl">{submitting ? 'Salvando...' : 'Finalizar Matrícula'}</button>
                    <button onClick={() => setStudentData({...studentData, photo: ''})} className="text-xs font-bold text-slate-400 underline">Tirar outra foto</button>
                  </>
                )}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentSelfRegistration;
