"use client";
import React, { useEffect, useState } from "react";

type NotificationForm = {
  title: string;
  message: string;
  recipients: string;
  recurring: boolean;
  dayOfMonth?: number;
  sendDate?: string;
};

type NotificationItem = {
  _id: string;
  title: string;
  message: string;
  recipients: string[];
  recurring: boolean;
  dayOfMonth?: number;
  sendDate?: string;
  active?: boolean;
  lastSent?: string;
};

export default function NotificationsClient() {
  const [form, setForm] = useState<NotificationForm>({
    title: "",
    message: "",
    recipients: "",
    recurring: false,
    dayOfMonth: 1,
    sendDate: ""
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchList();
  }, []);

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      setList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: any = {
      title: form.title,
      message: form.message,
      recipients: form.recipients.split(',').map(s => s.trim()).filter(Boolean),
      recurring: form.recurring
    };
    if (form.recurring) payload.dayOfMonth = Number(form.dayOfMonth);
    else if (form.sendDate) payload.sendDate = form.sendDate;
    try {
      let res;
      if (editingId) {
        res = await fetch('/api/notifications', { method: 'PUT', body: JSON.stringify({ id: editingId, ...payload }), headers: { 'Content-Type': 'application/json' } });
      } else {
        res = await fetch('/api/notifications', { method: 'POST', body: JSON.stringify(payload), headers: { 'Content-Type': 'application/json' } });
      }
      if (!res.ok) throw new Error('Erro ao salvar');
      setForm({ title: '', message: '', recipients: '', recurring: false, dayOfMonth: 1, sendDate: '' });
      setEditingId(null);
      fetchList();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar notificação');
    }
  }

  function handleEdit(item: NotificationItem) {
    setEditingId(item._id);
    setForm({
      title: item.title,
      message: item.message,
      recipients: item.recipients.join(', '),
      recurring: !!item.recurring,
      dayOfMonth: item.dayOfMonth ?? 1,
      sendDate: item.sendDate ? new Date(item.sendDate).toISOString().substring(0,10) : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function handleDelete(id: string) {
    if (!confirm('Confirmar exclusão?')) return;
    try {
      const res = await fetch('/api/notifications?id=' + encodeURIComponent(id), { method: 'DELETE' });
      if (!res.ok && res.status !== 204) throw new Error('Erro ao deletar');
      fetchList();
    } catch (err) {
      console.error(err);
      alert('Erro ao excluir notificação');
    }
  }

  async function handleSendNow() {
    if (!confirm('Executar envio de todas as notificações de hoje agora?')) return;
    try {
      const res = await fetch('/api/notifications/send-now', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Erro');
      alert(`Envio executado. Total processado: ${data.sent || 0}`);
      fetchList();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao executar envio: ' + (err.message || err));
    }
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-12 col-md-8">
          <div className="card mb-4">
            <div className="card-body">
              <h1 className="card-title">{editingId ? 'Editar Notificação' : 'Cadastrar Notificação'}</h1>
              <form onSubmit={handleSubmit} className="mt-3">
                <div className="mb-2">
                  <input value={form.title} onChange={e => setForm(s => ({ ...s, title: e.target.value }))} placeholder="Título" className="form-control" required />
                </div>
                <div className="mb-2">
                  <textarea value={form.message} onChange={e => setForm(s => ({ ...s, message: e.target.value }))} placeholder="Mensagem" className="form-control" required />
                </div>
                <div className="mb-2">
                  <input value={form.recipients} onChange={e => setForm(s => ({ ...s, recipients: e.target.value }))} placeholder="Destinatários (separados por vírgula)" className="form-control" required />
                </div>
                <div className="form-check mb-2">
                  <input className="form-check-input" type="checkbox" checked={form.recurring} onChange={e => setForm(s => ({ ...s, recurring: e.target.checked }))} id="recurringCheck" />
                  <label className="form-check-label" htmlFor="recurringCheck">Enviar todo mês?</label>
                </div>
                {form.recurring ? (
                  <div className="mb-2">
                    <label>Dia do mês:</label>
                    <select value={form.dayOfMonth} onChange={e => setForm(s => ({ ...s, dayOfMonth: Number(e.target.value) }))} className="form-select">
                      {Array.from({ length: 31 }).map((_, i) => (
                        <option key={i} value={i + 1}>{i + 1}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="mb-2">
                    <label>Data de envio (opcional):</label>
                    <input type="date" value={form.sendDate} onChange={e => setForm(s => ({ ...s, sendDate: e.target.value }))} className="form-control" />
                  </div>
                )}
                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary">{editingId ? 'Salvar alterações' : 'Salvar'}</button>
                  <button type="button" onClick={() => { setForm({ title: '', message: '', recipients: '', recurring: false, dayOfMonth: 1, sendDate: '' }); setEditingId(null); }} className="btn btn-secondary">Limpar</button>
                  <button type="button" onClick={fetchList} className="btn btn-outline-secondary">Atualizar lista</button>
                  <button type="button" onClick={handleSendNow} className="btn btn-success ms-auto">Enviar agora</button>
                </div>
              </form>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Notificações</h2>
              {loading ? <p>Carregando...</p> : (
                <div className="list-group">
                  {list.length === 0 && <div className="list-group-item">Nenhuma notificação cadastrada</div>}
                  {list.map(item => (
                    <div key={item._id} className="list-group-item">
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">{item.title}</h5>
                        <small className="text-muted">{item.recurring ? `Recorrente (dia ${item.dayOfMonth})` : (item.sendDate ? `Agendado ${new Date(item.sendDate).toLocaleDateString()}` : 'Único')}</small>
                      </div>
                      <p className="mb-1">{item.message}</p>
                      <small className="text-muted">Para: {item.recipients.join(', ')}</small>
                      <div className="mt-2">
                        <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleEdit(item)}>Editar</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(item._id)}>Excluir</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
