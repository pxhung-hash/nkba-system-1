'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function InsightsPage() {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'reports' | 'requests'>('reports');
  
  // ==========================================
  // STATES CHO BÁO CÁO (REPORTS)
  // ==========================================
  const [reports, setReports] = useState<any[]>([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [reportForm, setReportForm] = useState({ 
    title: '', description: '', category: 'MARKET_RESEARCH', access_tier: 'STANDARD', file_url: '', cover_image: '' 
  });
  
  // State để Mở Modal Xem trước Báo cáo
  const [selectedReportView, setSelectedReportView] = useState<any | null>(null);

  // ==========================================
  // STATES CHO YÊU CẦU DỮ LIỆU (REQUESTS)
  // ==========================================
  const [requests, setRequests] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isSavingReq, setIsSavingReq] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    const [repRes, reqRes, memRes] = await Promise.all([
      supabase.from('reports').select('*').order('created_at', { ascending: false }),
      supabase.from('data_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('individuals').select('id, full_name, corporates(name), individual_tiers!individuals_tier_id_fkey(name, code)')
    ]);
    
    if (repRes.data) setReports(repRes.data);
    if (reqRes.data) setRequests(reqRes.data);
    if (memRes.data) setMembers(memRes.data);
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [supabase]);

  // ==========================================
  // XỬ LÝ ẢNH CHUNG (CANVAS NÉN TỰ ĐỘNG)
  // ==========================================
  const processImage = (file: File, callback: (base64: string) => void) => {
    if (!file.type.startsWith('image/')) return alert('Chỉ hỗ trợ file hình ảnh!');
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width; let height = img.height;
        if (width > 800) { height = Math.round((height * 800) / width); width = 800; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        callback(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  };

  // ==========================================
  // LOGIC CRUD BÁO CÁO (THÊM / SỬA / XÓA)
  // ==========================================
  const handleSaveReport = async () => {
    if (!reportForm.title || !reportForm.file_url) return alert('Vui lòng nhập Tên báo cáo và Link File!');
    setIsSavingReport(true);
    
    try {
      if (editingReportId) {
        // CẬP NHẬT
        const { error } = await supabase.from('reports').update(reportForm).eq('id', editingReportId);
        if (error) throw error;
        alert('✅ Đã cập nhật báo cáo thành công!');
      } else {
        // TẠO MỚI
        const { error } = await supabase.from('reports').insert([reportForm]);
        if (error) throw error;
        alert('✅ Đã phát hành báo cáo mới thành công!');
      }

      setShowReportForm(false);
      setEditingReportId(null);
      setReportForm({ title: '', description: '', category: 'MARKET_RESEARCH', access_tier: 'STANDARD', file_url: '', cover_image: '' });
      fetchData();
    } catch (err: any) {
      alert('Lỗi: ' + err.message);
    } finally {
      setIsSavingReport(false);
    }
  };

  const handleEditReport = (rep: any) => {
    setEditingReportId(rep.id);
    setReportForm({
      title: rep.title,
      description: rep.description || '',
      category: rep.category,
      access_tier: rep.access_tier,
      file_url: rep.file_url || '',
      cover_image: rep.cover_image || ''
    });
    setShowReportForm(true);
    // Tự động cuộn lên đầu trang để nhập form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteReport = async (id: string, title: string) => {
    if (!confirm(`Bạn có chắc chắn muốn XÓA báo cáo "${title}"? Hành động này không thể hoàn tác.`)) return;
    const { error } = await supabase.from('reports').delete().eq('id', id);
    if (error) alert('Lỗi xóa báo cáo: ' + error.message);
    else {
      alert('✅ Đã xóa báo cáo thành công!');
      fetchData();
    }
  };

  // --- LOGIC XỬ LÝ YÊU CẦU TỪ VIP (REQUESTS) ---
  const handleUpdateRequest = async () => {
    if (!selectedRequest) return;
    setIsSavingReq(true);
    
    const { error } = await supabase.from('data_requests').update({
      status: selectedRequest.status,
      result_file_url: selectedRequest.result_file_url,
      admin_note: selectedRequest.admin_note,
      updated_at: new Date().toISOString()
    }).eq('id', selectedRequest.id);

    if (error) alert('Lỗi cập nhật: ' + error.message);
    else {
      alert('✅ Đã lưu kết quả xử lý!');
      fetchData();
    }
    setIsSavingReq(false);
  };

  // Helpers
  const getTierBadge = (tier: string) => {
    switch(tier) {
      case 'PUBLIC': return 'bg-slate-100 text-slate-600 border-slate-200';
      case 'VIP': return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white shadow-md border-transparent';
      case 'PREMIUM': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getReqStatusConfig = (status: string) => {
    switch(status) {
      case 'COMPLETED': return { color: 'text-emerald-700', bg: 'bg-emerald-100', label: 'ĐÃ TRẢ KẾT QUẢ' };
      case 'PROCESSING': return { color: 'text-blue-700', bg: 'bg-blue-100', label: 'ĐANG XỬ LÝ' };
      case 'REJECTED': return { color: 'text-rose-700', bg: 'bg-rose-100', label: 'TỪ CHỐI' };
      default: return { color: 'text-amber-700', bg: 'bg-amber-100', label: 'CHỜ TIẾP NHẬN' };
    }
  };

  const getMemberInfo = (id: string) => {
    const mem = members.find(m => m.id === id);
    if (!mem) return { company_name: 'Ẩn danh', tier: 'STANDARD' };
    const tierCode = Array.isArray(mem.individual_tiers) ? mem.individual_tiers[0]?.code : mem.individual_tiers?.code;
    return { company_name: mem.corporates?.name || mem.full_name, tier: tierCode || 'STANDARD' };
  };

  if (isLoading) return <div className="p-20 text-center text-sm font-bold text-slate-400 animate-pulse tracking-widest uppercase"><i className="ph-bold ph-spinner animate-spin text-3xl mb-3"></i><br/>Đang đồng bộ trung tâm dữ liệu...</div>;

  const pendingCount = requests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto pb-20 relative h-[calc(100vh-80px)] flex flex-col animate-in fade-in duration-500">
      
      {/* HEADER & TABS */}
      <div className="shrink-0 bg-white p-6 md:px-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between md:items-center gap-6">
         <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shadow-inner border border-teal-100">
              <i className="ph-fill ph-chart-polar text-3xl"></i>
            </div>
            <div>
              <p className="text-teal-600 font-bold text-xs uppercase tracking-widest mb-1 flex items-center gap-1"><i className="ph-fill ph-database"></i> TRUNG TÂM DỮ LIỆU B2B</p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight">Quản lý Insights & Báo cáo</h2>
            </div>
         </div>
         
         <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button onClick={() => setActiveTab('reports')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
              <i className="ph-fill ph-books text-lg"></i> Kho Phát Hành ({reports.length})
            </button>
            <button onClick={() => setActiveTab('requests')} className={`px-6 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${activeTab === 'requests' ? 'bg-[#002D62] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              <i className="ph-fill ph-ticket text-lg"></i> Yêu Cầu Dữ Liệu
              {pendingCount > 0 && <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded-md shadow-sm animate-pulse">{pendingCount}</span>}
            </button>
         </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        
        {/* ========================================================= */}
        {/* TAB 1: KHO BÁO CÁO (PUBLISHING DESK) */}
        {/* ========================================================= */}
        {activeTab === 'reports' && (
          <div className="flex-1 overflow-y-auto scroll-smooth flex flex-col gap-6 custom-scrollbar pr-2">
            
            {/* Thanh công cụ báo cáo */}
            <div className="flex justify-between items-center bg-teal-50/50 border border-teal-100 p-5 rounded-2xl shrink-0">
              <p className="text-sm font-bold text-teal-800 flex items-center gap-2"><i className="ph-fill ph-info"></i> Nơi đăng tải và phân phối dữ liệu thị trường cho Hội viên.</p>
              <button 
                onClick={() => {
                  if (showReportForm && editingReportId) {
                    // Nếu đang Edit mà bấm đóng -> Xóa Form
                    setEditingReportId(null);
                    setReportForm({ title: '', description: '', category: 'MARKET_RESEARCH', access_tier: 'STANDARD', file_url: '', cover_image: '' });
                    setShowReportForm(false);
                  } else {
                    setShowReportForm(!showReportForm);
                  }
                }} 
                className="h-12 px-6 bg-teal-600 text-white rounded-xl text-sm font-black shadow-md shadow-teal-600/20 hover:bg-teal-700 transition-colors flex items-center gap-2"
              >
                <i className={`ph-bold ${showReportForm ? 'ph-x' : 'ph-plus'} text-lg`}></i> {showReportForm ? 'ĐÓNG FORM' : 'TẠO BÁO CÁO MỚI'}
              </button>
            </div>

            {/* Form tạo mới / Chỉnh sửa Báo cáo */}
            {showReportForm && (
              <div className="bg-white border border-slate-200 p-8 rounded-[2rem] shadow-lg shrink-0 animate-in slide-in-from-top-4">
                <h3 className={`text-xl font-black mb-6 border-b border-slate-100 pb-4 flex items-center gap-2 ${editingReportId ? 'text-blue-600' : 'text-slate-900'}`}>
                  <i className={`ph-fill ${editingReportId ? 'ph-pencil-simple text-blue-600' : 'ph-upload-simple text-teal-600'}`}></i> 
                  {editingReportId ? 'Cập nhật Báo cáo' : 'Đăng tải Báo cáo / Dữ liệu mới'}
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
                  
                  {/* Cột trái: Thông tin */}
                  <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tên báo cáo (*)</label>
                      <input type="text" value={reportForm.title} onChange={e => setReportForm({...reportForm, title: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none focus:bg-white focus:border-teal-400 transition-colors" placeholder="VD: Báo cáo thị trường Vật Liệu XD Q1/2026..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phân loại</label>
                      <select value={reportForm.category} onChange={e => setReportForm({...reportForm, category: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 outline-none cursor-pointer focus:border-teal-400">
                        <option value="MARKET_RESEARCH">Nghiên cứu thị trường</option><option value="PRICE_INDEX">Đơn giá Vật tư / Nhân công</option><option value="MACRO">Báo cáo Vĩ mô</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-1"><i className="ph-fill ph-lock-key"></i> Quyền truy cập</label>
                      <select value={reportForm.access_tier} onChange={e => setReportForm({...reportForm, access_tier: e.target.value})} className="w-full h-12 px-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-sm font-black outline-none cursor-pointer focus:border-amber-400">
                        <option value="PUBLIC">PUBLIC (Đại chúng / Mồi SEO)</option><option value="STANDARD">STANDARD (Mọi hội viên)</option><option value="PREMIUM">PREMIUM (Trả phí)</option><option value="VIP">VIP (Bảo mật cao)</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tóm tắt (Teaser cho người không có quyền)</label>
                      <textarea value={reportForm.description} onChange={e => setReportForm({...reportForm, description: e.target.value})} className="w-full h-28 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 outline-none resize-none focus:bg-white focus:border-teal-400 transition-colors" placeholder="Nhập đoạn tóm tắt hấp dẫn để giới thiệu báo cáo..." />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1"><i className="ph-bold ph-link text-blue-500"></i> Link File Gốc (PDF/Excel) (*)</label>
                      <input type="text" value={reportForm.file_url} onChange={e => setReportForm({...reportForm, file_url: e.target.value})} className="w-full h-12 px-4 bg-blue-50/50 border border-blue-200 rounded-xl text-sm font-medium text-blue-700 outline-none focus:bg-white focus:border-blue-400 transition-colors" placeholder="https://drive.google.com/..." />
                    </div>
                  </div>

                  {/* Cột phải: Ảnh Cover */}
                  <div className="lg:col-span-1 flex flex-col">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><i className="ph-fill ph-image"></i> Ảnh bìa Báo cáo</label>
                    <label className="flex-1 w-full min-h-[200px] border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors relative overflow-hidden group flex flex-col items-center justify-center">
                      {reportForm.cover_image ? (
                        <>
                          <img src={reportForm.cover_image} alt="Cover" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-lg backdrop-blur-sm"><i className="ph-bold ph-camera mr-1"></i> Đổi ảnh</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-6 text-slate-400">
                          <i className="ph-bold ph-upload-simple text-4xl mb-3"></i>
                          <p className="text-sm font-bold text-slate-600">Nhấn để tải ảnh bìa</p>
                          <p className="text-[10px] uppercase tracking-widest mt-1">Tỷ lệ khuyên dùng 16:9</p>
                        </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => processImage(e.target.files?.[0] as File, (b64) => setReportForm({...reportForm, cover_image: b64}))} />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 gap-3">
                  {editingReportId && (
                    <button 
                      onClick={() => {
                        setEditingReportId(null);
                        setReportForm({ title: '', description: '', category: 'MARKET_RESEARCH', access_tier: 'STANDARD', file_url: '', cover_image: '' });
                        setShowReportForm(false);
                      }} 
                      className="h-14 px-8 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                    >
                      HỦY BỎ
                    </button>
                  )}
                  <button onClick={handleSaveReport} disabled={isSavingReport} className={`h-14 px-12 text-white rounded-xl text-sm font-black shadow-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${editingReportId ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30' : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'}`}>
                    {isSavingReport ? <><i className="ph-bold ph-spinner animate-spin text-lg"></i> ĐANG XỬ LÝ...</> : <><i className="ph-bold ph-paper-plane-right text-lg"></i> {editingReportId ? 'LƯU CẬP NHẬT' : 'PHÁT HÀNH BÁO CÁO'}</>}
                  </button>
                </div>
              </div>
            )}

            {/* Lưới hiển thị Báo cáo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
              {reports.length === 0 ? <div className="col-span-full p-16 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-200"><i className="ph-fill ph-folder-open text-4xl mb-3 text-slate-300"></i><br/>Kho báo cáo trống. Hãy phát hành bản tin đầu tiên!</div> : 
                reports.map(report => (
                  <div key={report.id} className="bg-white border border-slate-200 rounded-[2rem] flex flex-col overflow-hidden hover:shadow-lg hover:border-teal-300 transition-all group relative">
                    <div className="h-40 bg-slate-100 flex items-center justify-center border-b border-slate-100 relative overflow-hidden">
                       {report.cover_image ? (
                         <img src={report.cover_image} alt={report.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       ) : (
                         <i className="ph-fill ph-chart-line-up text-6xl text-slate-300 group-hover:scale-110 transition-transform duration-500"></i>
                       )}
                       <div className="absolute top-3 left-3 z-10">
                         <span className={`text-[9px] font-black px-2.5 py-1 bg-white/90 backdrop-blur-sm rounded-lg border uppercase tracking-widest shadow-sm ${getTierBadge(report.access_tier)}`}>
                           {report.access_tier} {report.access_tier==='VIP' && '👑'}
                         </span>
                       </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-3">
                        <p className="text-[9px] font-black text-teal-700 uppercase tracking-widest bg-teal-50 px-2 py-1 rounded border border-teal-100">{report.category}</p>
                        <p className="text-[10px] font-bold text-slate-400">{new Date(report.created_at).toLocaleDateString('vi-VN')}</p>
                      </div>
                      <h4 className="text-base font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-teal-600 transition-colors" title={report.title}>{report.title}</h4>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">{report.description || 'Không có tóm tắt'}</p>
                      
                      <div className="mt-auto pt-5 border-t border-slate-100 flex justify-between items-center text-xs font-bold text-slate-400">
                        <span className="flex items-center gap-1.5"><i className="ph-fill ph-download-simple text-slate-300"></i> {report.downloads || 0} tải</span>
                        <div className="flex gap-2">
                          <button onClick={() => setSelectedReportView(report)} className="w-8 h-8 flex items-center justify-center bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white rounded-lg transition-colors" title="Xem báo cáo"><i className="ph-bold ph-eye text-base"></i></button>
                          <button onClick={() => handleEditReport(report)} className="w-8 h-8 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors" title="Sửa báo cáo"><i className="ph-bold ph-pencil-simple text-base"></i></button>
                          <button onClick={() => handleDeleteReport(report.id, report.title)} className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition-colors" title="Xóa báo cáo"><i className="ph-bold ph-trash text-base"></i></button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TRẠM XỬ LÝ YÊU CẦU DATA (TICKETING DESK) */}
        {/* ========================================================= */}
        {activeTab === 'requests' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* CỘT TRÁI: DANH SÁCH YÊU CẦU (MASTER) */}
            <div className="w-full lg:w-1/3 bg-white border border-slate-200 shadow-sm rounded-[2rem] flex flex-col overflow-hidden shrink-0">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-lg font-black text-[#002D62] flex items-center gap-2"><i className="ph-fill ph-ticket"></i> Hộp thư Đặt hàng ({requests.length})</h3>
                <p className="text-xs text-slate-500 mt-1 font-medium">Danh sách các yêu cầu khảo sát từ Doanh nghiệp.</p>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {requests.length === 0 ? <div className="p-10 text-center text-sm text-slate-400 italic">Không có yêu cầu nào đang chờ!</div> : 
                  requests.map(req => {
                    const memInfo = getMemberInfo(req.member_id);
                    const isSelected = selectedRequest?.id === req.id;
                    const conf = getReqStatusConfig(req.status);
                    
                    return (
                      <div key={req.id} onClick={() => setSelectedRequest(req)} className={`p-5 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-[#002D62] border-[#002D62] shadow-lg transform scale-[1.02]' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'}`}>
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <span className={`shrink-0 text-[9px] font-black px-2.5 py-1 rounded-md tracking-widest ${isSelected ? 'bg-white/20 text-white' : `${conf.bg}${conf.color}`}`}>{conf.label}</span>
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>{new Date(req.created_at).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <h4 className={`text-sm font-bold line-clamp-2 leading-snug mb-3 ${isSelected ? 'text-white' : 'text-slate-900'}`}>{req.title}</h4>
                        <div className={`pt-3 border-t text-xs font-bold flex items-center gap-1.5 ${isSelected ? 'border-white/10 text-blue-200' : 'border-slate-100 text-slate-500'}`}>
                          <i className="ph-fill ph-buildings"></i> <span className="truncate">{memInfo.company_name}</span> {memInfo.tier === 'VIP' && '👑'}
                        </div>
                      </div>
                    )
                  })
                }
              </div>
            </div>

            {/* CỘT PHẢI: KHUNG XỬ LÝ (DETAIL) */}
            <div className="w-full lg:w-2/3 bg-white border border-slate-200 shadow-sm rounded-[2rem] flex flex-col relative overflow-hidden">
              {!selectedRequest ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
                  <i className="ph-duotone ph-hand-pointing text-[80px] mb-4 text-slate-300"></i>
                  <p className="font-bold text-lg text-slate-500">Chọn một ticket bên trái để xử lý</p>
                  <p className="text-sm mt-2">Hệ thống sẽ hiển thị nội dung và form trả kết quả tại đây.</p>
                </div>
              ) : (
                <>
                  {/* Header Detail */}
                  <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-start gap-6 shrink-0">
                    <div className="flex-1">
                      <span className={`inline-block mb-3 text-[10px] font-black px-3 py-1.5 rounded-lg tracking-wider uppercase ${getReqStatusConfig(selectedRequest.status).bg} ${getReqStatusConfig(selectedRequest.status).color}`}>
                        {getReqStatusConfig(selectedRequest.status).label}
                      </span>
                      <h2 className="text-xl md:text-2xl font-black text-[#002D62] leading-tight">{selectedRequest.title}</h2>
                      <p className="text-sm font-bold text-slate-600 mt-3 flex items-center gap-2 bg-white px-4 py-2 rounded-xl w-fit border border-slate-200 shadow-sm">
                        <i className="ph-fill ph-buildings text-amber-500 text-lg"></i> Từ: {getMemberInfo(selectedRequest.member_id).company_name} <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">{getMemberInfo(selectedRequest.member_id).tier}</span>
                      </p>
                    </div>
                    <button onClick={handleUpdateRequest} disabled={isSavingReq} className="shrink-0 h-12 px-8 bg-[#002D62] hover:bg-blue-900 text-white rounded-xl text-sm font-black shadow-lg transition-all disabled:opacity-70 flex items-center gap-2">
                      {isSavingReq ? <><i className="ph-bold ph-spinner animate-spin"></i> ĐANG LƯU</> : <><i className="ph-bold ph-check-circle"></i> LƯU KẾT QUẢ</>}
                    </button>
                  </div>
                  
                  {/* Body Detail */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar flex flex-col gap-8">
                    
                    {/* Khu vực Nội dung KH yêu cầu */}
                    <div>
                      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2"><i className="ph-fill ph-chat-text text-lg"></i> Nội dung khách hàng yêu cầu</h3>
                      <div className="bg-white border border-slate-200 text-slate-700 p-6 rounded-2xl text-sm font-medium whitespace-pre-line leading-relaxed shadow-sm">
                        {selectedRequest.content}
                      </div>
                    </div>

                    {/* Khu vực Admin Xử lý & Trả file */}
                    <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-6 md:p-8 mt-auto">
                      <h3 className="text-sm font-black text-[#002D62] uppercase tracking-widest flex items-center gap-2 mb-6"><i className="ph-fill ph-wrench text-xl"></i> Khu vực Trả Kết Quả (Dành cho Admin)</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Đổi trạng thái xử lý</label>
                          <select value={selectedRequest.status} onChange={e => setSelectedRequest({...selectedRequest, status: e.target.value})} className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-[#002D62] outline-none focus:border-blue-400 cursor-pointer shadow-sm">
                            <option value="PENDING">Chờ tiếp nhận</option>
                            <option value="PROCESSING">Đang xử lý thu thập</option>
                            <option value="COMPLETED">Đã trả kết quả (Hoàn thành)</option>
                            <option value="REJECTED">Từ chối (Ngoài phạm vi)</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1"><i className="ph-bold ph-link"></i> Link File Kết Quả Trả Khách</label>
                          <input type="text" value={selectedRequest.result_file_url || ''} onChange={e => setSelectedRequest({...selectedRequest, result_file_url: e.target.value})} className="w-full h-12 px-4 bg-white border border-emerald-200 rounded-xl text-sm font-medium text-blue-600 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-300 shadow-sm" placeholder="Dán link Google Drive, Dropbox..." />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lời nhắn gửi kèm (Admin Note)</label>
                        <textarea value={selectedRequest.admin_note || ''} onChange={e => setSelectedRequest({...selectedRequest, admin_note: e.target.value})} className="w-full h-32 p-4 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 outline-none focus:border-blue-400 resize-none shadow-sm" placeholder="VD: Gửi anh chị báo cáo chi tiết như yêu cầu. Cần thêm dữ liệu nào cứ nhắn team nhé..." />
                      </div>
                    </div>

                  </div>
                </>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* MODAL CHI TIẾT BÁO CÁO (CHẾ ĐỘ XEM TRƯỚC CỦA ADMIN) */}
      {/* ==================================================== */}
      {selectedReportView && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
            
            {/* Modal Header & Cover */}
            <div className="relative h-64 md:h-80 shrink-0 bg-slate-100 group">
              {selectedReportView.cover_image ? (
                <img src={selectedReportView.cover_image} alt={selectedReportView.title} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-teal-700 to-[#002D62] flex items-center justify-center">
                  <i className="ph-duotone ph-chart-polar text-[100px] text-white/20"></i>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent"></div>
              
              <button 
                onClick={() => setSelectedReportView(null)} 
                className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md hover:bg-rose-500 hover:border-rose-500 flex items-center justify-center text-white transition-colors border border-white/20 z-10"
              >
                <i className="ph-bold ph-x text-xl"></i>
              </button>

              <div className="absolute bottom-6 left-6 right-6 text-white">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-[10px] font-black px-3 py-1.5 bg-teal-500/20 border border-teal-400/30 text-teal-300 rounded-lg uppercase tracking-widest backdrop-blur-md">
                    {selectedReportView.category}
                  </span>
                  <span className="text-xs font-medium text-slate-300 flex items-center gap-1">
                    <i className="ph-bold ph-calendar-blank"></i> {new Date(selectedReportView.created_at).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <h2 className="text-2xl md:text-4xl font-black leading-tight drop-shadow-lg">{selectedReportView.title}</h2>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 md:p-10 overflow-y-auto bg-slate-50/50 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                
                {/* Cột Nội dung chính */}
                <div className="md:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-lg font-black text-slate-900 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                      <i className="ph-fill ph-text-align-left text-teal-500"></i> Executive Summary
                    </h3>
                    <p className="text-sm font-medium text-slate-600 leading-loose whitespace-pre-wrap">
                      {selectedReportView.description || 'Chưa có nội dung tóm tắt cho báo cáo này.'}
                    </p>
                  </div>
                </div>

                {/* Cột Hành động (Sidebar) */}
                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cấp độ truy cập</p>
                    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl mt-1 mb-6">
                      <i className={`ph-fill ${selectedReportView.access_tier === 'VIP' ? 'ph-crown text-amber-500' : 'ph-shield-check text-slate-500'} text-lg`}></i>
                      <p className={`text-sm font-black ${selectedReportView.access_tier === 'VIP' ? 'text-amber-700' : 'text-slate-700'}`}>{selectedReportView.access_tier}</p>
                    </div>

                    <a 
                      href={selectedReportView.file_url || '#'} 
                      target={selectedReportView.file_url ? "_blank" : "_self"}
                      rel="noopener noreferrer"
                      className={`w-full h-14 rounded-xl text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all ${selectedReportView.file_url ? 'bg-[#002D62] text-white hover:bg-blue-900 hover:-translate-y-1' : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'}`}
                      onClick={(e) => {
                        if (!selectedReportView.file_url) {
                          e.preventDefault();
                          alert('Báo cáo này chưa đính kèm file PDF.');
                        }
                      }}
                    >
                      <i className="ph-bold ph-download-simple text-xl"></i> {selectedReportView.file_url ? 'XEM FILE BÁO CÁO (PDF)' : 'CHƯA CÓ FILE'}
                    </a>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}