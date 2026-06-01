import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { format, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  CheckCircle2,
  ShieldCheck,
  HardHat,
  CalendarDays,
  Users,
  User as UserIcon,
  Upload,
  Lock,
  ChevronRight,
  ChevronLeft,
  RefreshCw,
  Ship,
} from "lucide-react";
import heroPort from "@/assets/hero-port.jpg";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "Wilson Sons – Maior operadora integrada de logística portuária e marítima do mercado brasileiro",
      },
      {
        name: "description",
        content:
          "Agendamento de Visitas Operacionais Wilson Sons — segurança, eficiência e conformidade em terminais portuários.",
      },
      {
        property: "og:title",
        content: "Agendamento de Visitas Operacionais — Wilson Sons",
      },
      {
        property: "og:description",
        content:
          "Sistema seguro e responsivo de gestão de visitas em terminais e estaleiros Wilson Sons.",
      },
    ],
  }),
  component: Index,
});

const API_URL =
  "https://script.google.com/macros/s/AKfycbzNXg2sDatdBPIN81J2-f-T5DTdHqhyn7FGMFOeyp-ufDY_O9I-oR9TkrPJ4KVUAG2G/exec";

const DEFAULT_HOSTS = [
  { id: "h1", name: "Ana Maria", department: "Operações Portuárias" },
  { id: "h2", name: "Bruno Silva", department: "Estaleiro & Reboque" },
  { id: "h3", name: "Carla Mendes", department: "Segurança do Trabalho" },
  { id: "h4", name: "Diego Souza", department: "Logística Integrada" },
];

type Host = { id: string; name: string; department?: string };
type DisponibilidadeAPI = {
  id: string;
  data: string;
  turno: string;
  host: string;
  vagasRestantes: number;
};

const hostDisplay = (h?: Host) => (h ? `${h.name}${h.department ? ` — ${h.department}` : ""}` : "");

const QUIZ = [
  {
    q: "Qual vestimenta é PROIBIDA nas áreas operacionais da Wilson Sons?",
    options: [
      "Calça comprida, camisa de manga e botas fechadas",
      "Regatas, shorts e sapatos abertos (chinelos/sandálias)",
      "Uniforme da empresa contratada com crachá",
    ],
    correct: 1,
  },
  {
    q: "Quais EPIs são OBRIGATÓRIOS nas áreas operacionais?",
    options: [
      "Apenas óculos escuros e protetor solar",
      "Boné, tênis esportivo e camiseta refletiva",
      "Capacete, botas de segurança e colete refletivo",
    ],
    correct: 2,
  },
  {
    q: "Ao avistar uma movimentação de carga próxima, o visitante deve:",
    options: [
      "Manter distância e seguir as originas do host/acompanhante",
      "Aproximar-se para registrar fotos da operação",
      "Atravessar rapidamente a área de movimentação",
    ],
    correct: 0,
  },
];

