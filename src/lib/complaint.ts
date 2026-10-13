import type { Report } from './types';

const CAT_TEXT: Record<Report['category'], string> = {
  harassment: 'I was harassed',
  followed: 'I was followed',
  poor_lighting: 'The stretch was poorly lit and felt unsafe',
  isolated: 'The stretch was isolated and felt unsafe',
  unsafe_transport: 'I felt unsafe in a vehicle or at a transport stop',
  other: 'I faced an unsafe situation',
};

/** What to ask the ward office for, by the kind of spot she reported. */
const CIVIC_ASK: Partial<Record<Report['category'], string>> = {
  poor_lighting: 'Streetlights are missing or not working',
  isolated: 'The stretch is deserted and has no lighting, activity or patrol',
  unsafe_transport: 'The stop or stand has no lighting or shelter',
};

/** Reports about the place itself, which a ward office can fix. */
export const isCivic = (r: Report) => r.category in CIVIC_ASK;

/**
 * One letter to the municipal ward office for every spot she has reported
 * that the city can fix: dark stretches, deserted stretches, unlit stops.
 * Lists places only. Nothing about any person goes in it.
 */
export function civicDraft(reports: Report[]) {
  const spots = reports.filter(isCivic).sort((a, b) => b.at - a.at);
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  return [
    'To,',
    'The Assistant Commissioner,',
    '[Ward office name], [Municipal corporation]',
    '',
    `Date: ${today}`,
    'Subject: Request to fix unsafe public spots in the ward',
    '',
    'Respected Sir/Madam,',
    '',
    `Women using the roads below find them unsafe after dark. I request repair of streetlights and regular upkeep at these ${spots.length === 1 ? 'spot' : 'spots'}:`,
    '',
    ...spots.map((r, i) => {
      const seen = new Date(r.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const place = `${r.lat.toFixed(5)}, ${r.lng.toFixed(5)} (https://maps.google.com/?q=${r.lat.toFixed(5)},${r.lng.toFixed(5)})`;
      return `${i + 1}. ${CIVIC_ASK[r.category]}. Location: ${place}. Seen on ${seen}.${r.note ? ` Note: ${r.note}` : ''}`;
    }),
    '',
    'Kindly share the complaint number and the expected date of repair.',
    '',
    'Yours faithfully,',
    '[Your name]',
    '[Phone number]',
  ].join('\n');
}

/**
 * Template complaint draft the user can paste into the Maharashtra Police
 * citizen portal or take to a police station. Deliberately plain: the user
 * fills in names and details. An LLM version (Gemini via an edge function)
 * can replace this later; keep this as the offline fallback.
 */
export function complaintDraft(r: Report) {
  const when = new Date(r.at);
  const date = when.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const time = when.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  return [
    'To,',
    'The Station House Officer,',
    '[Police station name]',
    '',
    `Subject: Complaint regarding an incident on ${date}`,
    '',
    'Respected Sir/Madam,',
    '',
    `${CAT_TEXT[r.category]} on ${date} at about ${time}, near the location ${r.lat.toFixed(5)}, ${r.lng.toFixed(5)} (https://maps.google.com/?q=${r.lat.toFixed(5)},${r.lng.toFixed(5)}).`,
    r.note ? `Details: ${r.note}` : 'Details: [Describe what happened, any vehicle number, and what the person looked like]',
    '',
    'I request you to take necessary action and to increase patrolling in this area.',
    '',
    'Yours faithfully,',
    '[Your name]',
    '[Phone number]',
  ].join('\n');
}
