import React from 'react';

interface PremiumCVData {
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

export default function PremiumCV({ data }: { data: PremiumCVData }) {
	return (
		<div className="flex min-h-[297mm] w-full bg-white text-slate-800">
			<aside className="w-[32%] shrink-0 bg-[#002D62] px-6 py-8 text-white">
				{data.avatar_url && <img src={data.avatar_url} alt="Avatar" className="mx-auto mb-8 h-32 w-32 rounded-full object-cover" />}
				<h1 className="mb-1 text-2xl font-black uppercase">{data.full_name || 'TÊN CỦA BẠN'}</h1>
				<p className="mb-8 text-sm text-blue-200">{data.title || 'Chức Danh Chuyên Môn'}</p>
				<div className="space-y-2 text-sm text-blue-100">
					{data.phone && <p>{data.phone}</p>}
					{data.email && <p className="break-all">{data.email}</p>}
					{data.linkedin_url && <p className="break-all">{data.linkedin_url}</p>}
				</div>
				{data.skills && <section className="mt-8"><h2 className="mb-3 font-black uppercase">Kỹ năng</h2><p className="text-sm text-blue-100">{data.skills}</p></section>}
				{data.languages?.length ? <section className="mt-8"><h2 className="mb-3 font-black uppercase">Ngoại ngữ</h2><div className="space-y-2 text-sm text-blue-100">{data.languages.map((language, index) => <p key={index}>{language.language}: {language.proficiency}</p>)}</div></section> : null}
			</aside>
			<main className="w-2/3 px-10 py-8">
				{data.bio && <section className="mb-8"><h2 className="mb-3 border-b-2 border-slate-100 pb-2 text-lg font-black uppercase text-[#002D62]">Hồ sơ chuyên gia</h2><p className="text-sm leading-relaxed">{data.bio}</p></section>}
				{data.experiences?.length ? <section className="mb-8"><h2 className="mb-4 border-b-2 border-slate-100 pb-2 text-lg font-black uppercase text-[#002D62]">Kinh nghiệm làm việc</h2><div className="space-y-6">{data.experiences.map((experience, index) => <article key={index}><h3 className="font-black">{experience.role}</h3><p className="text-sm font-bold text-slate-600">{experience.company} | {experience.period}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">{experience.description}</p></article>)}</div></section> : null}
				{data.education?.length ? <section><h2 className="mb-4 border-b-2 border-slate-100 pb-2 text-lg font-black uppercase text-[#002D62]">Học vấn</h2>{data.education.map((education, index) => <p key={index} className="mb-2 text-sm"><strong>{education.degree}</strong> - {education.school} ({education.year})</p>)}</section> : null}
			</main>
		</div>
	);
}
