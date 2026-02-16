import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
// ВРЕМЕННО ДЛЯ ДИАГНОСТИКИ:
console.log("ENV VITE_SUPABASE_URL =", url);
console.log("ENV VITE_SUPABASE_ANON_KEY present =", !!anon);

export const supabase = createClient(url, anon);