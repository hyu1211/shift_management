export type Lesson = {
  id: string;
  lesson_date: string;
  period: number;
  subject: string;
  student_name: string;
  start_time: string | null;
  assigned_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateLessonInput = {
  lesson_date: string;
  period: number;
  subject: string;
  student_name: string;
  start_time?: string | null;
};
