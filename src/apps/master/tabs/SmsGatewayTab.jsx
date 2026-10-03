import React, { useState } from 'react';
import { useMaster } from '../context/MasterContext';
import { Smartphone, Send, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, MessageSquare } from 'lucide-react';

export default function SmsGatewayTab() {
  const { isConnected, smsLogs, sendTestSms, simulatePaymentSms, showToast } = useMaster();

  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('Shawarma Nights: Aapka order confirm ho gaya hai! Track karein churuone.in');
  const [bankSmsText, setBankSmsText] = useState('Dear SBI User, your A/c *4589 credited by Rs 358.00 on 04-Oct-26 via UPI/Ref 42781928192. (UPI Payment)');

  const handleSendTestSms = (e) => {
    e.preventDefault();
    if (!testPhone.trim()) {
      showToast('Phone number required', 'error');
      return;
    }
    sendTestSms(testPhone.trim(), testMsg.trim());
  };

  const handleSimulateUpiSms = (e) => {
    e.preventDefault();
    if (!bankSmsText.trim()) return;
    simulatePaymentSms(bankSmsText.trim());
    showToast('UPI SMS sent to verification engine', 'success');
  };

  return (
    <div className="space-y-6 pb-16">
      
      {/* Gateway Status Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-black text-white">ChuruOne SMS & UPI Gateway Engine</h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Dual-Sim Android Gateway + Automated Banking UPI SMS Verification Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-bold text-zinc-300">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>WebSocket Hub {isConnected ? 'Active' : 'Offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Tool 1: Bank UPI Auto-Verification Simulator */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span>Simulate Bank UPI SMS Verification</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              When a customer pays via UPI QR, bank SMS instantly verifies pending order. Test it here:
            </p>
          </div>

          <form onSubmit={handleSimulateUpiSms} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Bank Received SMS Text
              </label>
              <textarea
                rows={3}
                required
                value={bankSmsText}
                onChange={(e) => setBankSmsText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-mono focus:outline-none focus:border-[#DC2626] resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Pending UPI Orders</span>
            </button>
          </form>
        </div>

        {/* Tool 2: Send Test SMS Dispatcher */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-4">
          <div>
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-[#DC2626]" />
              <span>Direct SMS Dispatcher</span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Send test notification or manual order update to any customer mobile:
            </p>
          </div>

          <form onSubmit={handleSendTestSms} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Customer Mobile (+91)
              </label>
              <input
                type="tel"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 7023963189"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Message Content
              </label>
              <input
                type="text"
                required
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#DC2626]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#DC2626] hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send SMS via SIM Gateway</span>
            </button>
          </form>
        </div>

      </div>

      {/* Live SMS Activity Stream */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 sm:p-6 space-y-3">
        <h3 className="text-sm font-black text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-400" />
          <span>Realtime SMS Gateway Event Stream</span>
        </h3>

        {(!smsLogs || smsLogs.length === 0) ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            Abhi koi SMS activity nahi hui hai. New SMS bhejne par yahan real-time log hoga.
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
            {smsLogs.map(log => (
              <div
                key={log.id}
                className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-3 text-xs flex items-center justify-between gap-3"
              >
                <div>
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                      {log.type}
                    </span>
                    <span>{log.phone}</span>
                  </div>
                  <p className="text-zinc-400 text-[11px] mt-0.5 font-mono line-clamp-1">
                    {log.text}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-500 shrink-0">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
