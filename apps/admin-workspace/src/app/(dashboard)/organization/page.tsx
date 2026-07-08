'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

export default function OrganizationPage() {
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState<'structure' | 'employees' | 'chart'>('structure');
  const [isLoading, setIsLoading] = useState(true);

  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [newDept, setNewDept] = useState({ name: '', type: 'DEPARTMENT', parent_id: '' });
  const [newEmp, setNewEmp] = useState({ code: '', name: '', role: '', email: '', department_ids: [] as string[], manager_id: '' });

  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        supabase.from('departments').select('*').order('created_at', { ascending: true }),
        supabase.from('employees').select('*').order('created_at', { ascending: true })
      ]);
      if (deptRes.data) setDepartments(deptRes.data);
      if (empRes.data) setEmployees(empRes.data);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu tổ chức:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ==========================================
  // --- XỬ LÝ ĐƠN VỊ (PHÒNG BAN) ---
  // ==========================================
  const handleSaveDepartment = async () => {
    if (!newDept.name) return alert('Vui lòng nhập tên đơn vị!');
    if (editingDeptId && newDept.parent_id === editingDeptId) return alert('Lỗi: Một đơn vị không thể trực thuộc chính nó!');

    const payload = { name: newDept.name, type: newDept.type, parent_id: newDept.parent_id || null };

    if (editingDeptId) {
      const { error } = await supabase.from('departments').update(payload).eq('id', editingDeptId);
      if (error) alert('Lỗi cập nhật: ' + error.message);
      else { alert('✅ Cập nhật thành công!'); cancelEditDept(); fetchData(); }
    } else {
      const { error } = await supabase.from('departments').insert([payload]);
      if (error) alert('Lỗi tạo đơn vị: ' + error.message);
      else { setNewDept({ name: '', type: 'DEPARTMENT', parent_id: '' }); fetchData(); }
    }
  };

  const startEditDept = (dept: any) => {
    setEditingDeptId(dept.id);
    setNewDept({ name: dept.name, type: dept.type, parent_id: dept.parent_id || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditDept = () => {
    setEditingDeptId(null);
    setNewDept({ name: '', type: 'DEPARTMENT', parent_id: '' });
  };

  // 🚀 ĐÃ BỔ SUNG: Hàm xóa Đơn vị
  const handleDeleteDepartment = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa đơn vị "${name}" không?`)) return;
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) alert('Lỗi xóa đơn vị: ' + error.message);
    else { alert('🗑️ Đã xóa thành công!'); fetchData(); }
  };


  // ==========================================
  // --- XỬ LÝ NHÂN SỰ ---
  // ==========================================
  const handleSaveEmployee = async () => {
    if (!newEmp.code || !newEmp.name || !newEmp.role) return alert('Vui lòng nhập đủ Mã NV, Tên và Chức vụ!');
    if (editingEmpId && newEmp.manager_id === editingEmpId) return alert('Lỗi: Một người không thể tự làm quản lý trực tiếp của chính mình!');

    const payload = {
      code: newEmp.code, name: newEmp.name, role: newEmp.role,
      email: newEmp.email || null, 
      department_ids: newEmp.department_ids, 
      manager_id: newEmp.manager_id || null
    };

    if (editingEmpId) {
      const { error } = await supabase.from('employees').update(payload).eq('id', editingEmpId);
      if (error) alert('Lỗi cập nhật: ' + (error.code === '23505' ? 'Mã Nhân viên/Email bị trùng!' : error.message));
      else { alert('✅ Cập nhật thành công!'); cancelEditEmp(); fetchData(); }
    } else {
      const { error } = await supabase.from('employees').insert([payload]);
      if (error) alert('Lỗi thêm nhân sự: ' + (error.code === '23505' ? 'Mã Nhân viên/Email đã tồn tại!' : error.message));
      else { setNewEmp({ code: '', name: '', role: '', email: '', department_ids: [], manager_id: '' }); fetchData(); }
    }
  };

  const startEditEmp = (emp: any) => {
    setEditingEmpId(emp.id);
    setNewEmp({ code: emp.code, name: emp.name, role: emp.role, email: emp.email || '', department_ids: emp.department_ids || [], manager_id: emp.manager_id || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEditEmp = () => {
    setEditingEmpId(null);
    setNewEmp({ code: '', name: '', role: '', email: '', department_ids: [], manager_id: '' });
  };

  // 🚀 ĐÃ BỔ SUNG: Hàm xóa Nhân viên
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Cảnh báo: Xóa nhân viên "${name}" sẽ xóa tài khoản hệ thống của họ. Bạn chắc chứ?`)) return;
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) alert('Lỗi xóa nhân viên: ' + error.message);
    else { alert('🗑️ Đã xóa nhân viên thành công!'); fetchData(); }
  };

  const toggleDepartment = (deptId: string) => {
    setNewEmp(prev => {
      const ids = prev.department_ids || [];
      if (ids.includes(deptId)) return { ...prev, department_ids: ids.filter(id => id !== deptId) };
      else return { ...prev, department_ids: [...ids, deptId] };
    });
  };

  // --- HELPERS HIỂN THỊ ---
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'HEADQUARTER': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'BRANCH': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'DEPARTMENT': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getDeptName = (deptId: string) => departments.find(d => d.id === deptId)?.name || 'N/A';
  const getEmpName = (empId: string | null) => employees.find(e => e.id === empId)?.name || 'Không có';

  const renderDepartmentTags = (deptIds: string[] | null) => {
    if (!deptIds || deptIds.length === 0) return <span className="text-slate-400 text-[11px] italic">Chưa phân bổ</span>;
    return (
      <div className="flex flex-wrap gap-1.5">
        {deptIds.map(id => (
          <span key={id} className="px-2 py-0.5 bg-white text-slate-700 text-[10px] font-bold rounded-md border border-slate-200 shadow-sm whitespace-nowrap">
            {getDeptName(id)}
          </span>
        ))}
      </div>
    );
  };

  // --- SƠ ĐỒ BỘ MÁY TỔ CHỨC ---
  const renderOrgChart = (parentId: string | null = null, level = 0) => {
    const childDepts = departments.filter(d => d.parent_id === parentId);
    if (childDepts.length === 0) return null;

    return (
      <div className="flex flex-col w-full relative">
        {childDepts.map((dept, index) => {
          const deptEmployees = employees.filter(e => e.department_ids && e.department_ids.includes(dept.id));
          const isLast = index === childDepts.length - 1;

          return (
            <div key={dept.id} className="relative flex flex-col mt-4">
              {level > 0 && <div className={`absolute -top-4 -left-8 w-8 border-l-2 border-b-2 border-slate-300 rounded-bl-xl ${isLast ? 'h-12' : 'h-[calc(100%+16px)]'}`}></div>}
              <div className={`relative bg-white border ${level === 0 ? 'border-[#002D62] shadow-md ring-4 ring-[#002D62]/5' : 'border-slate-200 shadow-sm'} rounded-2xl p-5 z-10 w-full`}>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-md border uppercase tracking-wider ${getTypeBadge(dept.type)}`}>{dept.type.replace('_', ' ')}</span>
                    <h4 className={`font-black ${level === 0 ? 'text-xl text-[#002D62]' : 'text-lg text-slate-800'}`}>{dept.name}</h4>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg w-fit"><i className="ph-fill ph-users mr-1"></i> {deptEmployees.length} Nhân sự</span>
                </div>
                {deptEmployees.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {deptEmployees.map(emp => (
                      <div key={emp.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all group">
                        <div className="w-10 h-10 rounded-full bg-[#002D62] text-white flex items-center justify-center font-black shadow-sm group-hover:scale-110 transition-transform">{emp.name.charAt(0)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{emp.name}</p>
                          <p className="text-[11px] text-slate-500 font-medium truncate">{emp.role}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase">{emp.code}</span>
                            {emp.manager_id && <span className="text-[9px] font-medium text-slate-400 truncate border-l border-slate-300 pl-2">Sếp: {getEmpName(emp.manager_id)}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-slate-400 italic text-center bg-slate-50 py-4 rounded-xl border border-dashed border-slate-200">Chưa có nhân sự nào được phân bổ.</p>}
              </div>
              <div className="pl-12 relative">
                {childDepts.length > 0 && !isLast && <div className="absolute top-0 left-4 w-0.5 h-full bg-slate-300"></div>}
                {renderOrgChart(dept.id, level + 1)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) return <div className="p-20 text-center text-sm font-bold text-slate-400 animate-pulse tracking-widest uppercase">Đang tải bộ máy tổ chức...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* HEADER & TABS */}
      <div className="bg-white p-6 md:px-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-[#002D62]"></div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Quản lý Tổ chức & Nhân sự</h2>
        <div className="flex flex-wrap gap-2 mt-6 p-1 bg-slate-100 rounded-xl w-fit">
          <button onClick={() => setActiveTab('structure')} className={`px-5 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'structure' ? 'bg-white text-[#002D62] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><i className="ph-bold ph-git-branch mr-2"></i> Thiết lập Đơn vị</button>
          <button onClick={() => setActiveTab('employees')} className={`px-5 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'employees' ? 'bg-white text-[#002D62] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><i className="ph-bold ph-users mr-2"></i> Danh sách Nhân sự</button>
          <button onClick={() => setActiveTab('chart')} className={`px-5 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'chart' ? 'bg-[#002D62] text-white shadow-md' : 'text-slate-500 hover:text-slate-700'}`}><i className="ph-bold ph-tree-structure mr-2"></i> Sơ đồ Bộ máy</button>
        </div>
      </div>

      {/* TAB 1: ĐƠN VỊ */}
      {activeTab === 'structure' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className={`p-6 md:p-8 rounded-2xl border shadow-sm lg:col-span-1 transition-colors ${editingDeptId ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><i className={`ph-bold ${editingDeptId ? 'ph-pencil-simple text-amber-600' : 'ph-plus-circle text-blue-600'}`}></i> {editingDeptId ? 'Cập nhật Đơn vị' : 'Thêm Đơn vị mới'}</h3>
            <div className="space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Loại đơn vị</label><select value={newDept.type} onChange={e => setNewDept({...newDept, type: e.target.value})} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer"><option value="HEADQUARTER">Trụ sở chính</option><option value="BRANCH">Chi nhánh</option><option value="DEPARTMENT">Phòng ban</option></select></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên đơn vị</label><input type="text" value={newDept.name} onChange={e => setNewDept({...newDept, name: e.target.value})} placeholder="VD: Phòng Marketing..." className="w-full h-11 px-4 border rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10" /></div>
              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Trực thuộc</label><select value={newDept.parent_id} onChange={e => setNewDept({...newDept, parent_id: e.target.value})} className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer"><option value="">-- Không trực thuộc --</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
              <div className="pt-2 flex gap-2"><button onClick={handleSaveDepartment} className={`flex-1 h-11 text-white rounded-xl text-sm font-bold ${editingDeptId ? 'bg-amber-600' : 'bg-[#002D62] hover:bg-blue-900 transition-colors'}`}>{editingDeptId ? 'LƯU CẬP NHẬT' : 'TẠO ĐƠN VỊ'}</button>{editingDeptId && <button onClick={cancelEditDept} className="px-4 h-11 bg-white border text-slate-600 rounded-xl text-sm font-bold">HỦY</button>}</div>
            </div>
          </div>
          <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
             <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2"><i className="ph-bold ph-list-dashes text-blue-600"></i> Danh sách Đơn vị</h3>
             <div className="space-y-3">{departments.map(dept => (
                <div key={dept.id} className="flex items-center justify-between p-4 border rounded-xl hover:border-blue-300">
                  <div><span className={`text-[10px] font-bold px-2 py-1 rounded-md border uppercase ${getTypeBadge(dept.type)}`}>{dept.type.replace('_', ' ')}</span> <span className="font-bold text-slate-800 ml-2">{dept.name}</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => startEditDept(dept)} className="w-9 h-9 flex items-center justify-center font-bold text-sm rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100" title="Sửa"><i className="ph-bold ph-pencil-simple"></i></button>
                    {/* NÚT XÓA ĐƠN VỊ */}
                    <button onClick={() => handleDeleteDepartment(dept.id, dept.name)} className="w-9 h-9 flex items-center justify-center font-bold text-sm rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100" title="Xóa"><i className="ph-bold ph-trash"></i></button>
                  </div>
                </div>
             ))}</div>
          </div>
        </div>
      )}

      {/* TAB 2: NHÂN SỰ */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className={`p-6 rounded-2xl border shadow-sm transition-colors ${editingEmpId ? 'bg-amber-50 border-amber-300' : 'bg-gradient-to-br from-white to-slate-50 border-slate-200'}`}>
            <div className="flex flex-wrap gap-4 items-start">
              <div className="w-full md:w-28"><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Mã NV (*)</label><input type="text" value={newEmp.code} onChange={e => setNewEmp({...newEmp, code: e.target.value})} className="w-full h-11 px-3 border rounded-xl text-sm font-bold text-[#002D62] outline-none focus:ring-4 focus:ring-blue-500/10" /></div>
              <div className="flex-1 min-w-[200px]"><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Họ và Tên (*)</label><input type="text" value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} className="w-full h-11 px-4 border rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10" /></div>
              <div className="flex-1 min-w-[200px]"><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Email Hệ thống</label><input type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} className="w-full h-11 px-4 border rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10" /></div>
              <div className="w-full md:w-48"><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Chức vụ (*)</label><input type="text" value={newEmp.role} onChange={e => setNewEmp({...newEmp, role: e.target.value})} className="w-full h-11 px-4 border rounded-xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10" /></div>
              <div className="w-full md:w-48"><label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Sếp trực tiếp</label><select value={newEmp.manager_id} onChange={e => setNewEmp({...newEmp, manager_id: e.target.value})} className="w-full h-11 px-3 bg-white border rounded-xl text-sm font-bold cursor-pointer"><option value="">-- Không có --</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="block text-xs font-bold text-[#002D62] uppercase mb-2">Phân bổ Nơi làm việc (Có thể chọn nhiều)</label>
              <div className="flex flex-wrap gap-2 p-3 bg-white border border-slate-200 rounded-xl max-h-40 overflow-y-auto">
                {departments.length === 0 ? <span className="text-sm text-slate-400 italic">Vui lòng tạo Đơn vị trước</span> : departments.map(d => (
                  <label key={d.id} className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg cursor-pointer transition-colors select-none ${newEmp.department_ids.includes(d.id) ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                    <input type="checkbox" checked={newEmp.department_ids.includes(d.id)} onChange={() => toggleDepartment(d.id)} className="w-4 h-4 text-blue-600 rounded border-slate-300 cursor-pointer" />
                    <span className={`text-sm font-bold ${newEmp.department_ids.includes(d.id) ? 'text-blue-800' : 'text-slate-600'}`}>{d.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={handleSaveEmployee} className={`h-11 px-8 text-white rounded-xl text-sm font-bold shadow-md ${editingEmpId ? 'bg-amber-600' : 'bg-[#002D62] hover:bg-blue-900 transition-colors'}`}>{editingEmpId ? 'LƯU CẬP NHẬT' : 'THÊM NHÂN SỰ'}</button>
              {editingEmpId && <button onClick={cancelEditEmp} className="h-11 px-4 bg-white border text-slate-600 rounded-xl font-bold hover:bg-slate-50">HỦY</button>}
            </div>
          </div>

          <div className="bg-white rounded-2xl border shadow-sm overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead><tr className="bg-slate-50 border-b text-slate-500 text-xs uppercase tracking-wider"><th className="p-4 pl-6">Mã NV</th><th className="p-4">Nhân sự</th><th className="p-4">Chức vụ</th><th className="p-4">Trực thuộc (Các Đơn vị)</th><th className="p-4 text-center">Thao tác</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-slate-50">
                    <td className="p-4 pl-6 font-black text-[#002D62]">{emp.code}</td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{emp.name}</div>
                      {emp.email && <div className="text-xs text-slate-500"><i className="ph-fill ph-envelope-simple"></i> {emp.email}</div>}
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-bold">{emp.role}</td>
                    <td className="p-4 max-w-[250px]">{renderDepartmentTags(emp.department_ids)}</td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        {/* NÚT SỬA NHÂN VIÊN */}
                        <button onClick={() => startEditEmp(emp)} className="w-9 h-9 flex items-center justify-center font-bold text-sm rounded-lg bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 transition-colors" title="Sửa">
                          <i className="ph-bold ph-pencil-simple"></i>
                        </button>
                        {/* NÚT XÓA NHÂN VIÊN */}
                        <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="w-9 h-9 flex items-center justify-center font-bold text-sm rounded-lg bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-colors" title="Xóa">
                          <i className="ph-bold ph-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SƠ ĐỒ */}
      {activeTab === 'chart' && (
        <div className="bg-slate-50/50 p-6 md:p-8 rounded-3xl border shadow-inner min-h-[400px] overflow-x-auto">
           {departments.length === 0 ? <div className="text-center text-slate-500 italic mt-10">Vui lòng tạo đơn vị...</div> : renderOrgChart(null)}
        </div>
      )}
    </div>
  );
}