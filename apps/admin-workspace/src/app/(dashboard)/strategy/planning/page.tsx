'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function StrategyPlanningPage() {
  const supabase = createClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [planData, setPlanData] = useState<any>(null);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [orgDepartments, setOrgDepartments] = useState<any[]>([]);

  const [newBudget, setNewBudget] = useState({ name: '', percent: 0 });
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  const [newInitiative, setNewInitiative] = useState({ title: '', status: 'PLANNING' });
  const [editingInitiativeId, setEditingInitiativeId] = useState<string | null>(null);

  const fetchStrategyData = async () => {
    setIsLoading(true);
    const { data: orgDepts } = await supabase.from('departments').select('*').order('created_at', { ascending: true });
    if (orgDepts) setOrgDepartments(orgDepts);

    const { data: plan } = await supabase.from('strategic_plans').select('*').eq('year', parseInt(selectedYear)).maybeSingle();
    if (plan) {
      setPlanData(plan);
      const { data: bds } = await supabase.from('department_budgets').select('*').eq('plan_id', plan.id).order('created_at', { ascending: true });
      const { data: ints } = await supabase.from('initiatives').select('*').eq('plan_id', plan.id).order('created_at', { ascending: true });
      setBudgets(bds || []);
      setInitiatives(ints || []);
    } else {
      setPlanData({ target_gmv: 0, target_members: 0, target_experts: 0, strategic_vision: '' });
      setBudgets([]); setInitiatives([]);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchStrategyData(); }, [selectedYear]);

  const handleSavePlan = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('strategic_plans').upsert({
      year: parseInt(selectedYear), 
      target_gmv: planData.target_gmv, 
      target_members: planData.target_members, 
      target_experts: planData.target_experts,
      strategic_vision: planData.strategic_vision // Trường mới thêm để lưu văn bản
    }, { onConflict: 'year' }).select().single();
    
    if (error) alert('Lỗi khi lưu: ' + error.message);
    else { alert(`✅ Đã lưu mục tiêu năm ${selectedYear} thành công!`); fetchStrategyData(); }
    setIsSaving(false);
  };

  // --- LOGIC NGÂN SÁCH ---
  const handleSaveBudget = async () => {
    if (!planData?.id) return alert('Vui lòng ấn LƯU MỤC TIÊU trước!');
    if (!newBudget.name) return alert('Vui lòng chọn đơn vị/phòng ban!');
    if (newBudget.percent <= 0) return alert('Phần trăm ngân sách phải lớn hơn 0!');

    if (editingBudgetId) {
      const { error } = await supabase.from('department_budgets').update({ department_name: newBudget.name, allocated_percentage: newBudget.percent }).eq('id', editingBudgetId);
      if (error) alert('Lỗi cập nhật: ' + error.message);
      else { cancelEditBudget(); fetchStrategyData(); }
    } else {
      const { error } = await supabase.from('department_budgets').insert([{ plan_id: planData.id, department_name: newBudget.name, allocated_percentage: newBudget.percent, color_code: 'bg-blue-600' }]);
      if (error) alert('Lỗi thêm mới: ' + error.message);
      else { setNewBudget({ name: '', percent: 0 }); fetchStrategyData(); }
    }
  };

  const startEditBudget = (b: any) => { setEditingBudgetId(b.id); setNewBudget({ name: b.department_name, percent: b.allocated_percentage }); };
  const cancelEditBudget = () => { setEditingBudgetId(null); setNewBudget({ name: '', percent: 0 }); };
  const deleteBudget = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa phân bổ ngân sách này?')) return;
    const { error } = await supabase.from('department_budgets').delete().eq('id', id);
    if (error) alert('Lỗi khi xóa: ' + error.message); else fetchStrategyData();
  };

  // --- LOGIC SÁNG KIẾN ---
  const handleSaveInitiative = async () => {
    if (!planData?.id) return alert('Vui lòng ấn LƯU MỤC TIÊU trước!');
    if (!newInitiative.title) return alert('Vui lòng nhập tên sáng kiến!');

    if (editingInitiativeId) {
      const { error } = await supabase.from('initiatives').update({ title: newInitiative.title, status: newInitiative.status }).eq('id', editingInitiativeId);
      if (error) alert('Lỗi cập nhật: ' + error.message);
      else { cancelEditInitiative(); fetchStrategyData(); }
    } else {
      const { error } = await supabase.from('initiatives').insert([{ plan_id: planData.id, title: newInitiative.title, status: newInitiative.status }]);
      if (error) alert('Lỗi thêm mới: ' + error.message);
      else { setNewInitiative({ title: '', status: 'PLANNING' }); fetchStrategyData(); }
    }
  };

  const startEditInitiative = (i: any) => { setEditingInitiativeId(i.id); setNewInitiative({ title: i.title, status: i.status }); };
  const cancelEditInitiative = () => { setEditingInitiativeId(null); setNewInitiative({ title: '', status: 'PLANNING' }); };
  const deleteInitiative = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa sáng kiến này?')) return;
    const { error } = await supabase.from('initiatives').delete().eq('id', id);
    if (error) alert('Lỗi khi xóa: ' + error.message); else fetchStrategyData();
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'ON_TRACK': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'AT_RISK': return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'COMPLETED': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (isLoading) return <div className="p-20 text-center text-sm font-bold text-slate-400 animate-pulse tracking-widest uppercase">Đang đồng bộ dữ liệu...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* 1. HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:px-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
         <div className="absolute top-0 left-0 w-1 h-full bg-[#002D62]"></div>
         <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">CHIẾN LƯỢC {selectedYear}</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">Bảng điều khiển các chỉ số Bắc Đẩu (North Star Metrics)</p>
         </div>
         <div className="flex items-center gap-3 mt-4 md:mt-0">
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-[#002D62] outline-none focus:border-[#002D62] focus:ring-4 focus:ring-[#002D62]/10 transition-all cursor-pointer">
               <option value="2026">Năm 2026</option><option value="2027">Năm 2027</option>
            </select>
            <button onClick={handleSavePlan} disabled={isSaving} className="h-11 px-6 bg-[#002D62] text-white rounded-xl text-sm font-bold shadow-md shadow-[#002D62]/20 hover:bg-blue-900 transition-all">
              {isSaving ? 'ĐANG XỬ LÝ...' : 'LƯU CHIẾN LƯỢC'}
            </button>
         </div>
      </div>

      {/* 2. KHÔNG GIAN VIẾT VĂN BẢN KẾ HOẠCH TỔNG QUAN */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all">
        <h3 className="text-lg font-bold text-slate-900 mb-2">Tầm nhìn & Định hướng Chiến lược</h3>
        <p className="text-sm text-slate-500 mb-4">Ghi chú bối cảnh, mục tiêu chung và kế hoạch thực thi chi tiết cho năm {selectedYear}</p>
        <textarea 
          value={planData?.strategic_vision || ''} 
          onChange={(e) => setPlanData({...planData, strategic_vision: e.target.value})}
          className="w-full min-h-[150px] p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:bg-white resize-y"
          placeholder="Nhập nội dung văn bản chiến lược của NKBA tại đây..."
        />
      </div>

      {/* 3. METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'GMV Mục Tiêu (Tỷ VNĐ)', key: 'target_gmv', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Hội Viên Mới', key: 'target_members', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Chuyên Gia Mới', key: 'target_experts', color: 'text-amber-600', bg: 'bg-amber-50' }
        ].map((item) => (
          <div key={item.key} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">{item.label}</p>
            <div>
              <input type="number" value={planData?.[item.key] || ''} onChange={(e) => setPlanData({...planData, [item.key]: parseInt(e.target.value) || 0})} className="w-full text-4xl md:text-5xl font-black text-slate-800 bg-transparent border-none outline-none focus:text-[#002D62] transition-colors p-0 m-0 placeholder-slate-200" placeholder="0" />
            </div>
          </div>
        ))}
      </div>

      {/* 4. DUAL PANELS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* PANEL TRÁI: NGÂN SÁCH */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[400px]">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Phân bổ Ngân sách</h3>
            <p className="text-sm text-slate-500 mt-1">Tỷ lệ nguồn lực cho các phòng ban</p>
          </div>
          
          <div className="flex-1 space-y-3 mb-6">
            {budgets.length === 0 && <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">Chưa thiết lập ngân sách.</p>}
            {budgets.map(b => (
              <div key={b.id} className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${editingBudgetId === b.id ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/10' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-700 truncate">{b.department_name}</div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                       <div className={`${editingBudgetId === b.id ? 'bg-amber-500' : 'bg-blue-600'} h-full rounded-full`} style={{ width: `${b.allocated_percentage}%` }}></div>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-black text-[#002D62] w-12 text-right">{b.allocated_percentage}%</div>
                
                {/* NÚT SỬA XÓA NGÂN SÁCH */}
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditBudget(b)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700 transition-colors" title="Sửa">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg>
                  </button>
                  <button onClick={() => deleteBudget(b.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-700 transition-colors" title="Xóa">
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={`flex flex-wrap sm:flex-nowrap items-center gap-2 p-2 rounded-xl border transition-all mt-auto ${editingBudgetId ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10'}`}>
            <select value={newBudget.name} onChange={e => setNewBudget({...newBudget, name: e.target.value})} className="flex-1 min-w-[150px] h-11 bg-transparent px-3 outline-none text-sm font-bold text-slate-700 cursor-pointer">
              <option value="">-- Chọn Đơn vị --</option>
              {orgDepartments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
            </select>
            <div className="hidden sm:block h-5 w-px bg-slate-300"></div>
            <input type="number" placeholder="%" value={newBudget.percent || ''} onChange={e => setNewBudget({...newBudget, percent: parseInt(e.target.value) || 0})} className="w-16 h-11 bg-transparent px-2 outline-none text-sm font-black text-center text-[#002D62] placeholder:text-slate-400" />
            
            <div className="flex gap-1">
              <button onClick={handleSaveBudget} className={`h-11 px-4 text-white rounded-lg text-sm font-bold shadow-sm flex items-center justify-center transition-colors ${editingBudgetId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-800 hover:bg-[#002D62] w-11 px-0'}`} title={editingBudgetId ? "Lưu" : "Thêm"}>
                {editingBudgetId ? 'LƯU' : <svg width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z"></path></svg>}
              </button>
              {editingBudgetId && (
                 <button onClick={cancelEditBudget} className="h-11 w-11 bg-white border border-slate-300 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors" title="Hủy">
                   <svg width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
                 </button>
              )}
            </div>
          </div>
        </div>

        {/* PANEL PHẢI: SÁNG KIẾN */}
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[400px]">
          <div className="mb-6">
            <h3 className="text-lg font-bold text-slate-900">Sáng kiến Trọng tâm</h3>
            <p className="text-sm text-slate-500 mt-1">Các OKRs hành động cụ thể</p>
          </div>

          <div className="flex-1 space-y-3 mb-6">
            {initiatives.length === 0 && <p className="text-sm text-slate-400 italic bg-slate-50 p-4 rounded-xl text-center border border-dashed border-slate-200">Chưa có sáng kiến nào.</p>}
            {initiatives.map(i => (
              <div key={i.id} className={`group flex justify-between items-center p-3 border rounded-xl transition-all ${editingInitiativeId === i.id ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-500/10' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm'}`}>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate-700">{i.title}</span>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider inline-block ${getStatusBadge(i.status)}`}>{i.status.replace('_', ' ')}</span>
                  </div>
                </div>

                {/* NÚT SỬA XÓA SÁNG KIẾN */}
                <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity ml-2">
                  <button onClick={() => startEditInitiative(i)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-700 transition-colors" title="Sửa">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M227.31,73.37,182.63,28.68a16,16,0,0,0-22.63,0L36.69,152A15.86,15.86,0,0,0,32,163.31V208a16,16,0,0,0,16,16H92.69A15.86,15.86,0,0,0,104,219.31L227.31,96a16,16,0,0,0,0-22.63ZM92.69,208H48V163.31l88-88L180.69,120ZM192,108.68,147.31,64l24-24L216,84.68Z"></path></svg>
                  </button>
                  <button onClick={() => deleteInitiative(i.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-700 transition-colors" title="Xóa">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 256 256"><path d="M216,48H176V40a24,24,0,0,0-24-24H104A24,24,0,0,0,80,40v8H40a8,8,0,0,0,0,16h8V208a16,16,0,0,0,16,16H192a16,16,0,0,0,16-16V64h8a8,8,0,0,0,0-16ZM96,40a8,8,0,0,1,8-8h48a8,8,0,0,1,8,8v8H96Zm96,168H64V64H192ZM112,104v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Zm48,0v64a8,8,0,0,1-16,0V104a8,8,0,0,1,16,0Z"></path></svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className={`flex flex-col xl:flex-row gap-2 p-2 rounded-xl border transition-all mt-auto ${editingInitiativeId ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200 focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10'}`}>
            <input type="text" placeholder="Nhập tên sáng kiến..." value={newInitiative.title} onChange={e => setNewInitiative({...newInitiative, title: e.target.value})} className="flex-1 h-11 bg-transparent px-2 text-sm font-medium outline-none text-slate-700 placeholder:text-slate-400" />
            <div className="flex gap-2">
               <select value={newInitiative.status} onChange={e => setNewInitiative({...newInitiative, status: e.target.value})} className="w-full xl:w-32 h-11 bg-white border border-slate-200 px-2 rounded-lg text-xs font-bold text-slate-600 outline-none focus:border-blue-400 transition-all cursor-pointer">
                 <option value="PLANNING">PLANNING</option>
                 <option value="ON_TRACK">ON TRACK</option>
                 <option value="AT_RISK">AT RISK</option>
                 <option value="COMPLETED">COMPLETED</option>
               </select>
               <button onClick={handleSaveInitiative} className={`h-11 px-4 text-white rounded-lg text-sm font-bold shadow-sm whitespace-nowrap transition-colors ${editingInitiativeId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-800 hover:bg-[#002D62]'}`}>
                 {editingInitiativeId ? 'LƯU' : 'THÊM'}
               </button>
               {editingInitiativeId && (
                 <button onClick={cancelEditInitiative} className="h-11 w-11 bg-white border border-slate-300 text-slate-600 rounded-lg flex items-center justify-center hover:bg-slate-100 transition-colors" title="Hủy">
                   <svg width="16" height="16" fill="currentColor" viewBox="0 0 256 256"><path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path></svg>
                 </button>
               )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}