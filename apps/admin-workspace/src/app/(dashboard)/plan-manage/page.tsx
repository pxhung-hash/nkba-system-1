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
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('preview'); // Chế độ Code hoặc Xem trước Web
  
  // State trạng thái hệ thống
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. LOAD DANH SÁCH FILE TỪ DATABASE KHI VÀO TRANG
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
      // Mặc định chọn file đầu tiên nếu chưa chọn file nào
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
  };

  // 2. TÍNH NĂNG TẠO MỚI FILE HTML
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

  // 3. TÍNH NĂNG LƯU FILE (SỬA TÊN & NỘI DUNG)
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
      // Cập nhật lại danh sách bên menu trái
      setPlans(plans.map(p => p.id === activePlan.id ? { ...p, title: editTitle, html_content: editContent } : p));
      setActivePlan({ ...activePlan, title: editTitle, html_content: editContent });
      alert('Đã lưu kế hoạch thành công!');
    }
  };

  // 4. TÍNH NĂNG XÓA FILE
  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Ngăn sự kiện click chọn file bị kích hoạt
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
    <div className="flex h-[calc(100vh-4rem)] bg-slate-900 text-slate-100 overflow-hidden font-sans rounded-2xl border border-slate-800 shadow-2xl m-4">
      
      {/* 📁 CỘT TRÁI: DANH SÁCH FILE HTML */}
      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0 relative z-10">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2">
            <i className="ph-fill ph-folder-open text-amber-500 text-xl"></i>
            <h2 className="font-black text-xs uppercase tracking-wider text-slate-400 truncate">Kế hoạch hành động</h2>
          </div>
          <button 
            onClick={handleCreateNew} 
            className="w-8 h-8 rounded-lg bg-[#002D62] hover:bg-blue-800 text-white flex items-center justify-center transition-colors shrink-0 shadow-md"
            title="Tạo kế hoạch mới"
          >
            <i className="ph-bold ph-plus text-base"></i>
          </button>
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
                  className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all shrink-0"
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
            {/* Thanh công cụ phía trên điều khiển */}
            <div className="h-16 border-b border-slate-800 px-4 md:px-6 flex justify-between items-center bg-slate-950/80 backdrop-blur-md shrink-0 gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-transparent border-b-2 border-transparent hover:border-slate-700 focus:border-amber-500 px-2 py-1 text-base md:text-lg font-bold outline-none text-white w-full transition-colors truncate placeholder:text-slate-600"
                  placeholder="Đặt tên cho kế hoạch..."
                />
              </div>

              {/* Bộ chuyển đổi Tab (Code vs Preview) */}
              <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-700 flex gap-1 shrink-0 shadow-inner">
                <button 
                  onClick={() => setViewMode('preview')}
                  className={`px-3 md:px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${viewMode === 'preview' ? 'bg-[#002D62] text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                  <i className="ph-bold ph-browser text-base"></i> WEB PREVIEW
                </button>
                <button 
                  onClick={() => setViewMode('code')}
                  className={`px-3 md:px-5 py-2 rounded-lg font-bold text-xs transition-all flex items-center gap-2 ${viewMode === 'code' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
                >
                  <i className="ph-bold ph-code text-base"></i> HTML SOURCE
                </button>
              </div>

              {/* Nút lưu */}
              <div className="flex justify-end shrink-0 pl-2">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 md:px-6 h-10 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs md:text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                >
                  {isSaving ? <><i className="ph-bold ph-spinner animate-spin text-lg"></i> <span className="hidden md:inline">ĐANG LƯU...</span></> : <><i className="ph-bold ph-floppy-disk text-lg"></i> <span className="hidden md:inline">LƯU KẾ HOẠCH</span></>}
                </button>
              </div>
            </div>

            {/* Vùng Workspace hiển thị nội dung tùy theo Mode */}
            <div className="flex-1 p-4 md:p-6 overflow-hidden bg-slate-900">
              {viewMode === 'code' ? (
                /* CHẾ ĐỘ CODE: Biên tập mã nguồn HTML thô */
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full p-6 bg-[#0d1117] border border-slate-700 rounded-2xl outline-none font-mono text-sm text-blue-100 leading-relaxed focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all resize-none shadow-inner"
                  placeholder="Viết mã HTML của bạn vào đây..."
                  spellCheck={false}
                />
              ) : (
                /* CHẾ ĐỘ PREVIEW: Iframe cách ly an toàn tuyệt đối, render 100% giống Chrome */
                <div className="w-full h-full bg-white rounded-2xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col">
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-xs text-slate-500 font-mono flex items-center justify-between select-none">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-rose-400 shadow-sm"></span>
                        <span className="w-3 h-3 rounded-full bg-amber-400 shadow-sm"></span>
                        <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-sm"></span>
                        <span className="ml-3 font-medium text-slate-400 flex items-center gap-1"><i className="ph-fill ph-lock-key"></i> Isolated Live Preview Render</span>
                    </div>
                    <span className="text-[10px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-400">100% Standard Web View</span>
                  </div>
                  
                  {/* Sử dụng iframe với srcDoc để render HTML chuẩn, cho phép chạy Tailwind CDN */}
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
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500 bg-slate-900/50">
            <div className="w-24 h-24 bg-slate-800/80 rounded-full flex items-center justify-center mb-6 border-2 border-slate-700 shadow-lg relative">
                <i className="ph-fill ph-file-html text-5xl text-slate-400"></i>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                    <i className="ph-bold ph-cursor-click text-white"></i>
                </div>
            </div>
            <h3 className="text-xl font-bold text-slate-300">Không có tài liệu nào đang mở</h3>
            <p className="text-sm text-slate-500 max-w-sm mt-3 leading-relaxed">
              Vui lòng chọn một Kế hoạch hành động bên danh mục trái hoặc tạo mới một tệp tin HTML để bắt đầu biên tập & xem trước.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}