// src/components/profile/PremiumCV.tsx
import React from 'react';

export interface CVData {
  full_name?: string;
  title?: string;
  phone?: string;
  email?: string;
  bio?: string;
  skills?: string;
  linkedin_url?: string;
  avatar_url?: string;
  experiences?: { company: string; role: string; period: string; description: string }[];
  education?: { school: string; degree: string; year: string }[];
  certificates?: { name: string; organization: string; year: string }[];
  languages?: { language: string; proficiency: string }[];
}

interface PremiumCVProps {
  data: CVData;
  className?: string; 
}

export default function PremiumCV({ data, className = '' }: PremiumCVProps) {
  if (!data) return null;
  
  return (
    <div className={`flex w-full min-h-[297mm] bg-white text-slate-800 ${className}`}>
      
      {/* CỘT TRÁI (NỀN ĐẬM NKBA) - CHIẾM 1/3 */}
      <div className="w-[32%] bg-[#002D62] text-white px-6 pt-6 pb-10 flex flex-col min-h-full shrink-0">
        
        {/* AVATAR */}
        <div className="flex justify-center mb-8 mt-0">
          <div className="w-36 h-36 rounded-full border-4 border-white/20 overflow-hidden shadow-2xl bg-white/10 flex items-center justify-center">
            {data.avatar_url ? (
              <img src={data.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-6xl font-black text-white/50">{data.full_name?.charAt(0) || 'N'}</span>
            )}
          </div>
        </div>

        {/* THÔNG TIN LIÊN HỆ */}
        <div className="mb-8 space-y-3 text-sm font-medium text-blue-100">
          <h3 className="text-white font-black tracking-widest uppercase border-b border-white/20 pb-2 mb-4">Liên hệ</h3>
          {data.phone && <div className="flex items-center gap-3"><i className="ph-fill ph-phone text-blue-300 text-lg shrink-0"></i> <span>{data.phone}</span></div>}
          {data.email && <div className="flex items-center gap-3"><i className="ph-fill ph-envelope-simple text-blue-300 text-lg shrink-0"></i> <span className="break-all line-clamp-2">{data.email}</span></div>}
          {data.linkedin_url && <div className="flex items-start gap-3"><i className="ph-fill ph-linkedin-logo text-blue-300 text-lg shrink-0 mt-0.5"></i> <span className="break-all text-xs leading-relaxed">{data.linkedin_url.replace('https://www.', '').replace('https://', '')}</span></div>}
        </div>

        {/* HỌC VẤN */}
        {data.education && data.education.length > 0 && (
          <div className="mb-10">
            <h3 className="text-white font-black tracking-widest uppercase border-b border-white/20 pb-2 mb-5">Học vấn</h3>
            <div className="space-y-6">
              {data.education.map((edu, idx) => (
                <div key={idx} className="relative pl-4 border-l-2 border-blue-400/30">
                  <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-blue-400"></div>
                  <p className="font-bold text-white leading-tight text-sm">{edu.degree}</p>
                  <p className="text-xs text-blue-200 mt-1 font-medium">{edu.school}</p>
                  <p className="text-[10px] text-blue-300/70 mt-0.5">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KỸ NĂNG */}
        {data.skills && (
          <div className="mb-10">
            <h3 className="text-white font-black tracking-widest uppercase border-b border-white/20 pb-2 mb-5">Kỹ năng</h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.split(',').map((skill, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-white/10 text-white rounded-lg text-xs font-bold border border-white/10">{skill.trim()}</span>
              ))}
            </div>
          </div>
        )}

        {/* NGOẠI NGỮ */}
        {data.languages && data.languages.length > 0 && (
          <div>
            <h3 className="text-white font-black tracking-widest uppercase border-b border-white/20 pb-2 mb-5">Ngoại ngữ</h3>
            <div className="space-y-3">
              {data.languages.map((lang, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm">
                  <span className="font-bold text-white">{lang.language}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest bg-white/10 px-2 py-1 rounded text-blue-200">{lang.proficiency}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CỘT PHẢI (NỀN SÁNG) - CHIẾM 2/3 */}
      <div className="w-2/3 bg-white px-10 pt-6 pb-12 flex flex-col">
        
        {/* HEADER TÊN & CHỨC DANH */}
        <div className="mb-10 mt-0">
          <h1 className="text-3xl font-black text-[#002D62] uppercase tracking-tight mb-2 leading-none">{data.full_name || 'TÊN CỦA BẠN'}</h1>
          <h2 className="text-lg font-bold text-slate-500 tracking-wide uppercase">{data.title || 'Chức Danh Chuyên Môn'}</h2>
        </div>

        {/* TÓM LƯỢC (BIO) */}
        {data.bio && (
          <div className="mb-8">
            <h3 className="text-lg font-black text-[#002D62] uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-4 flex items-center gap-2">
              <i className="ph-fill ph-user-circle"></i> Hồ sơ chuyên gia
            </h3>
            <p className="text-sm text-slate-700 leading-relaxed text-justify font-medium">{data.bio}</p>
          </div>
        )}

        {/* KINH NGHIỆM LÀM VIỆC */}
        {data.experiences && data.experiences.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-black text-[#002D62] uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-6 flex items-center gap-2">
              <i className="ph-fill ph-briefcase-metal"></i> Kinh nghiệm làm việc
            </h3>
            <div className="space-y-8">
              {data.experiences.map((exp, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-slate-200">
                  <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-[#002D62]"></div>
                  <div className="flex justify-between items-baseline mb-1">
                    <h4 className="text-base font-black text-slate-900">{exp.role}</h4>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#002D62] bg-blue-50 px-3 py-1 rounded-full shrink-0 ml-4">{exp.period}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-600 mb-3">{exp.company}</p>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{exp.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CHỨNG CHỈ */}
        {data.certificates && data.certificates.length > 0 && (
          <div>
            <h3 className="text-lg font-black text-[#002D62] uppercase tracking-widest border-b-2 border-slate-100 pb-2 mb-6 flex items-center gap-2">
              <i className="ph-fill ph-certificate"></i> Chứng chỉ & Giải thưởng
            </h3>
            <div className="grid grid-cols-2 gap-6">
              {data.certificates.map((cert, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-sm font-black text-slate-900 leading-tight mb-1">{cert.name}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{cert.organization}</p>
                  <p className="text-[10px] font-black text-[#002D62] mt-2">{cert.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}