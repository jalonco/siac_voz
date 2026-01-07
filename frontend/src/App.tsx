import { useState, useEffect } from 'react';
import axios from 'axios';
import { Phone, Loader2, PhoneCall, Mic, Activity, BarChart3, History, DollarSign, Timer, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import clsx from 'clsx';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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

function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'calling' | 'connected' | 'error'>('idle');
  // Removed unused callSid
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'dialer' | 'analytics' | 'config'>('dialer');

  // Analytics State
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loadingCalls, setLoadingCalls] = useState(false);

  // Config State
  const [config, setConfig] = useState({ system_prompt: '', voice_id: 'Charon' });
  const [availableVoices, setAvailableVoices] = useState<string[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);

  // Fetch calls on mount and when tab changes to analytics
  useEffect(() => {
    if (activeTab === 'analytics') {
      fetchCalls();
    } else if (activeTab === 'config') {
      fetchConfig();
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

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_URL}/agent-config`);
      setConfig(res.data.config);
      setAvailableVoices(res.data.available_voices);
    } catch (err) {
      console.error("Failed to fetch config", err);
    }
  }

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await axios.post(`${API_URL}/agent-config`, config);
      alert('Configuration saved!');
    } catch (err) {
      console.error("Failed to save config", err);
      alert('Failed to save configuration.');
    } finally {
      setSavingConfig(false);
    }
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
        to_number: formattedNumber
      });

      // We don't use callSid in UI currently, so just ignore response data
      setStatus('connected');

      setTimeout(() => {
        setStatus('idle');
        if (activeTab === 'analytics') fetchCalls(); // Refresh log if visible
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || 'Failed to initiate call');
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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black text-white font-sans overflow-x-hidden">

      {/* Background Ambience */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 rounded-[100%] blur-[100px] pointer-events-none" />

      {/* Navbar */}
      <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">SIAC Voice</span>
          </div>

          <div className="flex bg-slate-800/50 rounded-lg p-1 border border-white/5">
            <button
              onClick={() => setActiveTab('dialer')}
              className={clsx(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === 'dialer' ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
              )}
            >
              Dialer
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={clsx(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === 'analytics' ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
              )}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('config')}
              className={clsx(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === 'config' ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-white"
              )}
            >
              Config
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 py-8 relative z-10">

        {activeTab === 'dialer' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="max-w-md w-full glass-panel rounded-3xl p-8 border border-slate-700/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-50">
                <div className="w-24 h-24 bg-cyan-500/20 rounded-full blur-3xl" />
              </div>

              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Make a Call
                </h1>
                <p className="text-slate-500 mt-2">Enter phone number to start AI conversation</p>
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
                      <span>Connecting...</span>
                    </>
                  ) : status === 'connected' ? (
                    <>
                      <PhoneCall className="w-5 h-5 animate-pulse" />
                      <span>Calling...</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Initiate Call</span>
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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Call Performance</h2>
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
                    <p className="text-slate-400 text-sm font-medium">Total Calls</p>
                    <h3 className="text-2xl font-bold">{totalCalls}</h3>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400">
                    <Timer className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Total Duration</p>
                    <h3 className="text-2xl font-bold">{Math.floor(totalDuration / 60)}m {totalDuration % 60}s</h3>
                  </div>
                </div>
              </div>

              <div className="glass-panel p-6 rounded-2xl border border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm font-medium">Est. Cost</p>
                    <h3 className="text-2xl font-bold">${totalCost.toFixed(4)}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart */}
              <div className="glass-panel p-6 rounded-2xl border border-slate-700/50 lg:col-span-1">
                <h3 className="font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  Call Status
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
              <div className="glass-panel p-0 rounded-2xl border border-slate-700/50 lg:col-span-2 overflow-hidden">
                <div className="p-6 border-b border-white/5">
                  <h3 className="font-semibold">Recent Logs</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-400">
                    <thead className="bg-slate-900/50 text-slate-200 uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">To/From</th>
                        <th className="px-6 py-4 font-medium">Duration</th>
                        <th className="px-6 py-4 font-medium text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {calls.map((call) => (
                        <tr key={call.sid} className="hover:bg-white/5 transition-colors">
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
                              <span className="text-white flex items-center gap-1">
                                {call.direction === 'outbound-api' ? <ArrowUpRight className="w-3 h-3 text-blue-400" /> : <ArrowDownLeft className="w-3 h-3 text-emerald-400" />}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'config' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="max-w-2xl w-full glass-panel rounded-3xl p-8 border border-slate-700/50 relative">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  Agent Configuration
                </h1>
                <p className="text-slate-500 mt-2">Customize the AI Persona and Voice</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">Voice Model</label>
                  <select
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500"
                    value={config.voice_id}
                    onChange={(e) => setConfig({ ...config, voice_id: e.target.value })}
                  >
                    {availableVoices.map(voice => (
                      <option key={voice} value={voice}>{voice}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">System Prompt</label>
                  <textarea
                    className="w-full h-64 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-cyan-500 font-mono text-sm"
                    value={config.system_prompt}
                    onChange={(e) => setConfig({ ...config, system_prompt: e.target.value })}
                  />
                </div>

                <button
                  onClick={saveConfig}
                  disabled={savingConfig}
                  className="w-full btn-primary h-12 flex items-center justify-center gap-2"
                >
                  {savingConfig ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>Save Configuration</span>}
                </button>

              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
