import fs from 'fs';
import { createRequire } from 'module';
import { enrichParsedCv, parseCvSections, resolveCandidateName } from './cvSections.js';
import { normalizeCvTextForParse, sanitizeParsedForTemplate } from './cvTemplateSanitize.js';
import { CV_THEME, parseContactFields, splitEducationLine, splitExperienceBlock, splitExperienceBlocks, templateLabels, } from './cvTemplateTheme.js';
const require = createRequire(import.meta.url);
const PDFDocument = require('pdfkit');
const M = 40;
const SB_W = 175;
const HEADER_H = 108;
const FONTS = [
    'C:\\Windows\\Fonts\\arial.ttf',
    'C:\\Windows\\Fonts\\segoeui.ttf',
    '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
];
function fontPath() {
    return FONTS.find((f) => fs.existsSync(f));
}
function photoBuffer(dataUrl) {
    if (!dataUrl?.trim())
        return null;
    try {
        const raw = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        return Buffer.from(raw, 'base64');
    }
    catch {
        return null;
    }
}
function mergeParsed(text, skills, rawCvText) {
    const raw = (rawCvText || text).trim();
    return enrichParsedCv(parseCvSections(text), raw, skills);
}
function sectionTitle(doc, x, y, w, title, color) {
    doc.fillColor(color).fontSize(8.5).text(title.toUpperCase(), x, y, { width: w });
    const ly = doc.y + 3;
    doc.moveTo(x, ly).lineTo(x + w, ly).lineWidth(0.5).strokeColor(CV_THEME.line).stroke();
    return ly + 9;
}
function bullets(doc, x, y, w, items) {
    let cy = y;
    for (const item of items.slice(0, 14)) {
        doc.fillColor(CV_THEME.body).fontSize(8.5).text(`■  ${item.replace(/^•\s*/, '')}`, x, cy, { width: w, lineGap: 1 });
        cy = doc.y + 3;
    }
    return cy;
}
function drawHeader(doc, name, role, summary, contact, photo, pageW, L) {
    const top = M;
    const w = pageW - M * 2;
    doc.rect(M, top, w, HEADER_H).fill(CV_THEME.navy);
    const px = M + 12;
    const py = top + 14;
    const ps = 52;
    if (photo) {
        try {
            doc.rect(px, py, ps, ps).lineWidth(1.5).strokeColor('#fff').stroke();
            doc.image(photo, px + 1, py + 1, { width: ps - 2, height: ps - 2, fit: [ps - 2, ps - 2] });
        }
        catch {
            doc.rect(px, py, ps, ps).fill('#64748b');
        }
    }
    else {
        doc.rect(px, py, ps, ps).lineWidth(1.5).strokeColor('#fff').stroke();
        doc.fillColor('#fff').fontSize(9).text(L.photo, px + 8, py + 20, { width: ps - 10, align: 'center' });
    }
    const tx = px + ps + 14;
    const midW = w - ps - 130;
    doc.fillColor('#fff').fontSize(17).text(name.toUpperCase(), tx, top + 16, { width: midW });
    doc.fillColor('#bfdbfe').fontSize(9).text(`${L.cv} · ${role}`, tx, top + 38, { width: midW });
    if (summary) {
        const short = summary.length > 240 ? `${summary.slice(0, 237)}…` : summary;
        doc.fillColor('#e0f2fe').fontSize(8).text(short, tx, top + 52, { width: midW, lineGap: 2 });
    }
    const rx = pageW - M - 118;
    let ry = top + 18;
    if (contact.phone) {
        doc.fillColor('#93c5fd').fontSize(7.5).text(L.phone, rx, ry, { width: 110, align: 'right' });
        doc.fillColor('#fff').fontSize(8).text(contact.phone, rx, ry + 10, { width: 110, align: 'right' });
        ry += 26;
    }
    if (contact.email) {
        doc.fillColor('#93c5fd').fontSize(7.5).text(L.email, rx, ry, { width: 110, align: 'right' });
        doc.fillColor('#fff').fontSize(7.5).text(contact.email, rx, ry + 10, { width: 110, align: 'right' });
    }
    return top + HEADER_H;
}
export function createProfessionalCvPdf(input) {
    const L = templateLabels(input.language);
    const rawSource = (input.sourceCvText || input.rewrittenCv).trim();
    const normalizedRaw = normalizeCvTextForParse(rawSource);
    const normalizedCv = normalizeCvTextForParse(input.rewrittenCv);
    const parsed = sanitizeParsedForTemplate(mergeParsed(normalizedCv, input.skills, normalizedRaw), normalizedRaw, input.skills);
    const name = resolveCandidateName({
        candidateName: input.candidateName,
        cvText: normalizedRaw || normalizedCv,
        fullName: input.candidateName,
    }) || 'Candidate';
    const role = input.targetRole.trim() || '';
    const contact = parseContactFields(parsed.contact);
    const experienceBlocks = splitExperienceBlocks(parsed.experience);
    const photo = photoBuffer(input.profileImage);
    const doc = new PDFDocument({ size: 'A4', margin: 0, info: { Title: `${name} CV` } });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    const fp = fontPath();
    if (fp) {
        doc.registerFont('Regular', fp);
        doc.font('Regular');
    }
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const bodyTop = drawHeader(doc, name, role, '', contact, photo, pageW, L);
    const mainX = M + SB_W + 12;
    const mainW = pageW - mainX - M;
    const sbX = M + 8;
    const sbW = SB_W - 16;
    doc.rect(M, bodyTop, SB_W, pageH - bodyTop - M).fill(CV_THEME.sidebar);
    let sy = bodyTop + 12;
    if (contact.rest.length) {
        sy = sectionTitle(doc, sbX, sy, sbW, L.personal, CV_THEME.navyLight);
        sy = bullets(doc, sbX, sy, sbW, contact.rest) + 8;
    }
    if (parsed.languages.length) {
        sy = sectionTitle(doc, sbX, sy, sbW, L.languages, CV_THEME.navyLight);
        sy = bullets(doc, sbX, sy, sbW, parsed.languages) + 8;
    }
    if (parsed.skills.length) {
        sy = sectionTitle(doc, sbX, sy, sbW, L.skills, CV_THEME.navyLight);
        sy = bullets(doc, sbX, sy, sbW, parsed.skills) + 8;
    }
    let my = bodyTop + 12;
    if (parsed.about) {
        my = sectionTitle(doc, mainX, my, mainW, L.about, CV_THEME.navyLight);
        doc.fillColor(CV_THEME.body).fontSize(9).text(parsed.about, mainX, my, { width: mainW, lineGap: 2 });
        my = doc.y + 12;
    }
    if (parsed.education.length) {
        my = sectionTitle(doc, mainX, my, mainW, L.education, CV_THEME.navyLight);
        for (const line of parsed.education) {
            const edu = splitEducationLine(line);
            doc.fillColor(CV_THEME.body).fontSize(9).text(edu.title, mainX, my, { width: mainW - 70, continued: false });
            if (edu.date)
                doc.fillColor(CV_THEME.muted).fontSize(8.5).text(edu.date, mainX + mainW - 68, my, { width: 68, align: 'right' });
            my = doc.y + 2;
            if (edu.detail) {
                doc.fillColor(CV_THEME.muted).fontSize(8.5).text(edu.detail, mainX, my, { width: mainW });
                my = doc.y + 2;
            }
            my += 4;
        }
        my += 4;
    }
    if (experienceBlocks.length) {
        my = sectionTitle(doc, mainX, my, mainW, L.experience, CV_THEME.navyLight);
        for (const block of experienceBlocks) {
            const job = splitExperienceBlock(block);
            doc.fillColor(CV_THEME.body).fontSize(9.5).text(job.title, mainX, my, { width: mainW });
            my = doc.y + 2;
            if (job.company) {
                doc.fillColor(CV_THEME.accent).fontSize(9).text(job.company, mainX, my, { width: mainW });
                my = doc.y + 2;
            }
            if (job.body) {
                doc.fillColor(CV_THEME.body).fontSize(8.5).text(job.body, mainX, my, { width: mainW, lineGap: 2 });
                my = doc.y + 6;
            }
            my += 4;
        }
    }
    if (parsed.references.length) {
        my = sectionTitle(doc, mainX, my, mainW, L.references, CV_THEME.navyLight);
        bullets(doc, mainX, my, mainW, parsed.references);
    }
    if (!parsed.about && !parsed.education.length && !experienceBlocks.length && rawSource.length > 80) {
        my = sectionTitle(doc, mainX, my, mainW, L.experience, CV_THEME.navyLight);
        doc.fillColor(CV_THEME.body).fontSize(8.5).text(rawSource.slice(0, 2500), mainX, my, { width: mainW, lineGap: 2 });
    }
    return new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        doc.end();
    });
}
