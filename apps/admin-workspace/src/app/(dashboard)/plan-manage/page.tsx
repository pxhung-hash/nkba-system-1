'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface ActionPlan {
  id: string;
  title: string;
  html_content: string;
}

export default function ActionPlanManagerPage() {
  const [supabase] = useState(() => createClient());
  
  // State danh sách và file đang chọn
  const [plans, setPlans] = useState<ActionPlan[]>([]);
  const [activePlan, setActivePlan] = useState<ActionPlan | null>(null);
  
  // State chỉnh sửa
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview');
  
  // 🚀 ĐÃ BỔ SUNG: State quản lý giao diện
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Trạng thái ẩn/hiện cột trái
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Lắng nghe kích thước màn hình để tự động đóng/mở Sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false); // Mobile mặc định đóng
      } else {
        setIsSidebarOpen(true); // Desktop mặc định mở
      }
    };
    
    // Gọi ngay lần đầu
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('action_plans')
      .select('*')
      .order('updated_at', { ascending: false });

    if (data && data.length > 0) {
      setPlans(data);
      if (!activePlan) {
        selectPlan(data[0]);
      }
    }
    setLoading(false);
  };

  const selectPlan = (plan: ActionPlan) => {
    setActivePlan(plan);
    setEditTitle(plan.title);
    setEditContent(plan.html_content);
    
    // 🚀 MOBILE: Tự động đóng Menu trái sau khi chọn file để lấy không gian làm việc
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleCreateNew = async () => {
    const title = prompt('Nhập tên Kế hoạch hành động mới:', 'Kế hoạch chưa đặt tên');
    if (!title || !title.trim()) return;

    const defaultHTML = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Roboto:wght@400;500&display=swap" rel="stylesheet">
</head>
<body class="bg-slate-50 p-8 font-sans text-slate-800">
    <div class="max-w-4xl mx-auto bg-white p-10 rounded-2xl shadow-lg border border-slate-100">
        <h1 class="text-3xl font-bold text-blue-900 mb-4" style="font-family: 'Montserrat', sans-serif;">${title}</h1>
        <p class="text-slate-600">Bắt đầu viết mã HTML của bạn tại đây...</p>
    </div>
</body>
</html>`;

    const { data, error } = await supabase
      .from('action_plans')
      .insert([{ title: title.trim(), html_content: defaultHTML }])
      .select()
      .single();

    if (error) {
      alert('Lỗi tạo file: ' + error.message);
    } else if (data) {
      setPlans([data, ...plans]);
      selectPlan(data);
    }
  };

  const handleSave = async () => {
    if (!activePlan) return;
    setIsSaving(true);

    const { error } = await supabase
      .from('action_plans')
      .update({
        title: editTitle,
        html_content: editContent,
      })
      .eq('id', activePlan.id);

    setIsSaving(false);

    if (error) {
      alert('Lỗi lưu dữ liệu: ' + error.message);
    } else {
      setPlans(plans.map(p => p.id === activePlan.id ? { ...p, title: editTitle, html_content: editContent } : p));
      setActivePlan({ ...activePlan, title: editTitle, html_content: editContent });
      alert('Đã lưu kế hoạch thành công!');
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Bạn có chắc chắn muốn xóa kế hoạch này không?')) return;

    const { error } = await supabase.from('action_plans').delete().eq('id', id);

    if (error) {
      alert('Lỗi xóa file: ' + error.message);
    } else {
      const updatedPlans = plans.filter(p => p.id !== id);
      setPlans(updatedPlans);
      if (activePlan?.id === id) {
        if (updatedPlans.length > 0) selectPlan(updatedPlans[0]);
        else {
          setActivePlan(null);
          setEditTitle('');
          setEditContent('');
        }
      }
    }
  };

  return (
    // Responsive margin: m-2 cho Mobile, m-4 cho PC
    <div className={`flex bg-slate-900 text-slate-100 overflow-hidden font-sans rounded-2xl border border-slate-800 shadow-2xl relative
      ${isFullscreen ? 'fixed inset-0 z-[9999] m-0 w-screen h-screen rounded-none border-none' : 'h-[calc(100vh-4rem)] m-2 md:m-4'}`}>
      
      {/* 🚀 OVERLAY DÀNH CHO MOBILE: Nhấn ra ngoài để đóng Menu */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 📁 CỘT TRÁI: DANH SÁCH FILE HTML (Thu gọn linh hoạt) */}
      <div className={`
        absolute md:relative z-50 h-full bg-slate-950 flex flex-col shrink-0 transition-all duration-300 ease-in-out border-slate-800
        ${isSidebarOpen ? 'w-72 md:w-64 translate-x-0 border-r' : 'w-72 md:w-0 -translate-x-full md:translate-x-0 border-r-0 md:opacity-0 md:overflow-hidden'}
      `}>
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2">
            <i className="ph-fill ph-folder-open text-amber-500 text-xl"></i>
            <h2 className="font-black text-[11px] md:text-xs uppercase tracking-wider text-slate-400 truncate">Kế hoạch hành động</h2>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCreateNew} 
              className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#002D62] to-blue-900 hover:opacity-90 text-white flex items-center justify-center transition-all shadow-md shrink-0"
              title="Tạo kế hoạch mới"
            >
              <i className="ph-bold ph-plus text-base"></i>
            </button>
            {/* Nút đóng Sidebar chỉ hiện trên Mobile */}
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="md:hidden w-8 h-8 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0"
            >
              <i className="ph-bold ph-x"></i>
            </button>
          </div>
        </div>

        {/* Khối danh sách các file */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {loading ? (
            <div className="text-center py-8 text-slate-500 text-sm"><i className="ph-bold ph-spinner animate-spin mr-2"></i>Đang tải...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs px-4 border border-dashed border-slate-800 rounded-xl">Chưa có kế hoạch nào. Bấm nút (+) để tạo mới!</div>
          ) : (
            plans.map(plan => (
              <div 
                key={plan.id}
                onClick={() => selectPlan(plan)}
                className={`group flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all ${activePlan?.id === plan.id ? 'bg-[#002D62] text-white font-bold shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800/50 text-slate-400'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <i className={`ph-fill ph-file-html text-lg shrink-0 ${activePlan?.id === plan.id ? 'text-amber-400' : 'text-slate-600'}`}></i>
                  <span className="truncate text-sm">{plan.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDelete(plan.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all shrink-0 md:flex hidden"
                  title="Xóa file"
                >
                  <i className="ph-bold ph-trash"></i>
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 📝 CỘT PHẢI: KHU VỰC SOẠN THẢO & PREVIEW */}
      <div className="flex-1 flex flex-col h-full bg-slate-900 min-w-0 relative z-0">
        {activePlan ? (
          <>
            {/* 🚀 THANH CÔNG CỤ: Tối ưu Responsive cho Mobile */}
            <div className="h-auto md:h-16 py-3 md:py-0 border-b border-slate-800 px-3 md:px-6 flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-950/80 backdrop-blur-md shrink-0 gap-3 md:gap-4 overflow-x-hidden">
              
              <div className="flex items-center gap-2 md:gap-3 w-full md:flex-1 min-w-0">
                {/* 🚀 Nút Ẩn/Hiện Sidebar (Hamburger Icon) */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center transition-colors border 
                    ${isSidebarOpen ? 'bg-slate-800 border-slate-700 text-slate-400 hidden md:flex' : 'bg-[#002D62] border-blue-900 text-white flex'}`}
                  title={isSidebarOpen ? "Ẩn danh sách file" : "Hiện danh sách file"}
                >
                  <i className={`ph-bold ${isSidebarOpen ? 'ph-sidebar-simple' : 'ph-list'} text-lg`}></i>
                </button>

                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-transparent border-b-2 border-transparent hover:border-slate-700 focus:border-amber-500 px-1 py-1 text-base md:text-lg font-bold outline-none text-white w-full transition-colors truncate placeholder:text-slate-600"
                  placeholder="Đặt tên cho kế hoạch..."
                />
              </div>

              <div className="flex items-center justify-between w-full md:w-auto gap-2 overflow-x-auto custom-scrollbar pb-1 md:pb-0">
                {/* Bộ chuyển đổi Tab (Code vs Preview) */}
                <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-700 flex gap-1 shrink-0 shadow-inner">
                  <button 
                    onClick={() => setViewMode('preview')}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs transition-all flex items-center gap-1.5 md:gap-2 ${viewMode === 'preview' ? 'bg-[#002D62] text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                  >
                    <i className="ph-bold ph-browser text-sm md:text-base"></i> <span className="whitespace-nowrap">WEB PREVIEW</span>
                  </button>
                  <button 
                    onClick={() => setViewMode('code')}
                    className={`px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-bold text-[10px] md:text-xs transition-all flex items-center gap-1.5 md:gap-2 ${viewMode === 'code' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                  >
                    <i className="ph-bold ph-code text-sm md:text-base"></i> <span className="whitespace-nowrap">HTML SOURCE</span>
                  </button>
                </div>

                {/* Nhóm Nút tính năng bên phải (Thêm nút Fullscreen) */}
                <div className="flex justify-end shrink-0 items-center gap-2">
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className={`w-9 h-9 md:w-10 md:h-10 rounded-xl border transition-all flex items-center justify-center shrink-0 hidden md:flex ${isFullscreen ? 'bg-amber-500 border-amber-600 text-slate-900 hover:bg-amber-400' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                    title={isFullscreen ? "Thu nhỏ màn hình" : "Mở rộng toàn màn hình"}
                  >
                    <i className={`ph-bold ${isFullscreen ? 'ph-arrows-in' : 'ph-arrows-out'} text-lg`}></i>
                  </button>

                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 md:px-6 h-9 md:h-10 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-[10px] md:text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-1.5 md:gap-2 shrink-0"
                  >
                    {isSaving ? <><i className="ph-bold ph-spinner animate-spin text-sm md:text-lg"></i> <span className="hidden md:inline whitespace-nowrap">ĐANG LƯU...</span></> : <><i className="ph-bold ph-floppy-disk text-sm md:text-lg"></i> <span className="hidden sm:inline whitespace-nowrap">LƯU KẾ HOẠCH</span></>}
                  </button>
                </div>
              </div>
            </div>

            {/* Vùng Workspace hiển thị nội dung tùy theo Mode */}
            <div className="flex-1 p-2 md:p-6 overflow-hidden bg-slate-900">
              {viewMode === 'code' ? (
                /* CHẾ ĐỘ CODE */
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full p-4 md:p-6 bg-[#0d1117] border border-slate-700 rounded-xl md:rounded-2xl outline-none font-mono text-[12px] md:text-sm text-blue-100 leading-relaxed focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none shadow-inner"
                  placeholder="Viết mã HTML của bạn vào đây..."
                  spellCheck={false}
                />
              ) : (
                /* CHẾ ĐỘ PREVIEW */
                <div className="w-full h-full bg-white rounded-xl md:rounded-2xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col">
                  <div className="bg-slate-100 border-b border-slate-200 px-3 md:px-4 py-1.5 md:py-2 text-[10px] md:text-xs text-slate-500 font-mono flex items-center justify-between select-none">
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-rose-400 shadow-sm"></span>
                        <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-amber-400 shadow-sm"></span>
                        <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-emerald-400 shadow-sm"></span>
                        <span className="ml-2 md:ml-3 font-medium text-slate-400 flex items-center gap-1"><i className="ph-fill ph-lock-key"></i> <span className="hidden sm:inline">Isolated Live Preview Render</span></span>
                    </div>
                    <span className="text-[9px] md:text-[10px] bg-white border border-slate-200 px-1.5 md:px-2 py-0.5 rounded text-slate-400 hidden sm:block">100% Standard Web View</span>
                  </div>
                  
                  <iframe 
                    title="Live Web Preview"
                    srcDoc={editContent}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    className="flex-1 w-full bg-white outline-none"
                    style={{ minHeight: '100%', border: 'none' }}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          /* MÀN HÌNH TRỐNG KHI CHƯA CHỌN FILE NÀO */
          <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 text-center text-slate-500 bg-slate-900/50">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden mb-6 px-6 py-3 bg-[#002D62] text-white rounded-xl font-bold flex items-center gap-2 shadow-lg"
            >
              <i className="ph-bold ph-list"></i> Mở danh sách Kế hoạch
            </button>
            <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-800/80 rounded-full flex items-center justify-center mb-4 md:mb-6 border-2 border-slate-700 shadow-lg relative">
                <i className="ph-fill ph-file-html text-4xl md:text-5xl text-slate-400"></i>
                <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-6 h-6 md:w-8 md:h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                    <i className="ph-bold ph-cursor-click text-white text-xs md:text-base"></i>
                </div>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-slate-300">Không có tài liệu nào đang mở</h3>
            <p className="text-xs md:text-sm text-slate-500 max-w-sm mt-2 md:mt-3 leading-relaxed px-4">
              Vui lòng chọn một Kế hoạch hành động bên danh mục trái hoặc tạo mới một tệp tin HTML để bắt đầu biên tập.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}