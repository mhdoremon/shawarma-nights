import React, { useState } from 'react';
import { useMaster } from '../context/MasterContext';
import { Building2, Phone, MessageCircle, Check, MapPin } from 'lucide-react';

export default function FranchiseTab() {
  const { franchise, franchiseInquiries, updateFranchiseConfig, updateFranchiseInquiryStatus, showToast } = useMaster();

  const [activeSubTab, setActiveSubTab] = useState('leads'); // 'leads' | 'settings'

  // Settings form state
  const [configForm, setConfigForm] = useState({
    enabled: franchise?.enabled !== false,
    investmentRange: franchise?.investmentRange || '₹3.5L – ₹6.5L',
    roiMonths: franchise?.roiMonths || '3 to 6 Months',
    grossMargin: franchise?.grossMargin || '50% – 60%',
    setupDays: franchise?.setupDays || '14 Days',
    directPhone: franchise?.directPhone || '7023963189',
    whatsappPhone: franchise?.whatsappPhone || '917023963189',
    brandName: franchise?.brandName || 'Shawarma Nights'
  });

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    await updateFranchiseConfig(configForm);
  };

  return (
    <div className="space-y-5 pb-16">
      
      {/* Top Header & Sub-Tab Switcher */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-xl font-black text-zinc-900">Franchise Expansion Manager</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
            Manage investor leads, territory inquiries, and franchise commercials
          </p>
        </div>

        {/* Sub-tab segmented pill */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-zinc-100 shrink-0">
          <button
            onClick={() => setActiveSubTab('leads')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'leads' ? 'bg-[#DC2626] text-white shadow-md' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Applicant Leads ({franchiseInquiries?.length || 0})
          </button>
          <button
            onClick={() => setActiveSubTab('settings')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all cursor-pointer ${
              activeSubTab === 'settings' ? 'bg-[#DC2626] text-white shadow-md' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Commercials & Settings
          </button>
        </div>
      </div>

      {/* VIEW 1: FRANCHISE INQUIRIES LEADS */}
      {activeSubTab === 'leads' && (
        <div className="space-y-4">
          {(!franchiseInquiries || franchiseInquiries.length === 0) ? (
            <div className="bg-white rounded-3xl p-12 text-center text-zinc-400 text-sm space-y-1 shadow-lg border-0">
              <p className="font-bold text-zinc-700">No franchise inquiries yet</p>
              <p className="text-xs">
                Website par Franchise modal se aane wale saare investor leads yahan real-time show honge.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {franchiseInquiries.map((inq) => {
                const status = inq.status || 'pending';
                const statusStyle = {
                  pending: 'bg-amber-50 text-amber-700',
                  reviewing: 'bg-sky-50 text-sky-700',
                  contacted: 'bg-purple-50 text-purple-700',
                  approved: 'bg-emerald-50 text-emerald-700',
                  rejected: 'bg-red-50 text-red-700'
                }[status] || 'bg-zinc-100 text-zinc-600';

                return (
                  <div
                    key={inq.id || Math.random()}
                    className="bg-white rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-xl hover:shadow-2xl transition-all border-0"
                  >
                    <div className="space-y-3">
                      
                      {/* Lead Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-base font-black text-zinc-900">{inq.name}</h3>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-500 mt-0.5">
                            <MapPin className="w-3.5 h-3.5 text-[#DC2626]" />
                            <span>{inq.city || 'Proposed Territory'}</span>
                          </div>
                        </div>

                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statusStyle}`}>
                          {status}
                        </span>
                      </div>

                      {/* Lead Details */}
                      <div className="space-y-1.5 bg-[#FFFBF7] p-4 rounded-2xl shadow-xs border-0 text-xs text-zinc-700">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Proposed Budget:</span>
                          <strong className="text-zinc-900 font-black">{inq.budget || '₹3.5L (Express)'}</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Food Experience:</span>
                          <span className={inq.experience ? 'text-emerald-700 font-black' : 'text-zinc-600'}>
                            {inq.experience ? 'Yes (Has Experience)' : 'No (First Venture)'}
                          </span>
                        </div>
                        {inq.notes && (
                          <div className="pt-2 border-t border-zinc-200 text-[11px] text-zinc-600 italic">
                            "{inq.notes}"
                          </div>
                        )}
                      </div>

                      {/* Phone & Date */}
                      <div className="flex items-center justify-between text-xs text-zinc-500">
                        <span className="font-mono font-bold text-zinc-700">{inq.phone}</span>
                        <span className="text-[11px] text-zinc-400">
                          {inq.createdAt ? new Date(inq.createdAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>

                    </div>

                    {/* Actions & Status Dropdown */}
                    <div className="space-y-2 pt-2 border-t border-zinc-100">
                      
                      {/* Direct Call & WhatsApp */}
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`tel:${inq.phone}`}
                          className="py-2.5 px-3 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Call Lead</span>
                        </a>
                        <a
                          href={`https://wa.me/${inq.phone?.replace(/[^0-9]/g, '')}?text=Namaste%20${encodeURIComponent(inq.name)},%20Shawarma%20Nights%20Franchise%20Desk%20se%20sampark%20kar%20rahe%20hain.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2.5 px-3 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      </div>

                      {/* Status Selector */}
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-[11px] text-zinc-500 font-bold">Status:</span>
                        <select
                          value={status}
                          onChange={(e) => updateFranchiseInquiryStatus(inq.id, e.target.value)}
                          className="flex-1 bg-[#FFFBF7] rounded-xl px-3 py-1.5 text-xs text-zinc-900 font-bold focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0 cursor-pointer"
                        >
                          <option value="pending">Pending</option>
                          <option value="reviewing">Under Review</option>
                          <option value="contacted">Contacted / In Discussion</option>
                          <option value="approved">Approved & Deal Closed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>

                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: FRANCHISE TERMS CONFIGURATION */}
      {activeSubTab === 'settings' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl mx-auto space-y-5 shadow-xl border-0">
          <div className="border-b border-zinc-100 pb-4">
            <h3 className="text-base font-black text-zinc-900">Live Franchise Commercials</h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Updates here will instantly sync to the website Franchise Modal and Homepage Teaser.
            </p>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[#FFFBF7] shadow-xs">
            <div>
              <div className="text-sm font-black text-zinc-900">Franchise Program Status</div>
              <div className="text-xs text-zinc-500">Accepting new territory inquiries on website</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={configForm.enabled}
                onChange={(e) => setConfigForm({ ...configForm, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Investment Range
              </label>
              <input
                type="text"
                value={configForm.investmentRange}
                onChange={(e) => setConfigForm({ ...configForm, investmentRange: e.target.value })}
                placeholder="₹3.5L – ₹6.5L"
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Payback ROI Period
              </label>
              <input
                type="text"
                value={configForm.roiMonths}
                onChange={(e) => setConfigForm({ ...configForm, roiMonths: e.target.value })}
                placeholder="3 to 6 Months"
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Gross Margin
              </label>
              <input
                type="text"
                value={configForm.grossMargin}
                onChange={(e) => setConfigForm({ ...configForm, grossMargin: e.target.value })}
                placeholder="50% – 60%"
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Setup & Turnkey Days
              </label>
              <input
                type="text"
                value={configForm.setupDays}
                onChange={(e) => setConfigForm({ ...configForm, setupDays: e.target.value })}
                placeholder="14 Days"
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                Direct Desk Phone
              </label>
              <input
                type="tel"
                value={configForm.directPhone}
                onChange={(e) => setConfigForm({ ...configForm, directPhone: e.target.value })}
                placeholder="7023963189"
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>

            <div>
              <label className="block text-[11px] font-black text-zinc-700 uppercase tracking-wider mb-1">
                WhatsApp Desk Phone
              </label>
              <input
                type="tel"
                value={configForm.whatsappPhone}
                onChange={(e) => setConfigForm({ ...configForm, whatsappPhone: e.target.value })}
                placeholder="917023963189"
                className="w-full bg-[#FFFBF7] rounded-2xl px-4 py-3 text-sm text-zinc-900 focus:bg-white focus:ring-2 focus:ring-[#DC2626] focus:outline-none transition-all shadow-xs border-0"
              />
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3.5 rounded-full bg-[#DC2626] hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-xl border-0"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Save & Publish Franchise Commercials</span>
            </button>
          </div>
        </form>
      )}

    </div>
  );
}
