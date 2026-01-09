import { useState, useEffect } from 'react';
import axios from 'axios';
import { Phone, Loader2, PhoneCall, Mic, Activity, BarChart3, History, DollarSign, Timer, ArrowUpRight, ArrowDownLeft, Play, User, Globe, Users, Plus, Trash2, ArrowLeft, FileText } from 'lucide-react';
import clsx from 'clsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs/components/prism-core';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/themes/prism-dark.css'; // Or custom style
import { Toaster, toast } from 'sonner';
import { ThemeToggle } from './components/ThemeToggle';
import { AudioPlayer } from './components/AudioPlayer';
import { TranscriptionView } from './components/TranscriptionView';

// Custom highlighter for variables
const highlightWithVariables = (code: string) => {
  return highlight(code, languages.js, 'javascript')
    .replace(
      /{{(.*?)}}/g,
      '<span style="color: #22d3ee; font-weight: bold; background: rgba(34, 211, 238, 0.1); border-radius: 4px; padding: 0 4px;">{{$1}}</span>'
    );
};

// If deployed on same domain, relative path works. If dev, standard vite proxy or hardcoded.
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:8765';

interface CallLog {
  sid: string;
  status: string;
  duration: string | null;
  start_time: string | null;
  direction: string;
  from: string;
  to: string;
  price: string | null;
  price_unit: string | null;
}

interface VariableDef {
  key: string;
  description: string;
  example: string;
}

interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  voice_id: string;
  language: string;
  variables: VariableDef[];
}

