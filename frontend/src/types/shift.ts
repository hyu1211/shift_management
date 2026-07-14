export type ShiftRow = {
  id: number;
  user_id: string;
  shift_date: string;
  term_id: string;
  day: string;
  is_working: boolean;
  start_time: string | null;
  end_time: string | null;
  is_confirmed: boolean;
};

export type ShiftFormDay = {
  shift_date: string;
  displayDate: string;
  day: string;
  isWorking: boolean;
  startTime: string;
  endTime: string;
};

export type AdminShiftDisplay = {
  id: number;
  user_id: string;
  shift_date: string;
  start_time: string | null;
  end_time: string | null;
  is_confirmed: boolean;
  teacherName: string;
};

export type AdminDateGroup = {
  date: string;
  label: string;
  shifts: AdminShiftDisplay[];
};
