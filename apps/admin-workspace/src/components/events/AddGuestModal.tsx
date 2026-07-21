// src/components/events/AddGuestModal.tsx
'use client';

import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { addEventGuestsAction, getMembersForEvent } from '@/actions/event.actions';

export default function AddGuestModal({ isOpen, onClose, eventId }: { isOpen: boolean, onClose: () => void, eventId: string }) {
  const [activeTab, setActiveTab] = useState<'MANUAL' | 'MEMBER' | 'EXCEL'>('MANUAL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State cho Tab: Thủ công (Thêm trường salutation)
  const [manualData, setManualData] = useState({ salutation: 'Ông', name: '', email: '', phone: '', company: '', position: '' });
  
  // State cho Tab: Hội viên
  const [members, setMembers] = useState<any[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  
  // State cho Tab: Excel
  const [excelData, setExcelData] = useState<any[]>([]);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    if (activeTab === 'MEMBER' && members.length === 0) {
      getMembersForEvent().then(res => {
        if (res.success) setMembers(res.data);
      });
    }
  }, [activeTab, members.length]);

  if (!isOpen) return null;

  // 👇 HÀM TẠO VÀ TẢI TEMPLATE EXCEL 👇
  const handleDownloadTemplate = () => {
    // Thêm cột Danh xưng vào template
    const templateData = [
      {
        'Danh xưng': 'Anh',
        'Tên': 'Nguyễn Văn A',
        'Email': 'nguyenvana@example.com',
        'SĐT': '0901234567',
        'Công ty': 'Công ty ABC',
        'Chức vụ': 'Giám đốc'
      },
      {
        'Danh xưng': 'Chị',
        'Tên': 'Trần Thị B',
        'Email': 'tranthib@example.com',
        'SĐT': '0912345678',
        'Công ty': 'Tập đoàn XYZ',
        'Chức vụ': 'Trưởng phòng'
      }
    ];

    // 2. Chuyển đổi thành sheet và tải về
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template_KhachMoi");
    XLSX.writeFile(wb, "NKBA_Guest_Template.xlsx");
  };

  // Xử lý đọc file Excel
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      
      const formatted = data.map((row: any) => ({
        salutation: row['Danh xưng'] || row['Salutation'] || '', // Hứng cột Danh xưng
        name: row['Tên'] || row['Name'] || '',
        email: row['Email'] || '',
        phone: row['SĐT'] || row['Phone'] || '',
        company: row['Công ty'] || row['Company'] || '',
        position: row['Chức vụ'] || row['Position'] || '',
        source: 'EXCEL'
      }));
      setExcelData(formatted);
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let payload: any[] = [];

    if (activeTab === 'MANUAL') {
      if (!manualData.name) { alert('Vui lòng nhập tên!'); setIsSubmitting(false); return; }
      payload = [{ ...manualData, source: 'MANUAL' }];
    } 
    else if (activeTab === 'EXCEL') {
      if (excelData.length === 0) { alert('Chưa có dữ liệu Excel!'); setIsSubmitting(false); return; }
      payload = excelData;
    } 
    else if (activeTab === 'MEMBER') {
      if (selectedMembers.length === 0) { alert('Chưa chọn hội viên nào!'); setIsSubmitting(false); return; }
      payload = members.filter(m => selectedMembers.includes(m.id)).map(m => ({
        salutation: 'Ông/Bà', // Mặc định cho hội viên nếu bảng company không có
        name: m.name, email: m.email, phone: m.phone, company: m.name, source: 'MEMBER'
      }));
    }

    const res = await addEventGuestsAction(eventId, payload);
    if (res.success) {
      alert(res.message);
      setManualData({ salutation: 'Anh', name: '', email: '', phone: '', company: '', position: '' });
      setExcelData([]);
      setSelectedMembers([]);
      setFileName('');
      onClose();
    } else {
      alert(res.message);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95">
        
        {/* Header Modal */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-black text-[#002D62]">Thêm Khách mời</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-500">
            <i className="ph-bold ph-x"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-6 pt-2">
          {['MANUAL', 'MEMBER', 'EXCEL'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab ? 'border-[#002D62] text-[#002D62]' : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab === 'MANUAL' && '✍️ Thêm thủ công'}
              {tab === 'MEMBER' && '🏢 Chọn từ Hội viên'}
              {tab === 'EXCEL' && '📁 Import Excel'}
            </button>
          ))}
        </div>

        {/* Nội dung Tabs */}
        <div className="p-6 min-h-[300px]">
          
          {/* TAB 1: THỦ CÔNG */}
          {activeTab === 'MANUAL' && (
            <div className="grid grid-cols-12 gap-4">
              <div className="col-span-4 space-y-1">
                <label className="text-xs font-bold text-slate-500">Danh xưng</label>
                <select 
                  value={manualData.salutation} 
                  onChange={e => setManualData({...manualData, salutation: e.target.value})} 
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#002D62]"
                >
                  <option value="Ông">Ông</option>
                  <option value="Bà">Bà</option>
                  <option value="Anh">Anh</option>
                  <option value="Chị">Chị</option>
                  <option value="Mr">Mr.</option>
                  <option value="Ms">Ms.</option>
                  <option value="Dr">Dr.</option>
                </select>
              </div>
              <div className="col-span-8 space-y-1">
                <label className="text-xs font-bold text-slate-500">Họ và Tên *</label>
                <input type="text" value={manualData.name} onChange={e => setManualData({...manualData, name: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="VD: Nguyễn Văn A"/>
              </div>
              <div className="col-span-6 space-y-1">
                <label className="text-xs font-bold text-slate-500">Email</label>
                <input type="email" value={manualData.email} onChange={e => setManualData({...manualData, email: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="col-span-6 space-y-1">
                <label className="text-xs font-bold text-slate-500">Số điện thoại</label>
                <input type="text" value={manualData.phone} onChange={e => setManualData({...manualData, phone: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="col-span-6 space-y-1">
                <label className="text-xs font-bold text-slate-500">Đơn vị / Công ty</label>
                <input type="text" value={manualData.company} onChange={e => setManualData({...manualData, company: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div className="col-span-6 space-y-1">
                <label className="text-xs font-bold text-slate-500">Chức vụ</label>
                <input type="text" value={manualData.position} onChange={e => setManualData({...manualData, position: e.target.value})} className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
          )}

          {/* TAB 2: HỘI VIÊN */}
          {activeTab === 'MEMBER' && (
            <div className="space-y-4">
              <div className="h-[250px] overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50">
                {members.length === 0 ? (
                  <p className="text-center text-slate-400 mt-10">Đang tải / Không có dữ liệu...</p>
                ) : (
                  members.map(m => (
                    <label key={m.id} className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={selectedMembers.includes(m.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMembers([...selectedMembers, m.id]);
                          else setSelectedMembers(selectedMembers.filter(id => id !== m.id));
                        }}
                        className="w-4 h-4 rounded text-[#002D62]"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.email} | {m.phone}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-500 font-bold">Đã chọn: {selectedMembers.length} hội viên</p>
            </div>
          )}

          {/* TAB 3: EXCEL */}
          {activeTab === 'EXCEL' && (
            <div className="flex flex-col items-center justify-center h-[250px] border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 relative">
              
              {/* Nút tải Template */}
              <button 
                onClick={handleDownloadTemplate}
                className="absolute top-4 right-4 text-xs font-bold text-[#002D62] bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-1"
              >
                <i className="ph-bold ph-download-simple"></i> Tải file mẫu
              </button>

              <i className="ph-fill ph-file-xls text-5xl text-emerald-500 mb-3 mt-4"></i>
              <p className="text-sm font-bold text-slate-600 mb-4">{fileName ? `Đã tải lên: ${fileName}` : 'Tải lên file Excel (.xlsx)'}</p>
              
              <label className="cursor-pointer px-6 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-slate-100 transition-colors shadow-sm">
                Chọn File
                <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="hidden" />
              </label>

              {excelData.length > 0 && (
                <p className="text-xs text-emerald-600 font-bold mt-4">✓ Đã quét được {excelData.length} khách mời hợp lệ</p>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button onClick={onClose} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
            Hủy bỏ
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || (activeTab === 'EXCEL' && excelData.length === 0)}
            className="px-8 py-2.5 bg-[#002D62] text-white text-sm font-bold rounded-xl hover:bg-blue-900 shadow-md flex items-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? <><i className="ph-bold ph-spinner animate-spin"></i> Đang lưu...</> : 'Thêm vào danh sách'}
          </button>
        </div>

      </div>
    </div>
  );
}