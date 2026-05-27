export interface Student {
  id: string;
  name: string;
  rollNo: string;
  department: string;
  semester: number;
  year: number;
  email: string;
  photoUrl?: string;
  gpa: number;
  cgpa: number;
  attendance: number;
  feeStatus: 'Paid' | 'Pending' | 'Overdue';
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  subjectCode: string;
  subjectName: string;
  credits: number;
  testType: string;
  maxMarks: number;
  score: number;
  weightage: number;
  grade: string;
  semester: number;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  category: string;
  amount: number;
  paid: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}
