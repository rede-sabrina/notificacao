"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr('');
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ user, pass }) });
      if (res.ok) {
        router.push('/');
      } else {
        const body = await res.json();
        setErr(body.error || 'Falha ao autenticar');
      }
    } catch (err) {
      setErr('Erro de rede');
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f8fafc 0%,#e9efff 50%,#eef6f9 100%)' }} className="d-flex align-items-center justify-content-center">
      <div className="card shadow-lg border-0" style={{ minWidth: 320, maxWidth: 420, width: '100%', margin: '24px' }}>
        <div className="card-body p-4">
          <div className="text-center mb-3">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
              <rect width="24" height="24" rx="6" fill="#0d6efd" />
              <path d="M7 12h10M7 8h10M7 16h6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 className="card-title mb-1 text-center">Acesso ao Sistema</h2>
          <p className="text-center text-muted small">Faça login para gerenciar as notificações</p>
          <form onSubmit={submit} className="mt-3">
            <div className="form-floating mb-3">
              <input autoFocus value={user} onChange={e => setUser(e.target.value)} className="form-control" id="loginUser" placeholder="Seu usuário" />
              <label htmlFor="loginUser">Usuário</label>
            </div>
            <div className="form-floating mb-3">
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} className="form-control" id="loginPass" placeholder="Senha" />
              <label htmlFor="loginPass">Senha</label>
            </div>
            <div className="d-grid gap-2">
              <button type="submit" className="btn btn-primary btn-lg">Entrar</button>
            </div>
            {err && <div className="mt-3 text-danger small">{err}</div>}
          </form>
          <div className="text-center mt-4">
            <small className="text-muted">Desenvolvido por Bruno.</small>
          </div>
        </div>
      </div>
    </div>
  );
}
