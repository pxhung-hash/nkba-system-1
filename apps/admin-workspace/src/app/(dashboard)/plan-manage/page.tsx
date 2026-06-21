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

    const defaultHTML = `<h2>${title}</h2>\n<p>Bắt đầu viết nội dung kế hoạch hành động tại đây...</p>`;

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
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* 📁 CỘT TRÁI: DANH SÁCH FILE HTML */}
      <div className="w-80 bg-slate-950 border-r border-slate-800 flex flex-col h-full shrink-0">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2">
            <i className="ph-fill ph-folder-open text-amber-500 text-xl"></i>
            <h2 className="font-black text-sm uppercase tracking-wider text-slate-400">Kế hoạch hành động</h2>
          </div>
          <button 
            onClick={handleCreateNew} 
            className="w-8 h-8 rounded-lg bg-[#002D62] hover:bg-blue-800 text-white flex items-center justify-center transition-colors"
            title="Tạo kế hoạch mới"
          >
            <i className="ph-bold ph-plus text-base"></i>
          </button>
        </div>

        {/* Khối danh sách các file */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading ? (
            <div className="text-center py-8 text-slate-500 text-sm"><i className="ph-bold ph-spinner animate-spin mr-2"></i>Đang tải danh sách...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs px-4">Chưa có kế hoạch nào. Bấm nút (+) để tạo mới!</div>
          ) : (
            plans.map(plan => (
              <div 
                key={plan.id}
                onClick={() => selectPlan(plan)}
                className={`group flex justify-between items-center p-3 rounded-xl cursor-pointer transition-all ${activePlan?.id === plan.id ? 'bg-[#002D62] text-white font-bold' : 'hover:bg-slate-800/50 text-slate-400'}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <i className={`ph-fill ph-file-html text-lg ${activePlan?.id === plan.id ? 'text-amber-400' : 'text-slate-500'}`}></i>
                  <span className="truncate text-sm">{plan.title}</span>
                </div>
                <button 
                  onClick={(e) => handleDelete(plan.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 rounded transition-all"
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
      <div className="flex-1 flex flex-col h-full bg-slate-900">
        {activePlan ? (
          <>
            {/* Thanh công cụ phía trên điều khiển */}
            <div className="h-14 border-b border-slate-800 px-6 flex justify-between items-center bg-slate-950/50 shrink-0">
              <div className="flex items-center gap-3 w-1/3">
                <input 
                  type="text" 
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-slate-700 focus:border-amber-500 px-1 py-1 text-lg font-bold outline-none text-white w-full transition-colors"
                  placeholder="Đặt tên cho kế hoạch..."
                />
              </div>

              {/* Bộ chuyển đổi Tab (Code vs Preview) */}
              <div className="bg-slate-900 p-1 rounded-xl border border-slate-800 flex gap-1">
                <button 
                  onClick={() => setViewMode('preview')}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${viewMode === 'preview' ? 'bg-[#002D62] text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <i className="ph-bold ph-browser"></i> WEB PREVIEW
                </button>
                <button 
                  onClick={() => setViewMode('code')}
                  className={`px-4 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${viewMode === 'code' ? 'bg-[#002D62] text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <i className="ph-bold ph-code"></i> HTML SOURCE
                </button>
              </div>

              {/* Nút lưu */}
              <div className="w-1/3 flex justify-end">
                <button 
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-6 h-10 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-900/10 flex items-center gap-1.5"
                >
                  {isSaving ? <><i className="ph-bold ph-spinner animate-spin"></i> ĐANG LƯU...</> : <><i className="ph-bold ph-floppy-disk"></i> LƯU KẾ HOẠCH</>}
                </button>
              </div>
            </div>

            {/* Vùng Workspace hiển thị nội dung tùy theo Mode */}
            <div className="flex-1 p-6 overflow-hidden">
              {viewMode === 'code' ? (
                /* CHẾ ĐỘ CODE: Biên tập mã nguồn HTML thô */
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full h-full p-6 bg-slate-950 border border-slate-800 rounded-2xl outline-none font-mono text-sm text-amber-100/90 leading-relaxed focus:border-blue-600 focus:ring-4 focus:ring-blue-900/10 transition-all resize-none shadow-inner"
                  placeholder="Viết mã HTML của bạn vào đây..."
                />
              ) : (
                /* CHẾ ĐỘ PREVIEW: Biên tập trực tiếp dạng giao diện Web thông qua iframe cách ly */
                <div className="w-full h-full bg-white rounded-2xl border border-slate-800 overflow-hidden shadow-2xl flex flex-col">
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-xs text-slate-400 font-mono flex items-center gap-2 select-none">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span className="ml-2 text-slate-500">Live Web Page Preview Render</span>
                  </div>
                  {/* Trình biên tập trực tiếp ContentEditable kết xuất mã HTML */}
                  <div 
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => setEditContent(e.currentTarget.innerHTML)}
                    dangerouslySetInnerHTML={{ __html: activePlan.html_content }}
                    className="flex-1 p-8 overflow-y-auto outline-none text-slate-800 prose prose-slate max-w-none bg-white font-normal"
                    style={{ minHeight: '100%' }}
                  />
                </div>
              )}
            </div>
          </>
        ) : (
          /* MÀN HÌNH TRỐNG KHI CHƯA CHỌN FILE NÀO */
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-slate-500">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700">
              <i className="ph-fill ph-file-html text-4xl text-slate-600"></i>
            </div>
            <h3 className="text-lg font-bold text-slate-400">Không có tài liệu nào đang mở</h3>
            <p className="text-sm text-slate-600 max-w-xs mt-1">Vui lòng chọn một kế hoạch hành động bên danh mục trái hoặc tạo mới một tệp tin để bắt đầu biên tập.</p>
          </div>
        )}
      </div>

    </div>
  );
}