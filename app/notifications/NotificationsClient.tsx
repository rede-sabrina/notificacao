"use client";
import React, { useEffect, useState } from "react";

type NotificationForm = {
  title: string;
  message: string;
  recipients: string;
  recurring: boolean;
  dayOfMonth?: number;
  sendDate?: string;
  installmentMode: boolean;
  installmentDates: string[];
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

type Toast = {
  id: number;
  message: string;
  type: "success" | "error" | "info";
};

export default function NotificationsClient() {
  const [form, setForm] = useState<NotificationForm>({
    title: "",
    message: "",
    recipients: "",
    recurring: false,
    dayOfMonth: 1,
    sendDate: "",
    installmentMode: false,
    installmentDates: [],
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [list, setList] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "recurring" | "scheduled" | "installment">("all");
  const [search, setSearch] = useState("");
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    fetchList();
  }, []);

  function addToast(message: string, type: "success" | "error" | "info") {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }

  async function fetchList() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      setList(data);
    } catch (err) {
      console.error(err);
      addToast("Erro ao carregar notificações", "error");
    } finally {
      setLoading(false);
    }
  }

  function validateForm(): string | null {
    if (!form.title.trim()) return "Título é obrigatório";
    if (!form.message.trim()) return "Mensagem é obrigatória";
    if (!form.recipients.trim()) return "Destinatários são obrigatórios";
    if (form.recipients.split(",").filter((s) => s.trim()).length === 0)
      return "Informe pelo menos um destinatário";
    if (!form.recurring && !form.installmentMode && !form.sendDate)
      return "Informe uma data de envio ou ative o modo recorrente/parcelado";
    if (form.installmentMode && form.installmentDates.length === 0)
      return "Selecione pelo menos uma data para as parcelas";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      addToast(validationError, "error");
      return;
    }

    if (form.installmentMode && form.installmentDates.length > 0) {
      const recipients = form.recipients.split(",").map((s) => s.trim()).filter(Boolean);
      const totalInstallments = form.installmentDates.length;

      try {
        const promises = form.installmentDates.map((date, index) => {
          const parcelNumber = index + 1;
          const installmentTitle = `${form.title} - Parcela ${String(parcelNumber).padStart(2, "0")}/${String(totalInstallments).padStart(2, "0")}`;
          const installmentMessage = `Parcela ${String(parcelNumber).padStart(2, "0")}/${String(totalInstallments).padStart(2, "0")}\n\n${form.message}`;

          return fetch("/api/notifications", {
            method: "POST",
            body: JSON.stringify({
              title: installmentTitle,
              message: installmentMessage,
              recipients,
              recurring: false,
              sendDate: date,
            }),
            headers: { "Content-Type": "application/json" },
          });
        });

        await Promise.all(promises);

        setForm({
          title: "",
          message: "",
          recipients: "",
          recurring: false,
          dayOfMonth: 1,
          sendDate: "",
          installmentMode: false,
          installmentDates: [],
        });
        setEditingId(null);
        fetchList();
        addToast(`${totalInstallments} parcelas agendadas com sucesso!`, "success");
      } catch (err) {
        console.error(err);
        addToast("Erro ao agendar parcelas", "error");
      }
      return;
    }

    const payload: any = {
      title: form.title,
      message: form.message,
      recipients: form.recipients.split(",").map((s) => s.trim()).filter(Boolean),
      recurring: form.recurring,
    };
    if (form.recurring) payload.dayOfMonth = Number(form.dayOfMonth);
    else if (form.sendDate) payload.sendDate = form.sendDate;

    try {
      let res;
      if (editingId) {
        res = await fetch("/api/notifications", {
          method: "PUT",
          body: JSON.stringify({ id: editingId, ...payload }),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        res = await fetch("/api/notifications", {
          method: "POST",
          body: JSON.stringify(payload),
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!res.ok) throw new Error("Erro ao salvar");

      setForm({
        title: "",
        message: "",
        recipients: "",
        recurring: false,
        dayOfMonth: 1,
        sendDate: "",
        installmentMode: false,
        installmentDates: [],
      });
      setEditingId(null);
      fetchList();
      addToast(editingId ? "Notificação atualizada!" : "Notificação salva com sucesso!", "success");
    } catch (err) {
      console.error(err);
      addToast("Erro ao salvar notificação", "error");
    }
  }

  function handleEdit(item: NotificationItem) {
    setEditingId(item._id);
    setForm({
      title: item.title,
      message: item.message,
      recipients: item.recipients.join(", "),
      recurring: !!item.recurring,
      dayOfMonth: item.dayOfMonth ?? 1,
      sendDate: item.sendDate
        ? new Date(item.sendDate).toISOString().substring(0, 10)
        : "",
      installmentMode: false,
      installmentDates: [],
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleDelete(id: string) {
    if (!confirm("Confirmar exclusão?")) return;
    try {
      const res = await fetch(
        "/api/notifications?id=" + encodeURIComponent(id),
        { method: "DELETE" }
      );
      if (!res.ok && res.status !== 204) throw new Error("Erro ao deletar");
      fetchList();
      addToast("Notificação excluída", "info");
    } catch (err) {
      console.error(err);
      addToast("Erro ao excluir notificação", "error");
    }
  }

  async function handleSendNow() {
    if (!confirm("Executar envio de todas as notificações de hoje agora?")) return;
    try {
      const res = await fetch("/api/notifications/send-now", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Erro");
      addToast(`Envio executado! ${data.sent || 0} notificação(ões) processada(s)`, "success");
      fetchList();
    } catch (err: any) {
      console.error(err);
      addToast("Erro ao executar envio: " + (err.message || err), "error");
    }
  }

  function getTypeBadge(item: NotificationItem) {
    if (item.recurring) {
      return (
        <span className="badge bg-primary">
          <i className="bi bi-arrow-repeat me-1"></i>
          Recorrente (dia {item.dayOfMonth})
        </span>
      );
    }
    if (item.sendDate) {
      const isInstallment = item.title.includes("Parcela");
      if (isInstallment) {
        return (
          <span className="badge bg-success">
            <i className="bi bi-receipt me-1"></i>
            Parcela
          </span>
        );
      }
      return (
        <span className="badge bg-info text-dark">
          <i className="bi bi-calendar-event me-1"></i>
          Agendado {new Date(item.sendDate).toLocaleDateString()}
        </span>
      );
    }
    return (
      <span className="badge bg-secondary">
        <i className="bi bi-clock me-1"></i>
        Único
      </span>
    );
  }

  function getStatusBadge(item: NotificationItem) {
    if (!item.active) {
      return (
        <span className="badge bg-secondary">
          <i className="bi bi-check-circle me-1"></i>
          Enviado
        </span>
      );
    }
    if (item.lastSent) {
      return (
        <span className="badge bg-warning text-dark">
          <i className="bi bi-arrow-counterclockwise me-1"></i>
          Reenviar
        </span>
      );
    }
    return (
      <span className="badge bg-success">
        <i className="bi bi-clock-history me-1"></i>
        Pendente
      </span>
    );
  }

  function filterList() {
    return list.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.message.toLowerCase().includes(search.toLowerCase()) ||
        item.recipients.some((r) => r.toLowerCase().includes(search.toLowerCase()));

      if (!matchesSearch) return false;

      if (filter === "recurring") return item.recurring;
      if (filter === "scheduled") return !item.recurring && item.sendDate;
      if (filter === "installment") return item.title.includes("Parcela");
      return true;
    });
  }

  const filteredList = filterList();

  return (
    <div className="container py-4">
      {/* Toast Notifications */}
      <div className="toast-container position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast show bg-${toast.type === "success" ? "success" : toast.type === "error" ? "danger" : "info"} text-white`}
            role="alert"
          >
            <div className="toast-body d-flex align-items-center gap-2">
              <i
                className={`bi bi-${
                  toast.type === "success"
                    ? "check-circle"
                    : toast.type === "error"
                    ? "exclamation-triangle"
                    : "info-circle"
                }`}
              ></i>
              {toast.message}
            </div>
          </div>
        ))}
      </div>

      <div className="row justify-content-center">
        <div className="col-12 col-md-10">
          <div className="card mb-4 shadow-sm">
            <div className="card-body">
              <h1 className="card-title d-flex align-items-center gap-2">
                <i className="bi bi-bell-fill text-primary"></i>
                {editingId ? "Editar Notificação" : "Cadastrar Notificação"}
              </h1>
              <form onSubmit={handleSubmit} className="mt-3">
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-card-heading me-1"></i>
                    Título
                  </label>
                  <input
                    value={form.title}
                    onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))}
                    placeholder="Ex: Boleto Disponível"
                    className="form-control"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-card-text me-1"></i>
                    Mensagem
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm((s) => ({ ...s, message: e.target.value }))}
                    placeholder="Digite a mensagem da notificação..."
                    className="form-control"
                    rows={4}
                    required
                  />
                  <div className="form-text text-end">
                    {form.message.length} caracteres
                  </div>
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    <i className="bi bi-envelope me-1"></i>
                    Destinatários
                  </label>
                  <input
                    value={form.recipients}
                    onChange={(e) =>
                      setForm((s) => ({ ...s, recipients: e.target.value }))
                    }
                    placeholder="email1@exemplo.com, email2@exemplo.com"
                    className="form-control"
                    required
                  />
                  <div className="form-text">
                    Separe múltiplos e-mails com vírgula
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={form.recurring}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            recurring: e.target.checked,
                            installmentMode: false,
                          }))
                        }
                        id="recurringCheck"
                        disabled={form.installmentMode}
                      />
                      <label className="form-check-label" htmlFor="recurringCheck">
                        <i className="bi bi-arrow-repeat me-1"></i>
                        Recorrente (todo mês)
                      </label>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={form.installmentMode}
                        onChange={(e) =>
                          setForm((s) => ({
                            ...s,
                            installmentMode: e.target.checked,
                            recurring: false,
                            installmentDates: [],
                          }))
                        }
                        id="installmentCheck"
                        disabled={form.recurring}
                      />
                      <label className="form-check-label" htmlFor="installmentCheck">
                        <i className="bi bi-receipt me-1"></i>
                        Parcelado
                      </label>
                    </div>
                  </div>
                </div>

                {form.recurring ? (
                  <div className="mb-3 p-3 bg-light rounded">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-calendar3 me-1"></i>
                      Dia do mês para envio:
                    </label>
                    <select
                      value={form.dayOfMonth}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, dayOfMonth: Number(e.target.value) }))
                      }
                      className="form-select"
                    >
                      {Array.from({ length: 31 }).map((_, i) => (
                        <option key={i} value={i + 1}>
                          Dia {i + 1}
                        </option>
                      ))}
                    </select>
                    <div className="form-text mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      Será enviado todo mês no dia selecionado
                    </div>
                  </div>
                ) : form.installmentMode ? (
                  <div className="mb-3 p-3 bg-light rounded">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-calendar-check me-1"></i>
                      Selecione as datas das parcelas:
                    </label>
                    <div className="input-group mb-3">
                      <input
                        type="date"
                        className="form-control"
                        id="installmentDateInput"
                      />
                      <button
                        type="button"
                        className="btn btn-outline-primary"
                        onClick={() => {
                          const input = document.getElementById(
                            "installmentDateInput"
                          ) as HTMLInputElement;
                          if (input && input.value) {
                            if (!form.installmentDates.includes(input.value)) {
                              setForm((s) => ({
                                ...s,
                                installmentDates: [
                                  ...s.installmentDates,
                                  input.value,
                                ].sort(),
                              }));
                              input.value = "";
                              addToast("Data adicionada!", "success");
                            } else {
                              addToast("Data já selecionada", "info");
                            }
                          }
                        }}
                      >
                        <i className="bi bi-plus-lg me-1"></i>
                        Adicionar
                      </button>
                    </div>
                    {form.installmentDates.length > 0 && (
                      <div className="list-group">
                        {form.installmentDates.map((date, idx) => (
                          <div
                            key={date}
                            className="list-group-item d-flex justify-content-between align-items-center py-2"
                          >
                            <span>
                              <i className="bi bi-receipt text-success me-2"></i>
                              <strong>
                                Parcela {String(idx + 1).padStart(2, "0")}/
                                {String(form.installmentDates.length).padStart(2, "0")}
                              </strong>{" "}
                              - {new Date(date + "T00:00:00").toLocaleDateString()}
                            </span>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() =>
                                setForm((s) => ({
                                  ...s,
                                  installmentDates: s.installmentDates.filter(
                                    (d) => d !== date
                                  ),
                                }))
                              }
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {form.installmentDates.length === 0 && (
                      <div className="text-muted">
                        <i className="bi bi-info-circle me-1"></i>
                        Nenhuma data selecionada. Adicione datas para criar as parcelas.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mb-3 p-3 bg-light rounded">
                    <label className="form-label fw-semibold">
                      <i className="bi bi-calendar-event me-1"></i>
                      Data de envio:
                    </label>
                    <input
                      type="date"
                      value={form.sendDate}
                      onChange={(e) =>
                        setForm((s) => ({ ...s, sendDate: e.target.value }))
                      }
                      className="form-control"
                    />
                    <div className="form-text mt-2">
                      <i className="bi bi-info-circle me-1"></i>
                      Deixe em branco para envio imediato ou selecione uma data futura
                    </div>
                  </div>
                )}

                <div className="d-flex gap-2 align-items-center">
                  <button type="submit" className="btn btn-primary">
                    <i className="bi bi-save me-1"></i>
                    {editingId ? "Atualizar" : "Salvar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        title: "",
                        message: "",
                        recipients: "",
                        recurring: false,
                        dayOfMonth: 1,
                        sendDate: "",
                        installmentMode: false,
                        installmentDates: [],
                      });
                      setEditingId(null);
                    }}
                    className="btn btn-secondary"
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Limpar
                  </button>
                  <button
                    type="button"
                    onClick={fetchList}
                    className="btn btn-outline-secondary"
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>
                    Atualizar lista
                  </button>
                  <button
                    type="button"
                    onClick={handleSendNow}
                    className="btn btn-success ms-auto"
                  >
                    <i className="bi bi-send me-1"></i>
                    Enviar agora
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-body">
              <h2 className="card-title d-flex align-items-center gap-2">
                <i className="bi bi-list-ul text-primary"></i>
                Notificações Cadastradas
              </h2>

              {/* Filtros e Busca */}
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <div className="input-group">
                    <span className="input-group-text bg-light">
                      <i className="bi bi-search"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Buscar por título, mensagem ou destinatário..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="btn-group w-100" role="group">
                    <button
                      type="button"
                      className={`btn btn-outline-primary ${filter === "all" ? "active" : ""}`}
                      onClick={() => setFilter("all")}
                    >
                      <i className="bi bi-collection me-1"></i>
                      Todas ({list.length})
                    </button>
                    <button
                      type="button"
                      className={`btn btn-outline-primary ${filter === "recurring" ? "active" : ""}`}
                      onClick={() => setFilter("recurring")}
                    >
                      <i className="bi bi-arrow-repeat me-1"></i>
                      Recorrentes
                    </button>
                    <button
                      type="button"
                      className={`btn btn-outline-primary ${filter === "scheduled" ? "active" : ""}`}
                      onClick={() => setFilter("scheduled")}
                    >
                      <i className="bi bi-calendar-event me-1"></i>
                      Agendadas
                    </button>
                    <button
                      type="button"
                      className={`btn btn-outline-primary ${filter === "installment" ? "active" : ""}`}
                      onClick={() => setFilter("installment")}
                    >
                      <i className="bi bi-receipt me-1"></i>
                      Parcelas
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </div>
                  <p className="mt-2 text-muted">Carregando notificações...</p>
                </div>
              ) : (
                <div className="list-group">
                  {filteredList.length === 0 ? (
                    <div className="list-group-item text-center py-4">
                      <i className="bi bi-inbox fs-1 text-muted"></i>
                      <p className="text-muted mb-0 mt-2">
                        {search || filter !== "all"
                          ? "Nenhuma notificação encontrada com os filtros selecionados"
                          : "Nenhuma notificação cadastrada"}
                      </p>
                    </div>
                  ) : (
                    filteredList.map((item) => (
                      <div
                        key={item._id}
                        className="list-group-item list-group-item-action py-3"
                      >
                        <div className="d-flex w-100 justify-content-between align-items-start mb-2">
                          <h5 className="mb-1">{item.title}</h5>
                          <div className="d-flex gap-2">
                            {getTypeBadge(item)}
                            {getStatusBadge(item)}
                          </div>
                        </div>
                        <p className="mb-2 text-muted">{item.message}</p>
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            <i className="bi bi-envelope me-1"></i>
                            <strong>Para:</strong> {item.recipients.join(", ")}
                          </small>
                          {item.lastSent && (
                            <small className="text-muted">
                              <i className="bi bi-check-circle text-success me-1"></i>
                              Enviado em: {new Date(item.lastSent).toLocaleString()}
                            </small>
                          )}
                        </div>
                        <div className="mt-2">
                          <button
                            className="btn btn-sm btn-outline-primary me-2"
                            onClick={() => handleEdit(item)}
                          >
                            <i className="bi bi-pencil me-1"></i>
                            Editar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(item._id)}
                          >
                            <i className="bi bi-trash me-1"></i>
                            Excluir
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}