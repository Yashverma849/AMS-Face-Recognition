"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AUTH_REDIRECT_URL, SUPABASE_URL, SUPABASE_ANON_KEY } from './config';

// Create a Supabase client for client components with explicit config
export const supabase = createClientComponentClient({
  supabaseUrl: SUPABASE_URL,
  supabaseKey: SUPABASE_ANON_KEY,
});

// Helper functions for data operations

// Create configured client
const createConfiguredClient = () => {
  return createClientComponentClient({
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_ANON_KEY,
  });
};

// Students
export async function getStudents() {
  const supabase = createConfiguredClient();
  const { data, error } = await supabase
    .from('students')
    .select('*');
  
  if (error) throw error;
  return data;
}

export async function getStudent(id: string) {
  const supabase = createConfiguredClient();
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createStudent(student: any) {
  const supabase = createConfiguredClient();
  const { data, error } = await supabase
    .from('students')
    .insert([student])
    .select();
  
  if (error) throw error;
  return data[0];
}

// Sessions
export async function getAttendanceSessions() {
  const supabase = createConfiguredClient();
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createAttendanceSession(session: any) {
  const supabase = createConfiguredClient();
  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert([session])
    .select();
  
  if (error) throw error;
  return data[0];
}

// Records
export async function getSessionAttendance(sessionId: string) {
  const supabase = createConfiguredClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .select(`
      *,
      students (id, first_name, last_name)
    `)
    .eq('session_id', sessionId);
  
  if (error) throw error;
  return data;
}

export async function recordAttendance(records: any[]) {
  const supabase = createConfiguredClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .insert(records)
    .select();
  
  if (error) throw error;
  return data;
}

// Authentication
export async function signUp(email: string, password: string) {
  const supabase = createConfiguredClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: AUTH_REDIRECT_URL,
    }
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const supabase = createConfiguredClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createConfiguredClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
} 