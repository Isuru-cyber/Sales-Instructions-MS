import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://pxwawodtfyklpzexjdsg.supabase.co';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4d2F3b2R0ZnlrbHB6ZXhqZHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5NzIyMzYsImV4cCI6MjA4MTU0ODIzNn0.mJKQ2ssUxVghcLBZPEGEEtvQsCpqlDHWd--Qs0G5pDI';

export const supabase = createClient(PROJECT_URL, API_KEY);

/* 
  === SUPABASE SQL SCHEMA SETUP ===
  
  Please check the file `supabase_setup.sql` in the project root.
  Copy the content of that file and run it in your Supabase SQL Editor
  to create the necessary tables and seed initial data.
*/
