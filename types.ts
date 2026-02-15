
export interface Teacher {
  id: string;
  name: string;
  email: string;
  modality: string;
}

export interface Class {
  id: string;
  teacherId: string;
  name: string;
  scheduleDays: number[]; // 0-6
  startTime: string;
  endTime: string;
  description: string;
}

export interface Student {
  id: string;
  teacherId: string;
  name: string;
  active: boolean;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  present: boolean;
}

export enum WeekDay {
  Dom = 0,
  Seg = 1,
  Ter = 2,
  Qua = 3,
  Qui = 4,
  Sex = 5,
  Sab = 6
}
