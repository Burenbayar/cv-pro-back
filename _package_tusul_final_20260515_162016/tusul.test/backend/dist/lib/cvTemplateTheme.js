export const CV_THEME = {
    navy: '#333E5B',
    navyLight: '#495883',
    sidebar: '#F1EDEE',
    line: '#c8c2c4',
    body: '#333E5B',
    muted: '#495883',
    accent: '#495883',
    white: '#ffffff',
};
export function templateLabels(lang) {
    return lang === 'mn'
        ? {
            cv: 'Анкет / CV',
            phone: 'УТАС',
            email: 'И-МЭЙЛ',
            personal: 'Хувийн мэдээлэл',
            skills: 'Ур чадвар',
            languages: 'Гадаад хэл',
            about: 'Товч танилцуулга / Зорилго',
            education: 'Боловсрол',
            experience: 'Ажлын туршлага',
            references: 'Лавлагаа',
            photo: 'Зураг',
        }
        : {
            cv: 'Resume / CV',
            phone: 'PHONE',
            email: 'EMAIL',
            personal: 'Personal',
            skills: 'Skills',
            languages: 'Languages',
            about: 'Summary / Objective',
            education: 'Education',
            experience: 'Work experience',
            references: 'References',
            photo: 'Photo',
        };
}
export function splitExperienceBlocks(lines) {
    if (!lines.length)
        return [];
    const text = lines.join('\n');
    const blocks = text.split(/\n{2,}/).map((b) => b.trim()).filter((b) => b.length > 12);
    return blocks.length > 1 ? blocks : lines.filter((l) => l.trim().length > 8);
}
export function parseContactFields(lines) {
    let phone = '';
    let email = '';
    const rest = [];
    for (const line of lines) {
        if (/@/.test(line))
            email = line;
        else if (/\+?\d[\d\s-]{6,}/.test(line))
            phone = line;
        else
            rest.push(line);
    }
    return { phone, email, rest };
}
export function splitEducationLine(line) {
    const dateMatch = line.match(/(\d{4}\s*[-–—]\s*(?:\d{4}|одоо|present|now))/i);
    if (dateMatch && dateMatch.index !== undefined) {
        const date = dateMatch[0];
        const title = line.slice(0, dateMatch.index).trim().replace(/[,;]\s*$/, '');
        const detail = line.slice(dateMatch.index + date.length).trim().replace(/^[,;]\s*/, '');
        return { title: title || line, date, detail };
    }
    return { title: line, date: '', detail: '' };
}
export function splitExperienceBlock(block) {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0)
        return { title: '', company: '', body: '' };
    const title = lines[0];
    const company = lines.length > 1 && lines[1].length < 80 ? lines[1] : '';
    const body = lines.slice(company ? 2 : 1).join(' ');
    return { title, company, body };
}
