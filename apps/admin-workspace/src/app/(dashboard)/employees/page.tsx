'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';

export default function EmployeeRolesPage() {
  const supabase = createClient();
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // STATE CHO MODAL THÊM/SỬA
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [currentEmpId, setCurrentEmpId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    email: '',
    role: 'STAFF'
  });

  const SYSTEM_ROLES = [
    { value: 'SUPER_ADMIN', label: 'Super Admin', color: 'bg-rose-100 text-rose-700' },
    { value: 'ADMIN', label: 'Admin Tổng', color: 'bg-indigo-100 text-indigo-700' },
    { value: 'STAFF', label: 'Nhân viên', color: 'bg-slate-100 text-slate-700' },
    { value: 'ADMIN_BIZLINK', label: 'Quản lý Biz-Link', color: 'bg-amber-100 text-amber-700' },
    { value: 'ADMIN_TALENT', label: 'Quản lý Nhân sự', color: 'bg-emerald-100 text-emerald-700' },
  ];

  const fetchData = async () => {
    setLoading(true);
    const [empRes, deptRes] = await Promise.all([
      supabase.from('employees').select('id, code, name, email, role, is_active, department_ids').order('created_at', { ascending: false }),
      supabase.from('departments').select('id, name')
    ]);
    if (empRes.data) setEmployees(empRes.data);
    if (deptRes.data) setDepartments(deptRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ĐỔI QUYỀN NHANH QUA DROPDOWN
  const handleRoleChange = async (employeeId: string, newRole: string) => {
    const { error } = await supabase.from('employees').update({ role: newRole }).eq('id', employeeId);
    if (!error) setEmployees(employees.map(emp => emp.id === employeeId ? { ...emp, role: newRole } : emp));
    else alert('Lỗi cập nhật quyền: ' + error.message);
  };

  // KHÓA/MỞ TÀI KHOẢN
  const handleToggleActive = async (employeeId: string, currentStatus: boolean) => {
    const { error } = await supabase.from('employees').update({ is_active: !currentStatus }).eq('id', employeeId);
    if (!error) setEmployees(employees.map(emp => emp.id === employeeId ? { ...emp, is_active: !currentStatus } : emp));
  };

  // MỞ MODAL THÊM MỚI
  const openAddModal = () => {
    setModalMode('add');
    setCurrentEmpId(null);
    setFormData({ code: '', name: '', email: '', role: 'STAFF' });
    setShowModal(true);
  };

  // MỞ MODAL SỬA
  const openEditModal = (emp: any) => {
    setModalMode('edit');
    setCurrentEmpId(emp.id);
    setFormData({ 
      code: emp.code || '', 
      name: emp.name || '', 
      email: emp.email || '', 
      role: emp.role || 'STAFF' 
    });
    setShowModal(true);
  };

  // LƯU DỮ LIỆU THÊM/SỬA
  const handleSaveEmployee = async () => {
    if (!formData.code || !formData.name) return alert('Vui lòng nhập đủ Mã NV và Tên nhân viên!');
    setIsSaving(true);

    if (modalMode === 'add') {
      const { data, error } = await supabase.from('employees').insert([formData]).select().single();
      if (error) {
        alert('Lỗi thêm mới: ' + error.message);
      } else if (data) {
        setEmployees([data, ...employees]);
        alert('✅ Đã cấp tài khoản nhân sự mới thành công!');
        setShowModal(false);
      }
    } else {
      const { data, error } = await supabase.from('employees').update(formData).eq('id', currentEmpId).select().single();
      if (error) {
        alert('Lỗi cập nhật: ' + error.message);
      } else if (data) {
        setEmployees(employees.map(emp => emp.id === currentEmpId ? data : emp));
        alert('✅ Cập nhật thông tin thành công!');
        setShowModal(false);
      }
    }
    setIsSaving(false);
  };

  // XÓA NHÂN SỰ
  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`CẢNH BÁO: Bạn có chắc chắn muốn xóa vĩnh viễn nhân viên "${name}" khỏi hệ thống không?`)) return;
    
    const { error } = await supabase.from('employees').delete().eq('id', id);
    if (error) {
      alert('Lỗi xóa nhân sự: ' + error.message);
    } else {
      setEmployees(employees.filter(emp => emp.id !== id));
      alert('🗑️ Đã xóa nhân sự thành công!');
    }
  };

  const getDeptName = (deptId: string) => departments.find(d => d.id === deptId)?.name || 'N/A';

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      
      {/* HEADER TỔNG */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Phân quyền Hệ thống</h2>
          <p className="text-sm text-slate-500 font-medium">Thiết lập vai trò truy cập Admin Workspace và cấp Email định danh.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="px-6 py-2.5 bg-[#002D62] text-white font-bold rounded-xl hover:bg-blue-900 shadow-md transition-colors flex items-center gap-2"
        >
          <i className="ph-bold ph-plus"></i> THÊM NHÂN SỰ
        </button>
      </div>

      {/* BẢNG DỮ LIỆU */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-6 py-4">Mã NV</th>
                <th className="px-6 py-4">Nhân sự & Tài khoản</th>
                <th className="px-6 py-4">Đơn vị công tác</th>
                <th className="px-6 py-4">Vai trò hệ thống</th>
                <th className="px-6 py-4 text-center">Trạng thái</th>
                <th className="px-6 py-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium animate-pulse">Đang tải dữ liệu...</td></tr>
              ) : employees.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">Chưa có nhân sự nào trong hệ thống.</td></tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4"><span className="font-black text-[#002D62] bg-blue-50 px-2.5 py-1 rounded-md text-xs border border-blue-100">{emp.code}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600">{emp.name.charAt(0)}</div>
                        <div>
                          <div className="font-bold text-slate-900 text-base">{emp.name}</div>
                          {emp.email ? (
                            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><i className="ph-fill ph-envelope-simple text-slate-400"></i> {emp.email}</div>
                          ) : (
                            <div className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 mt-1 inline-flex items-center gap-1"><i className="ph-bold ph-warning-circle"></i> Chưa gán Email</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-[200px]">
                      {(!emp.department_ids || emp.department_ids.length === 0) ? <span className="text-slate-400 text-xs italic">Chưa phân bổ</span> : (
                        <div className="flex flex-wrap gap-1.5">
                          {emp.department_ids.map((id: string) => <span key={id} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md border border-slate-200 whitespace-nowrap">{getDeptName(id)}</span>)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const roleObj = SYSTEM_ROLES.find(r => r.value === emp.role);
                        return <span className={`px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-black border ${roleObj ? roleObj.color : 'bg-slate-50 border-slate-200'}`}>{roleObj ? roleObj.label : emp.role}</span>;
                      })()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button onClick={() => handleToggleActive(emp.id, emp.is_active)} className={`px-3 py-1.5 rounded-md text-[10px] uppercase tracking-wider font-black border transition-colors ${emp.is_active ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'text-rose-700 bg-rose-50 border-rose-200 hover:bg-rose-100'}`}>
                        {emp.is_active ? 'ĐANG MỞ' : 'ĐÃ KHÓA'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Đổi quyền nhanh */}
                        <select
                          value={emp.role || ''}
                          onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                          className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1.5 cursor-pointer outline-none hover:border-blue-400 transition-colors"
                          title="Đổi quyền nhanh"
                        >
                          <option value="" disabled>-- Đổi quyền --</option>
                          {SYSTEM_ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                        </select>
                        
                        {/* Nút Sửa */}
                        <button onClick={() => openEditModal(emp)} className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center hover:bg-amber-100 transition-colors" title="Sửa thông tin">
                          <i className="ph-bold ph-pencil-simple text-sm"></i>
                        </button>

                        {/* Nút Xóa */}
                        <button onClick={() => handleDeleteEmployee(emp.id, emp.name)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center hover:bg-rose-100 hover:text-rose-700 transition-colors" title="Xóa nhân viên">
                          <i className="ph-bold ph-trash text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================== */}
      {/* MODAL THÊM / SỬA NHÂN VIÊN */}
      {/* ========================================== */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-black text-lg text-[#002D62] flex items-center gap-2">
                <i className={`ph-fill ${modalMode === 'add' ? 'ph-user-plus' : 'ph-pencil-simple'} text-2xl`}></i>
                {modalMode === 'add' ? 'Cấp tài khoản Nhân sự mới' : 'Cập nhật Thông tin & Phân quyền'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors">
                <i className="ph-bold ph-x"></i>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã Nhân viên (*)</label>
                  <input type="text" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#002D62] focus:ring-4 focus:ring-blue-900/10 transition-all uppercase" placeholder="VD: NV001" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò Hệ thống (*)</label>
                  <select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full h-11 px-3 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#002D62] focus:ring-4 focus:ring-blue-900/10 transition-all bg-white cursor-pointer">
                    {SYSTEM_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và Tên (*)</label>
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full h-11 px-4 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#002D62] focus:ring-4 focus:ring-blue-900/10 transition-all" placeholder="Nhập họ và tên..." />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                  <span>Email Đăng nhập</span>
                  <span className="text-amber-500 font-medium normal-case tracking-normal"><i className="ph-fill ph-warning-circle"></i> Dùng để login</span>
                </label>
                <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value.toLowerCase()})} className="w-full h-11 px-4 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-blue-700 outline-none focus:bg-white focus:border-[#002D62] focus:ring-4 focus:ring-blue-900/10 transition-all" placeholder="nhanvien@nkba.vn" />
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="px-6 h-11 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">HỦY BỎ</button>
              <button onClick={handleSaveEmployee} disabled={isSaving} className="px-8 h-11 bg-[#002D62] text-white font-black rounded-xl shadow-md hover:bg-blue-900 transition-all flex items-center gap-2 disabled:opacity-50">
                {isSaving ? <><i className="ph-bold ph-spinner animate-spin text-lg"></i> ĐANG LƯU...</> : <><i className="ph-bold ph-floppy-disk text-lg"></i> LƯU THÔNG TIN</>}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}