'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
// Nhớ đảm bảo anh đã tạo file này theo hướng dẫn ở bước trước nhé:
import { sendReviewNotificationAction } from '@/actions/notify.actions'; 

export default function ExecutionPage() {
  const supabase = createClient();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [initiatives, setInitiatives] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  // ================= TABS & STATES =================
  const [detailTab, setDetailTab] = useState<'info' | 'tasks' | 'chat'>('info');
  const [chatChannel, setChatChannel] = useState<'PRIVATE' | 'TEAM'>('PRIVATE');
  const [comments, setComments] = useState<any[]>([]);
  
  // REAL DATA CHO TASKS
  const [subTasks, setSubTasks] = useState<any[]>([]);
  
  // FORM TẠO VIỆC CÓ THÊM URL ĐÍNH KÈM
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({ title: '', type: 'CONTENT', assignee_id: '', deadline: '', resource_url: '' });

  // STATE CHO TÍNH NĂNG PREVIEW TÀI LIỆU
  const [previewModal, setPreviewModal] = useState<{isOpen: boolean, url: string, title: string}>({isOpen: false, url: '', title: ''});

  // STATE CHO MODAL CHỌN NGƯỜI DUYỆT & GỬI EMAIL
  const [reviewModal, setReviewModal] = useState<{isOpen: boolean, taskId: string, taskTitle: string, assigneeName: string}>({isOpen: false, taskId: '', taskTitle: '', assigneeName: ''});
  const [selectedReviewerId, setSelectedReviewerId] = useState('');
  const [isSendingReview, setIsSendingReview] = useState(false);

  const [newComment, setNewComment] = useState('');

  // Giả lập User đang đăng nhập (Thực tế lấy từ Supabase Auth)
  const currentUser = { name: 'Ban Lãnh Đạo', role: 'CEO' }; 

  const fetchData = async () => {
    setIsLoading(true);
    const [deptRes, empRes] = await Promise.all([
      supabase.from('departments').select('*'),
      supabase.from('employees').select('*')
    ]);
    if (deptRes.data) setDepartments(deptRes.data);
    if (empRes.data) setEmployees(empRes.data);

    const { data: plan } = await supabase.from('strategic_plans').select('id').eq('year', parseInt(selectedYear)).maybeSingle();
    if (plan) {
      const { data: ints } = await supabase.from('initiatives').select('*').eq('plan_id', plan.id).order('created_at', { ascending: false });
      setInitiatives(ints || []);
      if (ints && ints.length > 0 && !selectedTask) {
        setSelectedTask(ints[0]);
        fetchComments(ints[0].id);
        fetchSubTasks(ints[0].id); 
      }
    } else {
      setInitiatives([]);
      setSelectedTask(null);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchData(); }, [selectedYear]);

  // LOAD BÌNH LUẬN
  const fetchComments = async (taskId: string) => {
    const { data } = await supabase.from('initiative_comments').select('*').eq('initiative_id', taskId).order('created_at', { ascending: true });
    setComments(data || []);
  };

  // LOAD CÔNG VIỆC THỰC TẾ (REAL DATA)
  const fetchSubTasks = async (taskId: string) => {
    const { data } = await supabase.from('initiative_tasks').select('*').eq('initiative_id', taskId).order('created_at', { ascending: false });
    setSubTasks(data || []);
  };

  const handleSelectTask = (task: any) => {
    setSelectedTask(task);
    fetchComments(task.id);
    fetchSubTasks(task.id);
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;
    setIsSaving(true);
    const { error } = await supabase.from('initiatives').update({
      department_id: selectedTask.department_id || null, lead_id: selectedTask.lead_id || null,
      start_date: selectedTask.start_date || null, end_date: selectedTask.end_date || null,
      status: selectedTask.status, progress: selectedTask.progress || 0
    }).eq('id', selectedTask.id);
    if (error) alert('Lỗi cập nhật: ' + error.message);
    else fetchData();
    setIsSaving(false);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    const payload = {
      initiative_id: selectedTask.id,
      sender_name: currentUser.name,
      sender_role: currentUser.role,
      content: newComment,
      channel: chatChannel
    };
    await supabase.from('initiative_comments').insert([payload]);
    setComments([...comments, { ...payload, id: Math.random().toString(), created_at: new Date().toISOString() }]);
    setNewComment('');
  };

  // ================= TẠO & CẬP NHẬT CÔNG VIỆC THỰC TẾ =================
  const handleCreateTask = async () => {
    if (!newTaskForm.title || !newTaskForm.assignee_id) return alert('Vui lòng nhập tên công việc và chọn người thực hiện!');
    setIsSaving(true);
    
    const payload = {
      ...newTaskForm,
      initiative_id: selectedTask.id,
      status: 'TODO'
    };

    const { error } = await supabase.from('initiative_tasks').insert([payload]);
    if (error) {
      alert('Lỗi tạo công việc: ' + error.message);
    } else {
      setIsTaskModalOpen(false);
      setNewTaskForm({ title: '', type: 'CONTENT', assignee_id: '', deadline: '', resource_url: '' });
      fetchSubTasks(selectedTask.id);
    }
    setIsSaving(false);
  };

  const updateSubTaskStatus = async (taskId: string, newStatus: string) => {
    // 1. Cập nhật UI ngay lập tức để mượt mà (Optimistic UI Update)
    setSubTasks(subTasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    // 2. Gửi request xuống DB
    const { error } = await supabase.from('initiative_tasks').update({ status: newStatus }).eq('id', taskId);
    if (error) {
      alert('Lỗi cập nhật trạng thái: ' + error.message);
      fetchSubTasks(selectedTask.id);
    }
  };

  // ================= GỬI YÊU CẦU PHÊ DUYỆT =================
  const handleSubmitReview = async () => {
    if (!selectedReviewerId) return alert('Vui lòng chọn người duyệt!');
    setIsSendingReview(true);
  
    const reviewer = employees.find(e => e.id === selectedReviewerId);
    const taskId = reviewModal.taskId;
  
    // 1. Cập nhật DB: Chuyển status sang REVIEW và gán reviewer_id
    const { error } = await supabase.from('initiative_tasks')
      .update({ status: 'REVIEW', reviewer_id: selectedReviewerId })
      .eq('id', taskId);
  
    if (error) {
      alert('Lỗi gửi duyệt: ' + error.message);
      setIsSendingReview(false);
      return;
    }
  
    // 2. Gửi Email thông báo (gọi Server Action)
    if (reviewer && reviewer.email) {
      // Tạo link trực tiếp đến trang này
      const taskUrl = `${window.location.origin}/admin/execution`; 
      
      await sendReviewNotificationAction({
        reviewerEmail: reviewer.email,
        reviewerName: reviewer.name,
        taskTitle: reviewModal.taskTitle,
        assigneeName: reviewModal.assigneeName,
        taskUrl: taskUrl
      });
    }
  
    // 3. Cập nhật UI
    setSubTasks(subTasks.map(t => t.id === taskId ? { ...t, status: 'REVIEW', reviewer_id: selectedReviewerId } : t));
    setReviewModal({ isOpen: false, taskId: '', taskTitle: '', assigneeName: '' });
    setSelectedReviewerId('');
    setIsSendingReview(false);
    alert('Đã gửi yêu cầu phê duyệt thành công!');
  };

  // ================= HÀM XỬ LÝ LINK THÔNG MINH (EMBED URL) =================
  const getEmbedUrl = (url: string) => {
    if (!url) return '';
    try {
      // Ép Google Docs / Sheets / Slides sang chế độ preview
      if (url.includes('docs.google.com')) {
        return url.replace(/\/edit.*$/, '/preview');
      }
      // Hỗ trợ link Canva
      if (url.includes('canva.com/design')) {
        if (!url.includes('?embed')) return url.split('?')[0] + '?embed';
      }
      // Hỗ trợ Figma
      if (url.includes('figma.com')) {
        return `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(url)}`;
      }
      return url;
    } catch (e) {
      return url;
    }
  };

  const getDeptName = (id: string) => departments.find(d => d.id === id)?.name || 'Chưa giao';
  const getLeadName = (id: string) => employees.find(e => e.id === id)?.name || 'Chưa có PIC';
  const getEmpName = (id: string) => employees.find(e => e.id === id)?.name || '---';
  
  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'ON_TRACK': return { color: 'text-emerald-700', bg: 'bg-emerald-100', bar: 'bg-emerald-500', label: 'ON TRACK' };
      case 'AT_RISK': return { color: 'text-rose-700', bg: 'bg-rose-100', bar: 'bg-rose-500', label: 'AT RISK' };
      case 'COMPLETED': return { color: 'text-blue-700', bg: 'bg-blue-100', bar: 'bg-blue-600', label: 'COMPLETED' };
      default: return { color: 'text-slate-600', bg: 'bg-slate-100', bar: 'bg-slate-400', label: 'PLANNING' };
    }
  };

  if (isLoading) return <div className="p-20 text-center text-sm font-semibold text-slate-400 animate-pulse tracking-widest uppercase">Đang đồng bộ dữ liệu thực thi...</div>;
  const currentComments = comments.filter(c => c.channel === chatChannel);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20 relative h-[calc(100vh-100px)] flex flex-col">
      
      {/* HEADER */}
      <div className="shrink-0 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center"><i className="ph ph-kanban text-2xl font-bold"></i></div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Trung tâm Theo dõi Thực thi</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Phân bổ nguồn lực & Đốc thúc OKRs</p>
            </div>
         </div>
         <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-[#002D62] outline-none focus:border-[#002D62] transition-all cursor-pointer">
            <option value="2026">Mục tiêu Năm 2026</option><option value="2027">Mục tiêu Năm 2027</option>
         </select>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* CỘT TRÁI: DANH SÁCH */}
        <div className="w-full lg:w-5/12 xl:w-1/3 bg-white border border-slate-200 shadow-sm rounded-[2rem] flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-black text-slate-800">Danh sách Sáng kiến ({initiatives.length})</h3>
            <p className="text-xs text-slate-500 mt-1 font-medium">Click vào một mục để xem và phân việc</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scroll-smooth">
            {initiatives.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400 italic">Chưa có sáng kiến nào.</div>
            ) : (
              initiatives.map(task => {
                const conf = getStatusConfig(task.status);
                const isSelected = selectedTask?.id === task.id;
                return (
                  <div key={task.id} onClick={() => handleSelectTask(task)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${isSelected ? 'bg-[#002D62] border-[#002D62] shadow-md transform scale-[1.02]' : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50'}`}>
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <h4 className={`text-sm font-bold line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-800'}`}>{task.title}</h4>
                      <span className={`shrink-0 text-[9px] font-black px-2 py-1 rounded-md tracking-wider ${isSelected ? 'bg-white/20 text-white' : `${conf.bg} ${conf.color}`}`}>{conf.label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-auto">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shadow-inner ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>{getLeadName(task.lead_id).charAt(0)}</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>{getDeptName(task.department_id)}</span>
                          <span className={`text-[10px] font-black ${isSelected ? 'text-white' : 'text-slate-700'}`}>{task.progress || 0}%</span>
                        </div>
                        <div className={`w-full h-1.5 rounded-full overflow-hidden ${isSelected ? 'bg-white/10' : 'bg-slate-100'}`}>
                           <div className={`h-full rounded-full ${isSelected ? 'bg-amber-400' : conf.bar}`} style={{ width: `${task.progress || 0}%` }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* CỘT PHẢI: CHI TIẾT */}
        <div className="w-full lg:w-7/12 xl:w-2/3 bg-white border border-slate-200 shadow-sm rounded-[2rem] flex flex-col relative overflow-hidden">
          {!selectedTask ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center"><i className="ph ph-hand-pointing text-6xl mb-4 opacity-20"></i><p className="font-medium">Vui lòng chọn một sáng kiến bên trái để xử lý.</p></div>
          ) : (
            <>
              {/* Header của Detail (Có TABS) */}
              <div className="px-6 pt-6 md:px-8 md:pt-8 bg-slate-50/50 flex flex-col gap-5">
                 <div className="flex justify-between items-start gap-4">
                   <div>
                     <span className={`text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider ${getStatusConfig(selectedTask.status).bg} ${getStatusConfig(selectedTask.status).color}`}>
                       {getStatusConfig(selectedTask.status).label}
                     </span>
                     <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-3 leading-snug">{selectedTask.title}</h2>
                   </div>
                   <button onClick={handleUpdateTask} disabled={isSaving || detailTab === 'chat'} className={`shrink-0 h-11 px-6 rounded-xl text-sm font-black transition-all ${detailTab === 'chat' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 text-[#002D62] shadow-lg shadow-amber-500/20'}`}>
                     {isSaving ? 'ĐANG LƯU...' : 'LƯU CẬP NHẬT'}
                   </button>
                 </div>

                 {/* TABS SELECTOR */}
                 <div className="flex gap-6 border-b border-slate-200">
                    <button onClick={() => setDetailTab('info')} className={`pb-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${detailTab === 'info' ? 'border-[#002D62] text-[#002D62]' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                      <i className="ph ph-info"></i> Thông tin Phân bổ
                    </button>
                    <button onClick={() => setDetailTab('tasks')} className={`pb-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${detailTab === 'tasks' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                      <i className="ph ph-list-checks"></i> Quy trình & Giao việc
                    </button>
                    <button onClick={() => setDetailTab('chat')} className={`pb-3 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${detailTab === 'chat' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>
                      <i className="ph ph-chats-circle"></i> Chỉ đạo & Thảo luận <span className="bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full">{comments.length}</span>
                    </button>
                 </div>
              </div>

              {/* NỘI DUNG TABS */}
              <div className="flex-1 overflow-y-auto bg-white scroll-smooth relative flex flex-col">
                
                {/* TAB 1: THÔNG TIN PHÂN BỔ */}
                {detailTab === 'info' && (
                  <div className="p-6 md:p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><i className="ph ph-buildings text-lg text-blue-600"></i> Phòng ban chủ quản</label><select value={selectedTask.department_id || ''} onChange={e => setSelectedTask({...selectedTask, department_id: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"><option value="">-- Chọn Đơn vị thực thi --</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><i className="ph ph-user-circle-gear text-lg text-amber-600"></i> Trưởng nhóm / PIC</label><select value={selectedTask.lead_id || ''} onChange={e => setSelectedTask({...selectedTask, lead_id: e.target.value})} className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:bg-white focus:border-amber-400 focus:ring-4 focus:ring-amber-500/10 transition-all cursor-pointer"><option value="">-- Chọn Người chịu trách nhiệm --</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name} - {e.role}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Ngày bắt đầu</label><input type="date" value={selectedTask.start_date || ''} onChange={e => setSelectedTask({...selectedTask, start_date: e.target.value})} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-blue-400 transition-all" /></div>
                      <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest text-rose-600">Hạn chót (Deadline)</label><input type="date" value={selectedTask.end_date || ''} onChange={e => setSelectedTask({...selectedTask, end_date: e.target.value})} className="w-full h-11 px-4 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-rose-400 transition-all" /></div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <label className="text-sm font-black text-slate-800 uppercase tracking-widest">Tình trạng thực thi</label>
                        <select value={selectedTask.status} onChange={e => setSelectedTask({...selectedTask, status: e.target.value})} className={`h-11 px-4 border rounded-xl text-xs font-black outline-none cursor-pointer transition-all ${getStatusConfig(selectedTask.status).bg} ${getStatusConfig(selectedTask.status).color} border-transparent focus:ring-4 focus:ring-slate-500/10`}><option value="PLANNING">ĐANG LÊN KẾ HOẠCH</option><option value="ON_TRACK">ĐANG TIẾN HÀNH (ON TRACK)</option><option value="AT_RISK">CÓ RỦI RO (AT RISK)</option><option value="COMPLETED">ĐÃ HOÀN THÀNH</option></select>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-end"><label className="text-sm font-black text-slate-800 uppercase tracking-widest">Tiến độ hoàn thành</label><span className="text-3xl font-black text-[#002D62]">{selectedTask.progress || 0}%</span></div>
                        <input type="range" min="0" max="100" step="5" value={selectedTask.progress || 0} onChange={e => setSelectedTask({...selectedTask, progress: parseInt(e.target.value)})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#002D62]" />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: QUY TRÌNH & GIAO VIỆC */}
                {detailTab === 'tasks' && (
                  <div className="p-6 md:p-8">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-slate-800 text-lg">Danh sách Hạng mục Công việc</h3>
                      <button onClick={() => setIsTaskModalOpen(true)} className="h-10 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                        <i className="ph-bold ph-plus"></i> Giao việc mới
                      </button>
                    </div>

                    <div className="space-y-4">
                      {subTasks.length === 0 ? (
                        <div className="text-center p-8 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                           Chưa có hạng mục công việc chi tiết nào được giao.
                        </div>
                      ) : (
                        subTasks.map(task => (
                          <div key={task.id} className="p-4 border border-slate-200 rounded-2xl hover:shadow-md transition-shadow bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                            
                            {/* Info */}
                            <div className="flex gap-4 items-start md:items-center flex-1">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                task.type === 'CONTENT' ? 'bg-blue-50 text-blue-600' : 
                                task.type === 'DESIGN' ? 'bg-purple-50 text-purple-600' : 'bg-rose-50 text-rose-600'
                              }`}>
                                <i className={`ph-fill ${task.type === 'CONTENT' ? 'ph-file-text' : task.type === 'DESIGN' ? 'ph-palette' : 'ph-video-camera'} text-xl`}></i>
                              </div>
                              <div className="flex-1">
                                <h4 className="text-sm font-black text-slate-900 line-clamp-1">{task.title}</h4>
                                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs font-bold text-slate-500">
                                  <span className="flex items-center gap-1"><i className="ph-fill ph-user-circle"></i> {getEmpName(task.assignee_id)}</span>
                                  <span className="flex items-center gap-1 text-rose-500"><i className="ph-bold ph-clock"></i> Deadline: {task.deadline || 'Chưa hẹn'}</span>
                                  
                                  {/* HIỂN THỊ NÚT PREVIEW NẾU CÓ URL ĐÍNH KÈM */}
                                  {task.resource_url && (
                                    <button onClick={() => setPreviewModal({isOpen: true, url: task.resource_url, title: task.title})} className="ml-2 text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded flex items-center gap-1 transition-colors">
                                      <i className="ph-bold ph-arrow-square-out"></i> Xem đính kèm
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Workflow Actions */}
                            <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100 shrink-0">
                              
                              {(task.status === 'TODO' || task.status === 'IN_PROGRESS') && (
                                <div className="flex items-center gap-2 w-full justify-end">
                                  <button 
                                    onClick={() => setReviewModal({ isOpen: true, taskId: task.id, taskTitle: task.title, assigneeName: getEmpName(task.assignee_id) })} 
                                    className="h-8 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-[10px] font-black flex items-center gap-1 transition-colors uppercase tracking-wider border border-indigo-200"
                                  >
                                    <i className="ph-bold ph-paper-plane-right"></i> Gửi duyệt
                                  </button>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                    {task.status === 'TODO' ? 'Chưa bắt đầu' : 'Đang xử lý'}
                                  </span>
                                </div>
                              )}

                              {task.status === 'REVIEW' && (
                                <>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg mr-2 animate-pulse">Sếp phê duyệt</span>
                                  <button onClick={() => updateSubTaskStatus(task.id, 'IN_PROGRESS')} className="w-8 h-8 rounded-lg bg-white border border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-colors" title="Từ chối / Yêu cầu sửa"><i className="ph-bold ph-x"></i></button>
                                  <button onClick={() => updateSubTaskStatus(task.id, 'APPROVED')} className="h-8 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black flex items-center justify-center gap-1 transition-colors shadow-sm"><i className="ph-bold ph-check"></i> DUYỆT BÀI</button>
                                </>
                              )}

                              {task.status === 'APPROVED' && (
                                <div className="flex items-center gap-2 w-full justify-end">
                                  <span className="text-xs font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100 flex items-center gap-1">
                                    <i className="ph-fill ph-check-circle"></i> ĐÃ DUYỆT
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 3: CHAT (Đã rút gọn) */}
                {detailTab === 'chat' && (
                  <div className="flex-1 flex flex-col h-full bg-slate-50/30">
                    <div className="p-4 flex gap-2 border-b border-slate-100 bg-white shrink-0">
                      <button onClick={() => setChatChannel('PRIVATE')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${chatChannel === 'PRIVATE' ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                        <i className="ph ph-lock-key"></i> Kênh Mật (Sếp & PIC)
                      </button>
                      <button onClick={() => setChatChannel('TEAM')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all flex items-center justify-center gap-2 ${chatChannel === 'TEAM' ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                        <i className="ph ph-users-three"></i> Kênh Team Nội Bộ
                      </button>
                    </div>

                    <div className="flex-1 p-6 overflow-y-auto space-y-6">
                       {currentComments.map((msg, idx) => (
                           <div key={idx} className={`flex gap-3 ${msg.sender_name === currentUser.name ? 'flex-row-reverse' : ''}`}>
                             <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-black shrink-0">{msg.sender_name.charAt(0)}</div>
                             <div className={`max-w-[75%] flex flex-col ${msg.sender_name === currentUser.name ? 'items-end' : 'items-start'}`}>
                               <div className="flex items-center gap-2 mb-1">
                                 <span className="text-xs font-bold text-slate-700">{msg.sender_name}</span>
                               </div>
                               <div className={`p-3 text-sm font-medium rounded-2xl ${msg.sender_name === currentUser.name ? 'bg-[#002D62] text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'}`}>
                                 {msg.content}
                               </div>
                             </div>
                           </div>
                         ))}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100 shrink-0">
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl focus-within:border-blue-400 focus-within:ring-4 focus-within:ring-blue-500/10">
                        <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendComment()} placeholder="Nhập tin nhắn..." className="flex-1 bg-transparent outline-none px-4 text-sm font-medium" />
                        <button onClick={handleSendComment} className="w-10 h-10 rounded-xl bg-amber-500 text-[#002D62] flex items-center justify-center hover:bg-amber-400">
                          <i className="ph ph-paper-plane-right font-black"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL GIAO VIỆC MỚI */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-6 bg-[#002D62] border-b border-blue-900 flex justify-between items-center">
              <h3 className="text-lg font-black text-white flex items-center gap-2"><i className="ph-bold ph-plus-circle text-amber-500"></i> Giao việc mới</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-blue-300 hover:text-white"><i className="ph-bold ph-x text-lg"></i></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tiêu đề công việc (*)</label>
                <input type="text" value={newTaskForm.title} onChange={e => setNewTaskForm({...newTaskForm, title: e.target.value})} className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400" placeholder="VD: Thiết kế Banner..." />
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Phân loại</label>
                <select value={newTaskForm.type} onChange={e => setNewTaskForm({...newTaskForm, type: e.target.value})} className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400">
                  <option value="CONTENT">Sáng tạo Nội dung (Content)</option>
                  <option value="DESIGN">Thiết kế Hình ảnh (Design)</option>
                  <option value="VIDEO">Dựng Video / Media</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Người thực hiện (*)</label>
                  <select value={newTaskForm.assignee_id} onChange={e => setNewTaskForm({...newTaskForm, assignee_id: e.target.value})} className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400">
                    <option value="">-- Chọn nhân sự --</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Deadline</label>
                  <input type="date" value={newTaskForm.deadline} onChange={e => setNewTaskForm({...newTaskForm, deadline: e.target.value})} className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-400" />
                </div>
              </div>

              {/* INPUT URL TÀI LIỆU (CANVA, GOOGLE DOCS) */}
              <div className="space-y-2 border-t border-slate-100 pt-4 mt-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <i className="ph-bold ph-link text-indigo-500"></i> Đường dẫn đính kèm (Tùy chọn)
                </label>
                <input type="url" value={newTaskForm.resource_url} onChange={e => setNewTaskForm({...newTaskForm, resource_url: e.target.value})} className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-indigo-400 text-blue-600 placeholder-slate-300" placeholder="Link Canva, Google Docs, Figma..." />
                <p className="text-[10px] text-slate-400">Hệ thống sẽ tự động hiển thị Preview đối với link Google & Canva.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setIsTaskModalOpen(false)} className="h-10 px-5 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors">HỦY</button>
              <button onClick={handleCreateTask} disabled={isSaving} className="h-10 px-6 bg-amber-500 text-[#002D62] font-black text-sm rounded-xl shadow-md hover:bg-amber-400 transition-colors disabled:opacity-50">
                {isSaving ? 'ĐANG LƯU...' : 'GIAO VIỆC NGAY'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL CHỌN NGƯỜI DUYỆT ================= */}
      {reviewModal.isOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-5 bg-indigo-600 border-b border-indigo-700 flex justify-between items-center">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <i className="ph-bold ph-paper-plane-right text-indigo-200"></i> Gửi Yêu Cầu Phê Duyệt
              </h3>
              <button onClick={() => setReviewModal({...reviewModal, isOpen: false})} className="text-indigo-200 hover:text-white"><i className="ph-bold ph-x text-lg"></i></button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Công việc cần duyệt</p>
                <p className="text-sm font-black text-indigo-900">{reviewModal.taskTitle}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Chọn Sếp / Người duyệt (*)</label>
                <select value={selectedReviewerId} onChange={e => setSelectedReviewerId(e.target.value)} className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 cursor-pointer">
                  <option value="">-- Chọn người nhận thông báo --</option>
                  {employees.filter(e => e.role?.includes('ADMIN') || e.role === 'SUPER_ADMIN' || e.role === 'MANAGER').map(e => (
                    <option key={e.id} value={e.id}>{e.name} - {e.role}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-4 bg-slate-50 flex justify-end gap-3 border-t border-slate-100">
              <button onClick={() => setReviewModal({...reviewModal, isOpen: false})} className="h-10 px-5 text-slate-500 font-bold text-sm hover:bg-slate-200 rounded-xl transition-colors">HỦY</button>
              <button onClick={handleSubmitReview} disabled={isSendingReview || !selectedReviewerId} className="h-10 px-6 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-md hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                {isSendingReview ? <><i className="ph-bold ph-spinner animate-spin"></i> ĐANG GỬI...</> : 'GỬI DUYỆT & GỬI MAIL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL PREVIEW TÀI LIỆU TRÀN MÀN HÌNH ================= */}
      {previewModal.isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 md:p-8 animate-in fade-in">
          <div className="w-full max-w-6xl h-full flex flex-col bg-white rounded-3xl overflow-hidden shadow-2xl">
            {/* Thanh tiêu đề Modal Preview */}
            <div className="h-14 px-6 bg-[#002D62] flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <i className="ph-fill ph-file-code text-amber-400 text-xl"></i>
                <h3 className="text-white font-bold text-sm truncate">{previewModal.title}</h3>
              </div>
              <div className="flex items-center gap-4">
                <a href={previewModal.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-200 hover:text-white flex items-center gap-1 transition-colors">
                  <i className="ph-bold ph-arrow-square-out"></i> Mở tab mới
                </a>
                <button onClick={() => setPreviewModal({isOpen: false, url: '', title: ''})} className="w-8 h-8 rounded-full bg-white/10 hover:bg-rose-500 text-white flex items-center justify-center transition-colors">
                  <i className="ph-bold ph-x"></i>
                </button>
              </div>
            </div>
            
            {/* Khung Iframe nhúng tài liệu */}
            <div className="flex-1 bg-slate-100 relative">
              <iframe 
                src={getEmbedUrl(previewModal.url)} 
                className="w-full h-full absolute inset-0 border-none"
                title="Document Preview"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}