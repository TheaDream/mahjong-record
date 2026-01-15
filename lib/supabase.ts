// 반드시 앞에 export가 붙어있어야 다른 파일에서 불러올 수 있습니다.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// 이 줄이 핵심입니다!
export const supabase = createClient(supabaseUrl, supabaseAnonKey);