function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'calling' | 'connected' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'dialer' | 'analytics' | 'config'>('dialer');

  // Analytics State
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [transcription, setTranscription] = useState<any[]>([]);
  const [loadingTranscription, setLoadingTranscription] = useState(false);

  // Agents State
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null); // For Config
  const [dialerAgentId, setDialerAgentId] = useState<string | null>(null); // For Dialer

  // Computed selected agent for config
  const selectedAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  const [availableVoices, setAvailableVoices] = useState<Voice[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);

  // Call Variables State
  const [variableInputs, setVariableInputs] = useState<Record<string, string>>({});

  interface Voice {
    id: string;
    name: string;
    gender: string;
    description: string;
    preview_url?: string;
  }
  interface Language {
    code: string;
    name: string;
  }



  // Fetch calls on mount and when tab changes to analytics
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchCalls();
    } else {
      // Always fetch agents to ensure dialer has list
      fetchAgents();
    }
  }, [activeTab]);

  const fetchCalls = async () => {
    setLoadingCalls(true);
    try {
      const res = await axios.get(`${API_URL}/calls?limit=50`);
      setCalls(res.data.calls);
    } catch (err) {
      console.error("Failed to fetch calls", err);
    } finally {
      setLoadingCalls(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await axios.get(`${API_URL}/agents`);

      const agentsList = res.data.agents;
      setAgents(agentsList);
      setAvailableVoices(res.data.available_voices);
      setAvailableLanguages(res.data.available_languages);

      // Set defaults if not set
      if (agentsList.length > 0) {
        if (!selectedAgentId) setSelectedAgentId(agentsList[0].id);
        if (!dialerAgentId) setDialerAgentId(agentsList[0].id);
      }
    } catch (err) {
      console.error("Failed to load agents", err);
    }
  };

  const saveSelectedAgent = async () => {
    if (!selectedAgent) return;
    setSavingConfig(true);
    try {
      const res = await axios.put(`${API_URL}/agents/${selectedAgent.id}`, selectedAgent);
      // Update local list
      setAgents(agents.map(a => a.id === selectedAgent.id ? res.data.agent : a));
      toast.success('¡Agente guardado correctamente!');
    } catch (err) {
      console.error("Failed to save agent", err);
      toast.error('Error al guardar agente.');
    } finally {
      setSavingConfig(false);
    }
  };

  const createAgent = async () => {
    const newName = prompt("Nombre del nuevo agente:");
    if (!newName) return;

    try {
      const res = await axios.post(`${API_URL}/agents`, {
        id: "new",
        name: newName,
        system_prompt: "Eres un asistente útil...",
        voice_id: "Zephyr",
        language: "es-US",
        variables: []
      });
      const newAgent = res.data.agent;
      setAgents([...agents, newAgent]);
      setSelectedAgentId(newAgent.id);
      toast.success('Agente creado correctamente');
    } catch (err) {
      console.error("Error creating agent", err);
      toast.error("Error al crear agente");
    }
  }

  const deleteAgent = async () => {
    if (!selectedAgent || selectedAgent.id === 'default') {
      alert("No se puede eliminar el agente por defecto.");
      return;
    }
    if (!confirm(`¿Eliminar agente "${selectedAgent.name}"?`)) return;

    try {
      await axios.delete(`${API_URL}/agents/${selectedAgent.id}`);
      const newAgents = agents.filter(a => a.id !== selectedAgent.id);
      setAgents(newAgents);
      setSelectedAgentId(newAgents[0]?.id || null);
      toast.success('Agente eliminado correctamente');
    } catch (err) {
      console.error("Error deleting agent", err);
      toast.error("Error al eliminar agente");
    }
  }

  const fetchTranscription = async (callSid: string) => {
    setLoadingTranscription(true);
    setTranscription([]);
    try {
      const res = await axios.get(`${API_URL}/calls/${callSid}/transcription`);
      setTranscription(res.data);
    } catch (err) {
      console.error("Failed to fetch transcription", err);
    } finally {
      setLoadingTranscription(false);
    }
  };

  const handleViewCall = (call: CallLog) => {
    setSelectedCall(call);
    fetchTranscription(call.sid);
  };

  const handleCall = async () => {
    if (!phoneNumber) return;
    setStatus('calling');
    setErrorMsg('');

    try {
      let formattedNumber = phoneNumber.trim();
      if (!formattedNumber.startsWith('+')) {
        if (formattedNumber.length === 10) formattedNumber = `+57${formattedNumber}`;
      }

      await axios.post(`${API_URL}/call`, {
        to_number: formattedNumber,
        variables: variableInputs,
        agent_id: dialerAgentId
      });

      // We don't use callSid in UI currently, so just ignore response data
      setStatus('connected');
      toast.success(`Llamando a ${formattedNumber}...`);

      setTimeout(() => {
        setStatus('idle');
        if (activeTab === 'analytics') fetchCalls(); // Refresh log if visible
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      const msg = err.response?.data?.detail || 'Error al iniciar llamada';
      toast.error(msg);
      setErrorMsg(msg);
    }
  };

  // Metrics Calculation
  const totalCalls = calls.length;
  // duration is string "s" sometimes or null. carefully parse.
  // Actually Twilio duration is usually seconds as string or int.
  const totalDuration = calls.reduce((acc, curr) => acc + (parseInt(curr.duration || '0') || 0), 0);
  const totalCost = calls.reduce((acc, curr) => acc + (parseFloat(curr.price || '0') || 0), 0);

  // Chart Data: Status Distribution
  const statusData = calls.reduce((acc: any, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});
  const chartData = Object.keys(statusData).map(key => ({ name: key, value: statusData[key] }));

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-slate-900 dark:via-[#0f172a] dark:to-black text-slate-900 dark:text-white font-sans overflow-x-hidden transition-colors duration-300">
      <Toaster richColors position="top-right" theme="dark" />

      {/* Background Ambience */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 rounded-[100%] blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="border-b border-slate-200 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-50 transition-colors duration-300">
        <div className="max-w-[90rem] mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">SIAC Voz</span>
          </div>

          <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5">
            <button
              onClick={() => setActiveTab('dialer')}
              className={clsx(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === 'dialer'
                  ? "bg-slate-700 text-white shadow-sm dark:bg-slate-700"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              Marcador
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={clsx(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === 'analytics'
                  ? "bg-slate-700 text-white shadow-sm dark:bg-slate-700"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              Analíticas
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={clsx(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === 'config'
                  ? "bg-slate-700 text-white shadow-sm dark:bg-slate-700"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              )}
            >
              Configuración
            </button>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            {/* Existing right-side actions if any, or just end of navbar */}
          </div>
        </div>
      </nav>

      <main className="max-w-[90rem] mx-auto px-4 py-8 relative z-10">

        {activeTab === 'dialer' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-slate-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <div className="w-24 h-24 bg-cyan-500/20 rounded-full blur-3xl" />
              </div>

              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Realizar Llamada
                </h1>
                <p className="text-slate-500 mt-2">Selecciona un agente y marca</p>
              </div>

              {/* Agent Selector */}
              <div className="mb-6 relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Users className="w-5 h-5 text-slate-500" />
                </div>
                <select
                  className="input-field pl-12 appearance-none cursor-pointer hover:border-cyan-500/50 transition-colors"
                  value={dialerAgentId || ''}
                  onChange={(e) => setDialerAgentId(e.target.value)}
                >
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                  <span className="text-slate-500 text-xs">▼</span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <Phone className="w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+57 300 123 4567"
                    className="input-field pl-12 text-center"
                    disabled={status === 'calling'}
                  />
                </div>

                {/* Dynamic Variable Inputs */}
                {(() => {
                  const currentDialerAgent = agents.find(a => a.id === dialerAgentId);
                  return (
                    currentDialerAgent && currentDialerAgent.variables && currentDialerAgent.variables.length > 0 && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="text-sm font-medium text-slate-400">Variables para {currentDialerAgent.name}</div>
                        {currentDialerAgent.variables.map((v) => (
                          <div key={v.key} className="relative group">
                            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                              <Activity className="w-5 h-5 text-slate-500" />
                            </div>
                            <label className="block text-xs text-slate-500 mb-1 ml-1 pl-12">{v.description} ({v.key})</label>
                            <input
                              type="text"
                              value={variableInputs[v.key] || ''}
                              onChange={(e) => setVariableInputs({ ...variableInputs, [v.key]: e.target.value })}
                              placeholder={v.example}
                              className="input-field pl-12"
                              disabled={status === 'calling'}
                            />
                          </div>
                        ))}
                      </div>
                    )
                  );
                })()}

                <button
                  onClick={handleCall}
                  disabled={status === 'calling' || !phoneNumber}
                  className={clsx(
                    "w-full btn-primary flex items-center justify-center gap-3 group relative overflow-hidden h-14",
                    status === 'error' && "bg-gradient-to-r from-red-600 to-red-500 border-red-500"
                  )}
                >
                  {status === 'calling' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Conectando...</span>
                    </>
                  ) : status === 'connected' ? (
                    <>
                      <PhoneCall className="w-5 h-5 animate-pulse" />
                      <span>Llamando...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Iniciar Llamada</span>
                    </>
                  )}
                </button>

                {status === 'error' && (
                  <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {errorMsg}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {selectedCall ? (
              <div className="space-y-6">
                <button
                  onClick={() => setSelectedCall(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Volver al listado
                </button>

                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-3">
                      <span className={clsx(
                        "px-3 py-1 rounded-full text-sm font-medium border",
                        selectedCall.direction === 'outbound-api'
                          ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                          : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                      )}>
                        {selectedCall.direction === 'outbound-api' ? 'Saliente' : 'Entrante'}
                      </span>
                      <span>{selectedCall.to}</span>
                    </h2>
                    <p className="text-slate-500 mt-1 flex items-center gap-2">
                      <History className="w-3 h-3" />
                      {selectedCall.start_time ? new Date(selectedCall.start_time).toLocaleString() : 'Fecha desconocida'}
                    </p>
                  </div>
                </div>

                <AudioPlayer url={`${API_URL}/calls/${selectedCall.sid}/recording`} />

                {loadingTranscription ? (
                  <div className="p-12 flex justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                  </div>
                ) : (
                  <TranscriptionView entries={transcription} startTime={selectedCall.start_time || undefined} />
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Rendimiento de Llamadas</h2>
                  <button onClick={fetchCalls} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
                    <History className={clsx("w-5 h-5 text-slate-400", loadingCalls && "animate-spin")} />
                  </button>
                </div>

                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                        <PhoneCall className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Total Llamadas</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{totalCalls}</h3>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                        <Timer className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Duración Total</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{Math.floor(totalDuration / 60)}m {totalDuration % 60}s</h3>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                        <DollarSign className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Costo Estimado</p>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white">${totalCost.toFixed(4)}</h3>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart */}
                  <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 lg:col-span-1">
                    <h3 className="font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-white">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      Estado de Llamada
                    </h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {chartData.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#ef4444', '#f59e0b'][index % 4]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Table */}
                  <div className="glass-panel p-0 rounded-2xl border border-slate-300 shadow-sm dark:border-slate-700/50 dark:shadow-none lg:col-span-2 overflow-hidden transition-colors">
                    <div className="p-6 border-b border-slate-300 dark:border-white/5 bg-slate-100/50 dark:bg-transparent">
                      <h3 className="font-semibold text-slate-900 dark:text-white">Registros Recientes</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                        <thead className="bg-slate-200/60 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 uppercase tracking-wider text-xs border-b border-slate-300 dark:border-white/5">
                          <tr>
                            <th className="px-6 py-4 font-medium">Estado</th>
                            <th className="px-6 py-4 font-medium">Fecha</th>
                            <th className="px-6 py-4 font-medium">A/De</th>
                            <th className="px-6 py-4 font-medium">Duración</th>
                            <th className="px-6 py-4 font-medium text-right">Costo</th>
                            <th className="px-6 py-4 font-medium text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                          {calls.map((call) => (
                            <tr key={call.sid} className="hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4">
                                <span className={clsx(
                                  "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize",
                                  call.status === 'completed' ? "bg-emerald-500/10 text-emerald-400" :
                                    call.status === 'failed' || call.status === 'busy' ? "bg-red-500/10 text-red-400" :
                                      "bg-blue-500/10 text-blue-400"
                                )}>
                                  {call.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {call.start_time ? new Date(call.start_time).toLocaleString() : '-'}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-slate-900 dark:text-white flex items-center gap-1">
                                    {call.direction === 'outbound-api' ? <ArrowUpRight className="w-3 h-3 text-blue-500 dark:text-blue-400" /> : <ArrowDownLeft className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />}
                                    {call.to}
                                  </span>
                                  <span className="text-xs opacity-50">{call.from}</span>
                                </div>
                              </td>
                              <td className="px-6 py-4 font-mono">
                                {call.duration}s
                              </td>
                              <td className="px-6 py-4 text-right font-mono">
                                {call.price ? `$${Math.abs(parseFloat(call.price)).toFixed(4)}` : '-'}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => handleViewCall(call)}
                                  className="p-2 hover:bg-slate-700/50 rounded-lg text-cyan-400 hover:text-cyan-300 transition-colors"
                                  title="Ver detalles y grabación"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="flex min-h-[70vh] gap-6 max-w-7xl mx-auto w-full">
            {/* Sidebar: Agent List */}
            <div className="w-64 flex-shrink-0 flex flex-col gap-4">
              <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex flex-col h-full opacity-90 transition-colors duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-slate-700 dark:text-slate-200">Mis Agentes</h2>
                  <button onClick={createAgent} className="p-1.5 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {agents.map(agent => (
                    <div
                      key={agent.id}
                      onClick={() => setSelectedAgentId(agent.id)}
                      className={clsx(
                        "p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3",
                        selectedAgentId === agent.id
                          ? "bg-cyan-500/10 border-cyan-500/50 shadow-sm shadow-cyan-900/20"
                          : "bg-white border-slate-200 hover:bg-slate-50 dark:bg-slate-800/30 dark:border-transparent dark:hover:bg-slate-800"
                      )}
                    >
                      <div className={clsx(
                        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                        selectedAgentId === agent.id ? "bg-cyan-500 text-white" : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                      )}>
                        {agent.name.charAt(0)}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className={clsx("text-sm font-medium truncate", selectedAgentId === agent.id ? "text-cyan-600 dark:text-cyan-100" : "text-slate-700 dark:text-slate-400")}>{agent.name}</h4>
                        <p className="text-[10px] text-slate-500 truncate">{agent.id === 'default' ? 'Principal' : 'Agente Personal'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Panel: Editor */}
            <div className="flex-1">
              {selectedAgent ? (
                <div className="glass-panel rounded-3xl p-8 border border-slate-700/50 relative animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                        Editar: {selectedAgent.name}
                      </h1>
                      <p className="text-slate-500 mt-1">Personaliza la Persona y Voz</p>
                    </div>
                    {selectedAgent.id !== 'default' && (
                      <button onClick={deleteAgent} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20 transition-colors text-sm">
                        <Trash2 className="w-4 h-4" /> Eliminar Agente
                      </button>
                    )}
                  </div>

                  {/* Agent Name Input */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Nombre del Agente</label>
                    <div className="flex gap-2">
                      <input
                        value={selectedAgent.name}
                        onChange={(e) => {
                          // Update local state immediately for responsiveness
                          const updated = { ...selectedAgent, name: e.target.value };
                          setAgents(agents.map(a => a.id === selectedAgent.id ? updated : a));
                        }}
                        className="input-field max-w-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    {/* Language Selector */}
                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Idioma del Agente
                        Idioma del Agente
                      </label>
                      <select
                        className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500 transition-colors"
                        value={selectedAgent.language || 'es-US'}
                        onChange={(e) => {
                          const updated = { ...selectedAgent, language: e.target.value };
                          setAgents(agents.map(a => a.id === selectedAgent.id ? updated : a));
                        }}
                      >
                        {availableLanguages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Modelo de Voz ({availableVoices.length})
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {availableVoices.map((voice) => (
                          <div
                            key={voice.id}
                            onClick={() => {
                              const updated = { ...selectedAgent, voice_id: voice.id };
                              setAgents(agents.map(a => a.id === selectedAgent.id ? updated : a));
                            }}
                            className={clsx(
                              "relative p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02]",
                              selectedAgent.voice_id === voice.id
                                ? "bg-cyan-500/10 border-cyan-500 ring-1 ring-cyan-500/50"
                                : "bg-white border-slate-200 hover:border-slate-400 dark:bg-slate-900/50 dark:border-slate-700 dark:hover:border-slate-500"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={clsx(
                                  "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                                  selectedAgent.voice_id === voice.id
                                    ? "bg-cyan-500/20 text-cyan-400"
                                    : voice.gender === 'Female'
                                      ? "bg-pink-500/10 text-pink-400"
                                      : "bg-blue-500/10 text-blue-400"
                                )}>
                                  <User className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className={clsx("font-medium", selectedAgent.voice_id === voice.id ? "text-cyan-600 dark:text-cyan-400" : "text-slate-900 dark:text-white")}>
                                    {voice.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className={clsx(
                                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
                                      voice.gender === 'Female'
                                        ? "bg-pink-500/20 text-pink-300"
                                        : "bg-blue-500/20 text-blue-300"
                                    )}>
                                      {voice.gender === 'Female' ? 'Mujer' : 'Hombre'}
                                    </span>
                                    <span className="text-xs text-slate-500">• {voice.description}</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Play audio preview
                                  if (playingVoice === voice.id) {
                                    setPlayingVoice(null); // Stop if clicking same
                                  } else {
                                    setPlayingVoice(voice.id);
                                    const audio = new Audio(`${API_URL}${voice.preview_url}`);
                                    audio.play().catch(err => {
                                      console.error("Audio playback error:", err);
                                      setPlayingVoice(null);
                                    });
                                    audio.onended = () => setPlayingVoice(null);
                                  }
                                }}
                                className={clsx(
                                  "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                  playingVoice === voice.id
                                    ? "bg-cyan-500 text-white animate-pulse"
                                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                                )}
                                title="Escuchar previa"
                              >
                                {playingVoice === voice.id ? (
                                  <div className="w-3 h-3 bg-white rounded-sm" /> // Stop icon approximation
                                ) : (
                                  <Play className="w-3 h-3 fill-current" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">System Prompt</label>
                      <div className="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden focus-within:border-cyan-500 transition-colors shadow-inner">
                        <Editor
                          value={selectedAgent.system_prompt}
                          onValueChange={code => {
                            const updated = { ...selectedAgent, system_prompt: code };
                            setAgents(agents.map(a => a.id === selectedAgent.id ? updated : a));
                          }}
                          highlight={highlightWithVariables}
                          padding={16}
                          className="font-mono text-sm leading-6 dark:text-slate-200"
                          style={{
                            fontFamily: '"Fira code", "Fira Mono", monospace',
                            fontSize: 14,
                            minHeight: '300px',
                            backgroundColor: 'transparent',
                            color: '#f8fafc',
                            lineHeight: '1.5' // Ensure consistent line height
                          }}
                          textareaClassName="focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Variables Configuration */}
                    <div className="space-y-4 border-t border-slate-700 pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          <label className="block text-sm font-medium text-slate-600 dark:text-slate-400">Variables Dinámicas</label>
                          <span className="text-xs text-slate-500">Define datos que cambian por llamada (ej. nombre, deuda)</span>
                        </div>
                        <button
                          onClick={() => {
                            const updated = { ...selectedAgent, variables: [...(selectedAgent.variables || []), { key: '', description: '', example: '' }] };
                            setAgents(agents.map(a => a.id === selectedAgent.id ? updated : a));
                          }}
                          className="text-xs bg-white hover:bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 px-3 py-1.5 rounded-md transition-colors text-cyan-600 dark:text-cyan-400 hover:border-cyan-400/50"
                        >
                          + Agregar Variable
                        </button>
                      </div>

                      {/* Dynamic Guide */}
                      <div className="bg-blue-500/5 border border-blue-500/10 rounded-lg p-3 text-xs text-slate-400 flex flex-col gap-2">
                        <div className="flex items-start gap-2">
                          <div className="p-1 bg-blue-500/10 rounded-full mt-0.5">
                            <Activity className="w-3 h-3 text-blue-400" />
                          </div>
                          <div>
                            <span className="font-semibold text-blue-600 dark:text-blue-300 block mb-1">Cómo usar variables:</span>
                            <ol className="list-decimal list-inside space-y-1 ml-1 text-slate-600 dark:text-slate-500">
                              <li>Define una variable abajo (ej. Clave: <span className="text-cyan-600 dark:text-cyan-400 font-mono">nombre</span>).</li>
                              <li>Copia la etiqueta <span className="inline-block px-1 bg-slate-800 rounded text-cyan-400 font-mono transform scale-90 text-[10px]">{`{{nombre}}`}</span>.</li>
                              <li>Pégala en tu <strong>System Prompt</strong> arriba donde quieras que aparezca el valor.</li>
                            </ol>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {selectedAgent.variables && selectedAgent.variables.map((variable, idx) => (
                          <div key={idx} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="flex-1 space-y-1">
                              <div className="flex gap-2">
                                <input
                                  placeholder="Clave (ej. nombre)"
                                  className="w-1/3 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none font-mono transition-colors"
                                  value={variable.key}
                                  onChange={(e) => {
                                    const newVars = [...selectedAgent.variables];
                                    newVars[idx].key = e.target.value.replace(/[^a-zA-Z0-9_]/g, ''); // Enforce safe keys
                                    const updated = { ...selectedAgent, variables: newVars };
                                    setAgents(agents.map(a => a.id === selectedAgent.id ? updated : a));
                                  }}
                                />
                                <input
                                  placeholder="Descripción (ej. Nombre Cliente)"
                                  className="flex-1 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                                  value={variable.description}
                                  onChange={(e) => {
                                    const newVars = [...selectedAgent.variables];
                                    newVars[idx].description = e.target.value;
                                    const updated = { ...selectedAgent, variables: newVars };
                                    setAgents(agents.map(a => a.id === selectedAgent.id ? updated : a));
                                  }}
                                />
                                <input
                                  placeholder="Ejemplo (ej. Juan)"
                                  className="flex-1 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-900 dark:text-white focus:border-cyan-500 outline-none transition-colors"
                                  value={variable.example}
                                  onChange={(e) => {
                                    const newVars = [...selectedAgent.variables];
                                    newVars[idx].example = e.target.value;
                                    const updated = { ...selectedAgent, variables: newVars };
                                    setAgents(agents.map(a => a.id === selectedAgent.id ? updated : a));
                                  }}
                                />
                                <button
                                  onClick={() => {
                                    const newVars = selectedAgent.variables.filter((_, i) => i !== idx);
                                    const updated = { ...selectedAgent, variables: newVars };
                                    setAgents(agents.map(a => a.id === selectedAgent.id ? updated : a));
                                  }}
                                  className="p-2 text-red-500 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                                  title="Remove Variable"
                                >
                                  <Activity className="w-4 h-4 rotate-45" />
                                </button>
                              </div>

                              {/* Injection Helper */}
                              {variable.key && (
                                <div className="flex items-center gap-2 pl-1">
                                  <span className="text-[10px] text-slate-600">Usar en prompt:</span>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(`{{${variable.key}}}`);
                                      // Optional: Show toast
                                    }}
                                    className="text-[10px] font-mono text-cyan-500 bg-cyan-950/30 px-1.5 py-0.5 rounded border border-cyan-900/50 hover:border-cyan-500/50 cursor-copy transition-all active:scale-95 flex items-center gap-1"
                                    title="Clic para copiar etiqueta"
                                  >
                                    {`{{${variable.key}}}`}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {(!selectedAgent.variables || selectedAgent.variables.length === 0) && (
                          <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/20">
                            <p className="text-sm text-slate-500">No hay variables personalizadas definidas aún.</p>
                            <p className="text-xs text-slate-500 dark:text-slate-600 mt-1">Agrega variables como "nombre" o "monto" para personalizar tu Agente.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={saveSelectedAgent}
                      disabled={savingConfig}
                      className="w-full btn-primary h-12 flex items-center justify-center gap-2"
                    >
                      {savingConfig ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Guardar Agente</span>}
                    </button>

                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500">
                  <p>Selecciona un agente para editar o crea uno nuevo.</p>
                </div>
              )}
            </div>
          </div>
        )
        }
      </main >
    </div >
  );
}

export default App;
