// Static content: prayers, Jummah checklist, Quranic headers, default gym routine.
// Rakat counts follow the common Hanafi practice. Edit freely.

export const PRAYERS = [
  { id: "fajr", en: "Fajr", ur: "فجر", rak: "2 Sunnah · 2 Fard" },
  { id: "dhuhr", en: "Dhuhr", ur: "ظہر", rak: "4 Sunnah · 4 Fard · 2 Sunnah · 2 Nafl" },
  { id: "asr", en: "Asr", ur: "عصر", rak: "4 Sunnah · 4 Fard" },
  { id: "maghrib", en: "Maghrib", ur: "مغرب", rak: "3 Fard · 2 Sunnah · 2 Nafl" },
  { id: "isha", en: "Isha", ur: "عشاء", rak: "4 Sunnah · 4 Fard · 2 Sunnah · 2 Nafl · 3 Witr" },
];

export const STATUS = [
  { id: "done", en: "On time", ur: "ادا" },
  { id: "jamaat", en: "Jamaat", ur: "جماعت" },
  { id: "qaza", en: "Qaza", ur: "قضا" },
];

// One ayah per day, rotating
export const AYAT = [
  {
    ar: "إِنَّ الصَّلَاةَ كَانَتْ عَلَى الْمُؤْمِنِينَ كِتَابًا مَّوْقُوتًا",
    ur: "بے شک نماز مومنوں پر مقررہ اوقات میں فرض ہے",
    ref: "النساء ٤:١٠٣ · An-Nisa 4:103",
  },
  {
    ar: "وَأَقِمِ الصَّلَاةَ لِذِكْرِي",
    ur: "اور میری یاد کے لیے نماز قائم کرو",
    ref: "طٰہٰ ٢٠:١٤ · Ta-Ha 20:14",
  },
  {
    ar: "وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ",
    ur: "اور صبر اور نماز کے ذریعے مدد مانگو",
    ref: "البقرہ ٢:٤٥ · Al-Baqarah 2:45",
  },
  {
    ar: "إِنَّ الصَّلَاةَ تَنْهَىٰ عَنِ الْفَحْشَاءِ وَالْمُنكَرِ",
    ur: "بے شک نماز بے حیائی اور برائی سے روکتی ہے",
    ref: "العنکبوت ٢٩:٤٥ · Al-Ankabut 29:45",
  },
];

export const JUMMAH_AYAH = {
  ar: "يَا أَيُّهَا الَّذِينَ آمَنُوا إِذَا نُودِيَ لِلصَّلَاةِ مِن يَوْمِ الْجُمُعَةِ فَاسْعَوْا إِلَىٰ ذِكْرِ اللَّهِ",
  ur: "اے ایمان والو! جب جمعہ کے دن نماز کے لیے پکارا جائے تو اللہ کے ذکر کی طرف دوڑ پڑو",
  ref: "الجمعہ ٦٢:٩ · Al-Jumu'ah 62:9",
};

export const JUMMAH_HADITH = {
  ar: "خَيْرُ يَوْمٍ طَلَعَتْ عَلَيْهِ الشَّمْسُ يَوْمُ الْجُمُعَةِ",
  ur: "بہترین دن جس پر سورج طلوع ہوتا ہے جمعہ کا دن ہے",
  ref: "صحیح مسلم · Sahih Muslim",
};

export const JUMMAH = [
  {
    g: "Before leaving · روانگی سے پہلے",
    items: [
      { id: "ghusl", en: "Ghusl (full bath)", ur: "غسل" },
      { id: "clean", en: "Clean clothes & attar", ur: "صاف لباس اور عطر" },
      { id: "miswak", en: "Miswak / brush teeth", ur: "مسواک" },
      { id: "nails", en: "Trim nails & tidy up", ur: "ناخن تراشنا" },
      { id: "kahf", en: "Recite Surah Al-Kahf", ur: "سورۃ الکہف کی تلاوت" },
    ],
  },
  {
    g: "At the masjid · مسجد میں",
    items: [
      { id: "early", en: "Go early to the masjid", ur: "جلدی مسجد جانا" },
      { id: "sunnah_b", en: "Sunnah before Jummah (4 rakat)", ur: "جمعہ سے پہلے چار رکعت سنت" },
      { id: "khutbah", en: "Listen to the khutbah in silence", ur: "خطبہ خاموشی سے سننا" },
      { id: "fard", en: "Jummah Fard (2 rakat)", ur: "دو رکعت فرض" },
      { id: "sunnah_a", en: "Sunnah after Jummah (4 + 2 rakat)", ur: "جمعہ کے بعد چار اور دو رکعت سنت" },
    ],
  },
  {
    g: "Through the day · دن بھر",
    items: [
      { id: "durood", en: "Abundant Durood on the Prophet ﷺ", ur: "کثرت سے درود شریف" },
      { id: "dua", en: "Dua in the last hour before Maghrib", ur: "جمعہ کی آخری گھڑی میں دعا" },
    ],
  },
];

export const POETRY = ["تیرے میں کیا ہنر ہے یہ بتانا ضروری ہے", "اگر تو زندہ ہے تو زندہ نظر آنا ضروری ہے"];

// Default "back / strength" day
export const DEFAULT_PLAN = [
  { id: "lat", name: "Wide Grip Lat Pull-Down", sets: 4, reps: "10-12" },
  { id: "row", name: "Wide Seated Cable Row", sets: 4, reps: "10-12" },
  { id: "db", name: "One-Hand Dumbbell Row", sets: 3, reps: "10 / side" },
  { id: "hyper", name: "Hyper Extension", sets: 3, reps: "12-15" },
];
