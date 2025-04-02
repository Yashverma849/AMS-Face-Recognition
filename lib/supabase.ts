"use client"

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { AUTH_REDIRECT_URL } from './config';

// Create a Supabase client for client components
export const supabase = createClientComponentClient();

// Helper functions for data operations

// Students
export async function getStudents() {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('students')
    .select('*');
  
  if (error) throw error;
  return data;
}

export async function getStudent(id: string) {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data;
}

export async function createStudent(student: any) {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('students')
    .insert([student])
    .select();
  
  if (error) throw error;
  return data[0];
}

// Sessions
export async function getAttendanceSessions() {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createAttendanceSession(session: any) {
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert([session])
    .select();
  
  if (error) throw error;
  return data[0];
}

// Records
export async function getSessionAttendance(sessionId: string) {
  const supabase = createClientComponentClient();
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
  const supabase = createClientComponentClient();
  const { data, error } = await supabase
    .from('attendance_records')
    .insert(records)
    .select();
  
  if (error) throw error;
  return data;
}

// Authentication
export async function signUp(email: string, password: string) {
  const supabase = createClientComponentClient();
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
  const supabase = createClientComponentClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const supabase = createClientComponentClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
} 