// Mushafi IDs (1..114) in chronological order of revelation (nuzul order),
// as used by the standard Cairo edition. Index 0 = first revealed surah (96, العلق).
export const SURAH_NUZUL_ORDER = [
  96, 68, 73, 74, 1, 111, 81, 87, 92, 89, 93, 94, 103, 100, 108, 102, 107, 109, 105, 113,
  114, 112, 53, 80, 97, 91, 85, 95, 106, 101, 75, 104, 77, 50, 90, 86, 54, 38, 7, 72,
  36, 25, 35, 19, 20, 56, 26, 27, 28, 17, 10, 11, 12, 15, 6, 37, 31, 34, 39, 40,
  41, 42, 43, 44, 45, 46, 51, 88, 18, 16, 71, 14, 21, 23, 32, 52, 67, 69, 70, 78,
  79, 82, 84, 30, 29, 83, 2, 8, 3, 33, 60, 4, 99, 57, 47, 13, 55, 76, 65, 98,
  59, 24, 22, 63, 58, 49, 66, 64, 61, 62, 48, 5, 9, 110,
];

// Nuzul rank (1..114) for a given mushafi id.
export function getNuzulRank(surahId: number): number {
  return SURAH_NUZUL_ORDER.indexOf(surahId) + 1;
}

export type SurahSort = 'mushafi' | 'alpha' | 'nuzul';

export const SURAH_SORT_OPTIONS: { value: SurahSort; label: string }[] = [
  { value: 'mushafi', label: 'ترتيب المصحف' },
  { value: 'alpha', label: 'أبجدي' },
  { value: 'nuzul', label: 'ترتيب النزول' },
];

const ALL_MUSHAFI_IDS = Array.from({ length: 114 }, (_, i) => i + 1);

// Returns surah ids (1..114) in the requested order. 'mushafi' is the
// canonical default: index order of SURAH_NAMES = mushafi order.
export function orderSurahIds(sort: SurahSort): number[] {
  if (sort === 'nuzul') return SURAH_NUZUL_ORDER;
  if (sort === 'alpha') {
    return ALL_MUSHAFI_IDS.slice().sort((a, b) =>
      SURAH_NAMES[a - 1].localeCompare(SURAH_NAMES[b - 1], 'ar')
    );
  }
  return ALL_MUSHAFI_IDS;
}

export const SURAH_NAMES = [
  "الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس",
  "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه",
  "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم",
  "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر",
  "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق",
  "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة",
  "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج",
  "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس",
  "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد",
  "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات",
  "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر",
  "المسد", "الإخلاص", "الفلق", "الناس"
];
