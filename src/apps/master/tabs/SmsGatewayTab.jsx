import React, { useState } from 'react';
import { useMaster } from '../context/MasterContext';
import { Smartphone, Send, ShieldCheck, CheckCircle2, RefreshCw, MessageSquare } from 'lucide-react';

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
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h2 className="text-lg font-black text-zinc-900">ChuruOne SMS & UPI Gateway Engine</h2>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              Dual-Sim Android Gateway + Automated Banking UPI SMS Verification Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100 text-xs font-black text-zinc-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>WebSocket Hub {isConnected ? 'Active' : 'Offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Tool 1: Bank UPI Auto-Verification Simulator */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
          <div>
            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>Simulate Bank UPI SMS Verification</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              When a customer pays via UPI QR, bank SMS instantly verifies pending order. Test it here:
            </p>
          </div>

          <form onSubmit={handleSimulateUpiSms} className="space-y-3">
            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Bank Received SMS Text
              </label>
              <textarea
                rows={3}
                required
                value={bankSmsText}
                onChange={(e) => setBankSmsText(e.target.value)}
                className="w-full bg-[#FFFBF7] rounded-2xl p-3.5 text-xs text-zinc-800 font-mono focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg border-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Pending UPI Orders</span>
            </button>
          </form>
        </div>

        {/* Tool 2: Send Test SMS Dispatcher */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
          <div>
            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <Send className="w-4 h-4 text-[#DC2626]" />
              <span>Direct SMS Dispatcher</span>
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Send test notification or manual order update to any customer mobile:
            </p>
          </div>

          <form onSubmit={handleSendTestSms} className="space-y-3">
            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Customer Mobile (+91)
              </label>
              <input
                type="tel"
                required
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="e.g. 7023963189"
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Message Content
              </label>
              <input
                type="text"
                required
                value={testMsg}
                onChange={(e) => setTestMsg(e.target.value)}
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-xs text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg border-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send SMS via SIM Gateway</span>
            </button>
          </form>
        </div>

      </div>

      {/* Live SMS Activity Stream */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-4 border-0">
        <h3 className="text-sm font-black text-zinc-900 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-zinc-500" />
          <span>Realtime SMS Gateway Event Stream</span>
        </h3>

        {(!smsLogs || smsLogs.length === 0) ? (
          <div className="text-center py-8 text-zinc-400 text-xs">
            Abhi koi SMS activity nahi hui hai. New SMS bhejne par yahan real-time log hoga.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
            {smsLogs.map(log => (
              <div
                key={log.id}
                className="bg-[#FFFBF7] rounded-2xl p-3.5 text-xs flex items-center justify-between gap-3 shadow-xs border-0"
              >
                <div>
                  <div className="font-black text-zinc-900 flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-700 uppercase">
                      {log.type}
                    </span>
                    <span>{log.phone}</span>
                  </div>
                  <p className="text-zinc-600 text-[11px] mt-1 font-mono line-clamp-1">
                    {log.text}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-400 shrink-0 font-medium">{log.timestamp}</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
