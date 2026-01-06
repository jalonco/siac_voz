import { useState } from 'react';
import axios from 'axios';
import { Phone, Loader2, PhoneCall, Mic, Activity, Clock } from 'lucide-react';
import clsx from 'clsx';

// If deployed on same domain, relative path works. If dev, standard vite proxy or hardcoded.
const API_URL = import.meta.env.PROD ? '' : 'http://localhost:8765';

function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [status, setStatus] = useState<'idle' | 'calling' | 'connected' | 'error'>('idle');
  const [callSid, setCallSid] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCall = async () => {
    if (!phoneNumber) return;
    setStatus('calling');
    setErrorMsg('');

    try {
      // Clean number
      let formattedNumber = phoneNumber.trim();
      if (!formattedNumber.startsWith('+')) {
        // Assume Colombia if no code provided for simple testing, or require full e164
        if (formattedNumber.length === 10) formattedNumber = `+57${formattedNumber}`;
      }

      const response = await axios.post(`${API_URL}/call`, {
        to_number: formattedNumber
      });

      setCallSid(response.data.call_sid);
      setStatus('connected');

      // Reset after 5 seconds for new call
      setTimeout(() => {
        setStatus('idle');
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.response?.data?.detail || 'Failed to initiate call');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black overflow-hidden relative">

      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/10 rounded-[100%] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[600px] bg-cyan-500/5 rounded-[100%] blur-[120px] pointer-events-none" />

      <div className="max-w-md w-full glass-panel rounded-3xl p-8 relative z-10 border border-slate-700/50">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 mb-6 border border-white/5 relative group">
            <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <Activity className="w-10 h-10 text-cyan-400 relative z-10" />
          </div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            SIAC Voice Agent
          </h1>
          <p className="text-slate-500 mt-2 text-sm font-medium tracking-wide uppercase">
            Powered by Gemini Multimodal
          </p>
        </div>

        {/* Call Interface */}
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
              className="input-field pl-12"
              disabled={status === 'calling'}
            />
          </div>

          <button
            onClick={handleCall}
            disabled={status === 'calling' || !phoneNumber}
            className={clsx(
              "w-full btn-primary flex items-center justify-center gap-3 group relative overflow-hidden",
              status === 'error' && "bg-red-500/20 hover:bg-red-500/30 border-red-500/50"
            )}
          >
            {status === 'calling' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : status === 'connected' ? (
              <>
                <PhoneCall className="w-5 h-5" />
                <span>Calling...</span>
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none" />
                <Mic className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Initiate Call</span>
              </>
            )}
          </button>

          {/* Status Messages */}
          {status === 'connected' && (
            <div className="text-center p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-sm animate-in fade-in slide-in-from-bottom-2">
              Call Initiated! ID: <span className="font-mono text-xs opacity-70 block mt-1">{callSid}</span>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-in fade-in slide-in-from-bottom-2">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-10 pt-6 border-t border-white/5 flex justify-between items-center text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>System Online</span>
          </div>
          <div className="flex items-center gap-1.5 opacity-50">
            <Clock className="w-3 h-3" />
            <span>v1.0.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