function Index() {
  const [step, setStep] = useState(1);
  const [hosts, setHosts] = useState<Host[]>(DEFAULT_HOSTS);
  const [disponibilidades, setDisponibilidades] = useState<DisponibilidadeAPI[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [turno, setTurno] = useState<string>("");

  useEffect(() => {
    fetch(API_URL)
      .then((r) => r.json())
      .then((data) => {
        if (data?.hosts && Array.isArray(data.hosts) && data.hosts.length > 0) {
          setHosts(data.hosts as Host[]);
        }
        if (data?.disponibilidades && Array.isArray(data.disponibilidades)) {
          setDisponibilidades(data.disponibilidades as DisponibilidadeAPI[]);
        }
      })
      .catch((err) => console.error("Erro ao buscar dados da API:", err));
  }, []);

  const [name, setName] = useState("");
  const [doc, setDoc] = useState("");
  const [docType, setDocType] = useState<"cpf" | "cin">("cpf");

  const formatDoc = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    let out = digits;
    if (digits.length > 9) {
      out = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    } else if (digits.length > 6) {
      out = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    } else if (digits.length > 3) {
      out = `${digits.slice(0, 3)}.${digits.slice(3)}`;
    }
    return out;
  };

  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [host, setHost] = useState<string>("");
  const [visitType, setVisitType] = useState<"individual" | "grupo">("individual");
  const [visitReason, setVisitReason] = useState<string>("");
  const [groupSize, setGroupSize] = useState("");
  const [fileData, setFileData] = useState<{
    base64: string;
    name: string;
    type: string;
  } | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [acceptEpi, setAcceptEpi] = useState(false);

  const isEmailValid = useMemo(() => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email.trim());
  }, [email]);

  const step1Valid = useMemo(() => {
    const camposBasicos =
      name.trim() && doc.trim() && company.trim() && isEmailValid && host && visitReason;
    if (visitType === "individual") return camposBasicos;
    if (visitType === "grupo") {
      return camposBasicos && Number(groupSize) >= 2 && fileData !== null;
    }
    return false;
  }, [name, doc, company, isEmailValid, host, visitType, groupSize, fileData, visitReason]);

  const step2Valid = !!date;
  const allCorrect = QUIZ.every((q, i) => answers[i] === q.correct);
  const canSubmit = step1Valid && step2Valid && allCorrect && acceptEpi && !submitted;

  const selectedHostObj = hosts.find((h) => h.id === host);

  const disabledDates = useMemo(() => {
    const today = startOfToday();
    return (d: Date) => {
      if (d < today) return true;
      if (d.getDay() === 0 || d.getDay() === 6) return true;

      if (disponibilidades.length > 0 && selectedHostObj) {
        const diaCalendario = d.getDate();
        const mesCalendario = d.getMonth() + 1;
        const anoCalendario = d.getFullYear();
        const hostSelecionado = String(selectedHostObj.name).trim().toLowerCase();

        const temVaga = disponibilidades.some((disp) => {
          if (!disp.data) return false;

          const partes = String(disp.data).trim().split("/");
          if (partes.length !== 3) return false;

          const diaPlanilha = parseInt(partes[0], 10);
          const mesPlanilha = parseInt(partes[1], 10);
          const anoPlanilha = parseInt(partes[2], 10);

          const dataBate =
            diaCalendario === diaPlanilha &&
            mesCalendario === mesPlanilha &&
            anoCalendario === anoPlanilha;
          const hostPlanilha = disp.host ? String(disp.host).trim().toLowerCase() : "";
          const hostBate =
            hostPlanilha === hostSelecionado ||
            hostPlanilha.includes(hostSelecionado) ||
            hostSelecionado.includes(hostPlanilha);

          const statusValido =
            String(disp.vagasRestantes).toLowerCase().includes("liberado") ||
            Number(disp.vagasRestantes) > 0;

          return dataBate && hostBate && statusValido;
        });

        return !temVaga;
      }
      return false;
    };
  }, [selectedHostObj, disponibilidades]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(",")[1];
      setFileData({
        base64: base64String,
        name: file.name,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleResetForm = () => {
    setName("");
    setDoc("");
    setCompany("");
    setEmail("");
    setHost("");
    setVisitType("individual");
    setVisitReason("");
    setGroupSize("");
    setFileData(null);
    setDate(undefined);
    setAnswers({});
    setAcceptEpi(false);
    setSubmitted(false);
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const turnoSelecionado = useMemo(() => {
    if (!date || !selectedHostObj) return "Manhã";
    const diaCalendario = date.getDate();
    const mesCalendario = date.getMonth() + 1;
    const anoCalendario = date.getFullYear();
    const hostSelecionado = String(selectedHostObj.name).trim().toLowerCase();

    const correspondente = disponibilidades.find((disp) => {
      if (!disp.data) return false;
      const partes = String(disp.data).split("/");
      if (partes.length !== 3) return false;

      const diaPlanilha = parseInt(partes[0], 10);
      const mesPlanilha = parseInt(partes[1], 10);
      const anoPlanilha = parseInt(partes[2], 10);

      const dataBate =
        diaCalendario === diaPlanilha &&
        mesCalendario === mesPlanilha &&
        anoCalendario === anoPlanilha;
      const hostPlanilha = disp.host ? String(disp.host).trim().toLowerCase() : "";
      const hostBate = hostPlanilha === hostSelecionado || hostPlanilha.includes(hostSelecionado);

      return dataBate && hostBate;
    });

    return correspondente ? correspondente.turno : "Manhã";
  }, [date, selectedHostObj, disponibilidades]);

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  const handleSubmit = () => {
    if (!canSubmit) return;

    const payload = {
      name: name,
      nome: name,
      identidade: doc,
      instituicao: company,
      email: email,
      host: selectedHostObj ? selectedHostObj.name : "",
      tipoVisita: visitType === "grupo" ? "Em Grupo / Excursão" : "Individual",
      motivoVisita: visitReason,
      qtdPessoas: visitType === "grupo" ? groupSize : "1",
      dataVisita: date ? format(date, "dd/MM/yyyy") : "",
      turno: turno === "Manhã" ? "Manhã (07h30 – 12h00)" : "Tarde (13h00 – 17h30)",
      arquivoBase64: fileData ? fileData.base64 : "",
      nomeArquivo: fileData ? fileData.name : "",
      tipoArquivo: fileData ? fileData.type : "",
      linkAnexo: fileData ? `Arquivo Anexado: ${fileData.name}` : "Não aplicável (Individual)",
    };

    fetch(API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => {
        setSubmitted(true);
      })
      .catch((erro) => console.error("Erro ao enviar agendamento:", erro));
  };

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <style>{`
        .rdp-day_today button,
        .rdp-day_today,
        .rdp-day_selected,
        [aria-selected="true"] button,
        .rdp-day_button[aria-selected="true"],
        .rdp-day_button:focus,
        .rdp-day_button:active {
          background-color: #1e3a8a !important; 
          color: #ffffff !important; 
          font-weight: bold !important;
          border-radius: 6px !important;
          opacity: 1 !important;
        }
      `}</style>

      <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <a href="/" aria-label="Wilson Sons — Início" className="flex items-center">
            <img
              src="/logo-wilson-sons.png"
              alt="Wilson Sons"
              width={150}
              height={36}
              className="h-8 w-auto sm:h-9 object-fill border-0"
            />
          </a>
          <a
            href="#admin"
            className="rounded-md px-3 py-1.5 text-xs font-semibold text-primary bg-transparent transition-colors duration-200 hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent sm:text-sm"
          >
            Área do Administrador
          </a>
        </div>
      </header>

      <main id="main">
        <section className="relative isolate overflow-hidden">
          <img
            src={heroPort}
            alt="Operação portuária com rebocador azul e laranja"
            width={1920}
            height={1080}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10 bg-linear-to-br from-primary/85 via-primary/75 to-primary/60" />
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-28">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" /> Segurança Operacional
            </p>
            <h1 className="mt-4 max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Agendamento de Visitas Operacionais — Wilson Sons
            </h1>
            <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-base">
              Solicite, agende e prepare sua visita aos nossos terminais e estaleiros com
              eficiência, conformidade e total aderência aos protocolos de segurança da Wilson Sons.
            </p>
          </div>
        </section>

        <section className="bg-(--surface) py-10 sm:py-14">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="rounded-md border border-border bg-card shadow-sm">
              <div className="border-b border-border p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-primary sm:text-lg">
                    {step === 1 && "Passo 1 — Identificação"}
                    {step === 2 && "Passo 2 — Agendamento Inteligente"}
                    {step === 3 && "Passo 3 — Imersão e Quiz de Segurança"}
                  </h2>
                  <span className="text-xs font-medium text-muted-foreground">{step}/3</span>
                </div>
                <Progress
                  value={progress}
                  className="mt-3 h-1.5 [&>div]:bg-accent"
                  aria-label="Progresso do agendamento"
                />
                <ol className="mt-4 flex items-center gap-2 text-xs sm:text-sm">
                  {["Identificação", "Agendamento", "Segurança"].map((label, i) => {
                    const n = i + 1;
                    const active = n === step;
                    const done = n < step;
                    return (
                      <li key={label} className="flex items-center gap-2">
                        <span
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold",
                            done && "border-accent bg-accent text-accent-foreground",
                            active && "border-primary bg-primary text-primary-foreground",
                            !active && !done && "border-border bg-white text-muted-foreground",
                          )}
                          aria-current={active ? "step" : undefined}
                        >
                          {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
                        </span>
                        <span
                          className={cn(
                            "hidden sm:inline",
                            active ? "font-medium text-primary" : "text-muted-foreground",
                          )}
                        >
                          {label}
                        </span>
                        {n < 3 && <ChevronRight className="h-3.5 w-3.5 text-border" />}
                      </li>
                    );
                  })}
                </ol>
              </div>

              <div className="p-5 sm:p-6">
                {step === 1 && (
                  <div className="grid gap-4">
                    <Field label="Nome completo" htmlFor="name">
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex.: Maria da Silva"
                      />
                    </Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label={docType === "cpf" ? "CPF" : "Identidade"} htmlFor="doc">
                        <RadioGroup
                          value={docType}
                          onValueChange={(v) => {
                            setDocType(v as "cpf" | "cin");
                            setDoc("");
                          }}
                          className="mb-2 flex gap-4"
                        >
                          <div className="flex items-center gap-2">
                            <RadioGroupItem id="doc-cpf" value="cpf" />
                            <Label htmlFor="doc-cpf" className="text-sm font-normal">
                              CPF
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem id="doc-cin" value="cin" />
                            <Label htmlFor="doc-cin" className="text-sm font-normal">
                              Identidade
                            </Label>
                          </div>
                        </RadioGroup>
                        <Input
                          id="doc"
                          inputMode="numeric"
                          value={doc}
                          onChange={(e) => setDoc(formatDoc(e.target.value))}
                          maxLength={14}
                          placeholder={docType === "cpf" ? "000.000.000-00" : "Ex: 12.345.678-9"}
                          aria-label={docType === "cpf" ? "CPF" : "Identidade"}
                        />
                      </Field>
                      <Field label="Empresa / Instituição" htmlFor="company">
                        <Input
                          id="company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          placeholder="Ex.: KODIE Academy"
                        />
                      </Field>
                    </div>
                    <Field label="E-mail" htmlFor="email">
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nome@exemplo.com"
                        className={cn(
                          email.trim() !== "" &&
                            !isEmailValid &&
                            "border-destructive text-destructive focus-visible:ring-destructive",
                        )}
                      />
                      {email.trim() !== "" && !isEmailValid && (
                        <p className="text-xs font-medium text-destructive mt-1">
                          Por favor, insira um format de e-mail válido (ex: nome@dominio.com).
                        </p>
                      )}
                    </Field>

                    <Field label="Host (Acompanhante da Wilson Sons) *" htmlFor="host">
                      <Select value={host} onValueChange={setHost}>
                        <SelectTrigger id="host" aria-required="true">
                          <SelectValue placeholder="Selecione um host responsável" />
                        </SelectTrigger>
                        <SelectContent>
                          {hosts.map((h) => (
                            <SelectItem key={h.id} value={h.id}>
                              {hostDisplay(h)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>

                    <div>
                      <Label className="mb-2 block text-sm font-medium text-primary">
                        Tipo de visita
                      </Label>
                      <RadioGroup
                        value={visitType}
                        onValueChange={(v) => setVisitType(v as "individual" | "grupo")}
                        className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                      >
                        <VisitTypeOption
                          value="individual"
                          selected={visitType === "individual"}
                          icon={<UserIcon className="h-4 w-4" />}
                          label="Individual"
                        />
                        <VisitTypeOption
                          value="grupo"
                          selected={visitType === "grupo"}
                          icon={<Users className="h-4 w-4" />}
                          label="Em grupo / Excursão"
                        />
                      </RadioGroup>
                    </div>

                    <Field label="Motivo da Visita *" htmlFor="reason">
                      <Select value={visitReason} onValueChange={setVisitReason}>
                        <SelectTrigger id="reason" aria-required="true">
                          <SelectValue placeholder="Selecione o motivo da sua visita" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Reunião de Negócios / Comercial">
                            Reunião de Negócios / Comercial
                          </SelectItem>
                          <SelectItem value="Prestação de Serviço / Manutenção">
                            Prestação de Serviço / Manutenção
                          </SelectItem>
                          <SelectItem value="Auditoria / Inspeção Fiscal">
                            Auditoria / Inspeção Fiscal
                          </SelectItem>
                          <SelectItem value="Treinamento / Integração">
                            Treinamento / Integração
                          </SelectItem>
                          <SelectItem value="Visita Educativa / Institucional">
                            Visita Educativa / Institucional
                          </SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>

                    {visitType === "grupo" && (
                      <div className="grid gap-4 rounded-md border border-dashed border-accent/50 bg-accent/5 p-4 sm:grid-cols-2">
                        <Field label="Quantidade de pessoas" htmlFor="qty">
                          <Input
                            id="qty"
                            type="number"
                            min={2}
                            value={groupSize}
                            onChange={(e) => setGroupSize(e.target.value)}
                            placeholder="Ex.: 12"
                          />
                        </Field>
                        <Field label="Lista de participantes (PDF/CSV)" htmlFor="file">
                          <label
                            htmlFor="file"
                            className="border-input hover:border-accent flex h-10 cursor-pointer items-center gap-2 rounded-md border bg-white px-3 text-sm text-muted-foreground transition focus-within:ring-2 focus-within:ring-accent"
                          >
                            <Upload className="h-4 w-4" />
                            <span className="truncate">{fileData?.name || "Anexar arquivo"}</span>
                            <input
                              id="file"
                              type="file"
                              accept=".pdf,.csv,.xlsx"
                              className="sr-only"
                              onChange={handleFileChange}
                            />
                          </label>
                        </Field>
                      </div>
                    )}
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-4">
                    <p className="text-sm text-muted-foreground">
                      Datas disponíveis para{" "}
                      <span className="font-medium text-primary">
                        {hostDisplay(selectedHostObj) || "—"}
                      </span>
                      . Datas em cinza estão indisponíveis ou esgotadas.
                    </p>
                    <div className="flex justify-center rounded-md border border-border bg-white p-2">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        disabled={disabledDates}
                        locale={ptBR}
                        initialFocus
                        className="pointer-events-auto p-3"
                      />
                    </div>
                    {date && (
                      <div className="mt-4 flex items-start gap-4 rounded-md border border-primary/20 bg-primary/5 p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                          <CalendarDays className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-muted-foreground">Visita agendada para</div>
                          <div className="font-semibold text-primary">
                            {format(date, "PPP", { locale: ptBR })}
                          </div>
                          <div className="mt-6">
                            <Label className="mb-3 block font-semibold text-primary">
                              Selecione o Turno desejado
                            </Label>
                            <RadioGroup
                              value={turno}
                              onValueChange={(value) => setTurno(value)} // Atualiza o estado ao clicar
                              className="flex flex-row gap-6"
                            >
                              <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-slate-50">
                                <RadioGroupItem value="Manhã" id="r1" />
                                <Label htmlFor="r1" className="cursor-pointer">
                                  Manhã (07h30 – 12h00)
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2 border p-3 rounded-md cursor-pointer hover:bg-slate-50">
                                <RadioGroupItem value="Tarde" id="r2" />
                                <Label htmlFor="r2" className="cursor-pointer">
                                  Tarde (13h00 – 17h30)
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="grid gap-6">
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-primary">
                        Vídeo de imersão (obrigatório)
                      </Label>
                      <iframe
                        src="https://www.youtube.com/embed/kZGNypHb0nw"
                        title="Vídeo de Imersão do Estaleiro — Wilson Sons"
                        className="aspect-video w-full rounded-md shadow-sm"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>

                    <div className="grid gap-4">
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <HardHat className="h-4 w-4 text-accent" />
                        Quiz de Segurança Operacional
                      </h3>
                      {QUIZ.map((q, qi) => (
                        <fieldset key={qi} className="rounded-md border border-border bg-white p-4">
                          <legend className="px-1 text-sm font-medium text-primary">
                            {qi + 1}. {q.q}
                          </legend>
                          <RadioGroup
                            value={answers[qi]?.toString() ?? ""}
                            onValueChange={(v) =>
                              !submitted && setAnswers((a) => ({ ...a, [qi]: Number(v) }))
                            }
                            className="mt-3 grid gap-2"
                          >
                            {q.options.map((opt, oi) => {
                              const id = `q${qi}-o${oi}`;
                              const chosen = answers[qi] === oi;
                              const correct = chosen && oi === q.correct;
                              const wrong = chosen && oi !== q.correct;
                              return (
                                <Label
                                  key={id}
                                  htmlFor={id}
                                  className={cn(
                                    "flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 text-sm transition",
                                    "hover:border-accent focus-within:ring-2 focus-within:ring-accent",
                                    correct && "border-green-500 bg-green-50 text-green-900",
                                    wrong && "border-destructive bg-destructive/5",
                                  )}
                                >
                                  <RadioGroupItem
                                    id={id}
                                    value={oi.toString()}
                                    className="mt-0.5"
                                    disabled={submitted}
                                  />
                                  <span className="text-foreground">{opt}</span>
                                </Label>
                              );
                            })}
                          </RadioGroup>
                          {answers[qi] !== undefined && answers[qi] !== q.correct && (
                            <p className="mt-2 text-xs font-medium text-destructive">
                              Resposta incorreta — revise as regras de segurança.
                            </p>
                          )}
                        </fieldset>
                      ))}
                    </div>

                    <label
                      htmlFor="epi"
                      className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-white p-4 text-sm focus-within:ring-2 focus-within:ring-accent"
                    >
                      <Checkbox
                        id="epi"
                        checked={acceptEpi}
                        onCheckedChange={(v) => !submitted && setAcceptEpi(v === true)}
                        disabled={submitted}
                      />
                      <span className="text-foreground">
                        Declaro estar ciente e aceito os{" "}
                        <a
                          href="https://drive.google.com/file/d/1VtdbvaSwI_EhF-imyQea3Qi4ZfFvJylR/view?usp=sharing"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent font-bold underline"
                        >
                          Termos de uso de EPI
                        </a>{" "}
                        da Wilson Sons — capacete, botas de segurança e colete refletivo nas áreas
                        operacionais. É proibido o uso de regatas, shorts e calçados abertos.
                      </span>
                    </label>

                    {submitted && (
                      <div className="mx-auto mt-4 max-w-md rounded-lg border border-green-500/20 bg-green-50 p-6 text-center shadow-sm sm:p-8 animate-in fade-in zoom-in-95 duration-200">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                          <CheckCircle2 className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-primary">
                          Agendamento enviado com sucesso!
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                          Você receberá um e-mail de confirmação com o código de agendamento da
                          visita.
                        </p>
                        <div className="mt-4 inline-flex items-center gap-2 rounded-md border border-amber-200 bg-amber-100/50 px-3 py-2 text-left text-xs text-amber-800">
                          <span>
                            ⚠️ <strong>Aviso:</strong> Verifique também sua pasta de{" "}
                            <strong>Spam / Lixo Eletrônico</strong>.
                          </span>
                        </div>
                        <Button
                          type="button"
                          onClick={handleResetForm}
                          className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm text-primary-foreground hover:bg-primary/90"
                        >
                          <RefreshCw className="h-4 w-4" /> Realizar Novo Agendamento
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-border bg-(--surface) flex flex-col-reverse gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep((s) => Math.max(1, s - 1))}
                  disabled={step === 1 || submitted}
                  className="text-primary hover:bg-primary/20 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" /> Voltar
                </Button>

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    Continuar <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    aria-disabled={!canSubmit}
                    className={cn(
                      "focus-visible:ring-2 focus-visible:ring-accent",
                      canSubmit
                        ? "bg-accent text-accent-foreground hover:bg-accent/90"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {submitted ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> Agendamento Finalizado
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4 mr-2" /> Finalizar Agendamento
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoTile
                icon={<ShieldCheck className="h-4 w-4" />}
                title="Conformidade"
                desc="Aderente aos protocolos NR-12 e NR-29."
              />
              <InfoTile
                icon={<CalendarDays className="h-4 w-4" />}
                title="Agenda integrada"
                desc="Sincronizada com a disponibilidade do host."
              />
              <InfoTile
                icon={<HardHat className="h-4 w-4" />}
                title="Segurança em 1º profissional"
                desc="Quiz obrigatório antes da liberação."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#002147] py-6 text-center text-xs text-white sm:text-sm">
        <div className="mx-auto flex max-w-sm flex-col items-center justify-center gap-2 px-4">
          <Ship className="h-15 w-10 text-accent animate-pulse" aria-hidden="true" />
          <p className="tracking-wide">Projeto desenvolvido para fins educativos</p>
          <p className="tracking-wide">Nome da Aluna: Jakeline Melo</p>
          <p className="text-white/60 text-[11px] sm:text-xs">
            &copy; 2026 Wilson Sons. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-primary">
        {label}
      </Label>
      {children}
    </div>
  );
}

function VisitTypeOption({
  value,
  selected,
  icon,
  label,
}: {
  value: string;
  selected: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  const id = `vt-${value}`;
  return (
    <Label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition focus-within:ring-2 focus-within:ring-accent",
        selected
          ? "border-accent bg-accent/10 text-primary"
          : "border-border hover:border-accent/60",
      )}
    >
      <RadioGroupItem id={id} value={value} className="sr-only" />
      <span className="flex items-center gap-2 font-medium">
        {icon}
        {label}
      </span>
    </Label>
  );
}

function InfoTile({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="rounded-md border border-border bg-white p-4">
      <div className="flex items-center gap-2 text-primary">
        <span className="text-accent">{icon}</span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
