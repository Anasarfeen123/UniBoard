export const VTOP_CHENNAI_ORIGIN = "https://vtopcc.vit.ac.in"

export type VtopSyncArea =
  | "profile"
  | "photo"
  | "attendance"
  | "marks"
  | "gpa"
  | "timetable"
  | "exams"
  | "fees"
  | "history"

export type VtopErrorCode =
  | "WRONG_CREDENTIALS"
  | "CAPTCHA_REQUIRED"
  | "CAPTCHA_INVALID"
  | "VTOP_DOWN"
  | "NETWORK_ERROR"
  | "SESSION_EXPIRED"
  | "SCRAPE_FAILED"
  | "CONNECTOR_UNAVAILABLE"
  | "EMPTY_DATA"

export type VtopProfile = {
  fullName: string
  registrationNumber: string
  program: string
  branch: string
  school: string
  department: string
  semester: string
  email: string
  academicStatus: string
  profilePhoto?: string
}

export type VtopAttendanceRecord = {
  courseCode: string
  courseTitle: string
  slot?: string
  faculty?: string
  attended: number
  total: number
  percentage: number
  status: "On Track" | "Needs Attention" | "Unknown"
}

export type VtopMarkRecord = {
  courseCode: string
  courseTitle: string
  assessment: string
  scored?: number
  max?: number
  grade?: string
}

export type VtopGpaRecord = {
  semester: string
  gpa?: number
  cgpa?: number
  credits?: number
}

export type VtopTimetableEntry = {
  day: string
  startTime: string
  endTime?: string
  courseCode: string
  courseTitle: string
  room?: string
  slot?: string
}

export type VtopExamEntry = {
  courseCode: string
  courseTitle: string
  examType: string
  date?: string
  time?: string
  venue?: string
}

export type VtopFeeRecord = {
  label: string
  amount?: number
  paid?: number
  due?: number
  dueDate?: string
  status: "Paid" | "Pending" | "Overdue" | "Unknown"
}

export type VtopAcademicHistoryRecord = {
  semester: string
  courseCode?: string
  courseTitle?: string
  credits?: number
  grade?: string
  result?: string
}

export type VtopSyncedData = {
  campus: "VTOP Chennai"
  source: typeof VTOP_CHENNAI_ORIGIN
  syncedAt: string
  profile?: VtopProfile
  attendance: VtopAttendanceRecord[]
  marks: VtopMarkRecord[]
  gpa: VtopGpaRecord[]
  timetable: VtopTimetableEntry[]
  exams: VtopExamEntry[]
  fees: VtopFeeRecord[]
  academicHistory: VtopAcademicHistoryRecord[]
  unavailableAreas: VtopSyncArea[]
}

export type VtopConnectionState = {
  connected: boolean
  username?: string
  lastSyncedAt?: string
  sessionExpiresAt?: string
  campus: "VTOP Chennai"
  source: typeof VTOP_CHENNAI_ORIGIN
}

export type VtopApiResponse =
  | {
      ok: true
      message: string
      state: VtopConnectionState
      data?: VtopSyncedData
    }
  | {
      ok: false
      code: VtopErrorCode
      message: string
      recoverable: boolean
      state?: VtopConnectionState
    }
