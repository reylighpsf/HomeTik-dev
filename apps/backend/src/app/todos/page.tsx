import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';

export default async function TodosPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: todos, error } = await supabase.from('todos').select('*');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Supabase Todos Test</h1>
          <Link href="/" className="text-xs text-indigo-400 hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className="p-4 bg-amber-950/60 border border-amber-800 rounded-xl text-amber-300 text-sm">
            <p className="font-semibold">Supabase Note:</p>
            <p className="text-xs mt-1">
              Table &apos;todos&apos; does not exist yet or RLS policy needs configuration. You can create it in Supabase SQL Editor.
            </p>
          </div>
        )}

        <ul className="space-y-2">
          {todos && todos.length > 0 ? (
            todos.map((todo: any) => (
              <li
                key={todo.id}
                className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-sm"
              >
                {todo.name || todo.title || JSON.stringify(todo)}
              </li>
            ))
          ) : (
            <li className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-sm text-center">
              Belum ada data di tabel &apos;todos&apos;.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
