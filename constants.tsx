
import { Teacher, Class, WeekDay } from './types';

export const INITIAL_TEACHERS: Teacher[] = [
  { id: '1', name: 'Adriano Galucio', email: 'adriano@ritmovertical.com', modality: 'Karatê' },
  { id: '2', name: 'Mário Santiago', email: 'mario@ritmovertical.com', modality: 'Judô' },
  { id: '3', name: 'James Carlos', email: 'james@ritmovertical.com', modality: 'Jiu Jitsu / Muay Thai / MMA' },
  { id: '4', name: 'Joice Iara', email: 'joice@ritmovertical.com', modality: 'Ginástica Rítmica' },
  { id: '5', name: 'Nathalia Dias', email: 'nathalia@ritmovertical.com', modality: 'Ballet Infantil' },
  { id: '6', name: 'Gaby Roxa', email: 'gaby@ritmovertical.com', modality: 'Ballet Infantil' },
  { id: '7', name: 'Jaqueline Resplandes', email: 'jaqueline@ritmovertical.com', modality: 'Pilates Solo' },
];

export const INITIAL_CLASSES: Class[] = [
  // Adriano Galucio - Karatê
  { id: 'k1', teacherId: '1', name: 'Turma 01 - Iniciantes', scheduleDays: [1, 3], startTime: '18:30', endTime: '19:30', description: '2x por semana' },
  { id: 'k2', teacherId: '1', name: 'Turma 02 - Graduados', scheduleDays: [1, 3], startTime: '19:30', endTime: '21:00', description: '2x por semana' },
  { id: 'k3', teacherId: '1', name: 'Turma 03 - Iniciantes', scheduleDays: [1, 3, 5], startTime: '18:30', endTime: '19:30', description: '3x por semana' },
  { id: 'k4', teacherId: '1', name: 'Turma 03 - Graduados', scheduleDays: [1, 3, 5], startTime: '19:30', endTime: '21:00', description: '3x por semana' },
  
  // Mário Santiago - Judô
  { id: 'j1', teacherId: '2', name: 'Turma 01', scheduleDays: [2, 4], startTime: '15:00', endTime: '16:00', description: '2x por semana' },
  { id: 'j2', teacherId: '2', name: 'Turma 02', scheduleDays: [2, 4], startTime: '16:00', endTime: '17:00', description: '2x por semana' },
  
  // James Carlos - Jiu Jitsu / Muay Thai / MMA
  { id: 'jj1', teacherId: '3', name: 'Jiu Jitsu - Turma 01', scheduleDays: [2, 4], startTime: '09:00', endTime: '10:00', description: '2x por semana' },
  { id: 'jj2', teacherId: '3', name: 'Jiu Jitsu - Turma 02', scheduleDays: [2, 4], startTime: '10:00', endTime: '11:00', description: '2x por semana' },
  { id: 'mt1', teacherId: '3', name: 'Muay Thai - Turma 01', scheduleDays: [2, 4], startTime: '20:30', endTime: '21:30', description: '2x por semana' },
  { id: 'mma1', teacherId: '3', name: 'MMA - Turma 01', scheduleDays: [2, 4], startTime: '21:30', endTime: '22:30', description: '2x por semana' },
  
  // Joice Iara - GR
  { id: 'gr1', teacherId: '4', name: 'Turma 01', scheduleDays: [1, 3], startTime: '15:30', endTime: '16:30', description: '2x por semana' },
  { id: 'gr2', teacherId: '4', name: 'Turma 02', scheduleDays: [1, 3], startTime: '16:30', endTime: '17:30', description: '2x por semana' },
  { id: 'gr3', teacherId: '4', name: 'Turma 03', scheduleDays: [1, 3], startTime: '17:30', endTime: '18:30', description: '2x por semana' },
  { id: 'gr4', teacherId: '4', name: 'Turma 04', scheduleDays: [1, 3], startTime: '18:30', endTime: '19:30', description: '2x por semana' },
  
  // Nathalia Dias - Ballet
  { id: 'bn1', teacherId: '5', name: 'Baby - Turma 01', scheduleDays: [2], startTime: '18:00', endTime: '18:50', description: '1x por semana' },
  { id: 'bn2', teacherId: '5', name: 'Pré-infantil - Turma 02', scheduleDays: [2], startTime: '19:00', endTime: '19:50', description: '1x por semana' },
  { id: 'bn3', teacherId: '5', name: 'Infantil - Turma 03', scheduleDays: [2], startTime: '20:00', endTime: '21:00', description: '1x por semana' },
  
  // Gaby Roxa - Ballet
  { id: 'bg1', teacherId: '6', name: 'Baby - Turma 01', scheduleDays: [4], startTime: '18:00', endTime: '18:50', description: '1x por semana' },
  { id: 'bg2', teacherId: '6', name: 'Pré-infantil - Turma 02', scheduleDays: [4], startTime: '19:00', endTime: '19:50', description: '1x por semana' },
  { id: 'bg3', teacherId: '6', name: 'Infantil - Turma 03', scheduleDays: [4], startTime: '20:00', endTime: '21:00', description: '1x por semana' },
  
  // Jaqueline Resplandes - Pilates
  { id: 'p1', teacherId: '7', name: 'Turma 01', scheduleDays: [2, 4], startTime: '18:00', endTime: '19:00', description: '2x por semana' },
  { id: 'p2', teacherId: '7', name: 'Turma 02', scheduleDays: [2, 4], startTime: '19:00', endTime: '20:00', description: '2x por semana' },
];

export const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Dom', 1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb'
};
