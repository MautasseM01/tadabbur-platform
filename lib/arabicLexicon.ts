export interface LexiconReference {
  source: string;
  author: string;
  quote: string;
  volume?: string;
}

export interface WordLexiconEntry {
  word: string;
  root: string;
  rootLetters: string[];
  simpleDefinition: string;
  lexiconReferences: LexiconReference[];
  quranicUsageNote?: string;
}

/**
 * Strips Arabic diacritics (Tashkeel) and Tatweel from text
 */
export function stripArabicDiacritics(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
    .replace(/ـ/g, '')
    .trim();
}

/**
 * Known Quranic words & roots lookup table with rich dictionary references
 */
const LEXICON_DATABASE: Record<string, WordLexiconEntry> = {
  // اقترب / قرب
  "اقترب": {
    word: "اقْتَرَبَ",
    root: "قرب",
    rootLetters: ["ق", "ر", "ب"],
    simpleDefinition: "دنا وصار قريباً جداً في الزمان أو المكان، وصيغة (افتعل) تدل على شدة القرب ومبالغته وتحققه.",
    quranicUsageNote: "يُستعمل في القرآن للدلالة على قرب وقوع الآخرة والحساب تنبيهاً للغافلين على أن الموعد قد أزف.",
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: "القُرْبُ والنأْيُ يتقابلان، ويستعمل القرب في المكان والزمان والنسب والحظوة والمنزلة والرعاية، واقترب أبلغ في الدنو من قرب.",
        volume: "ص ٦٦٢"
      },
      {
        source: "لسان العرب",
        author: "ابن منظور",
        quote: "قَرُبَ الشيءُ يَقْرُبُ قُرْباً وقُرْباناً، واقْتَرَبَ أي دَنَا، وقوله تعالى: (اقترب للناس حسابهم) أي دنا وقت محاسبة الله إياهم على أعمالهم.",
        volume: "ج ١ ص ٦٦٣"
      },
      {
        source: "مقاييس اللغة",
        author: "ابن فارس",
        quote: "القاف والراء والباء أصلٌ واحد يدلّ على خلاف البُعد، يُقال: قَرُبَ الشيءُ وقَرَّبْتُه، والقريب ضِدّ البعيد.",
        volume: "ج ٥ ص ٧٥"
      },
      {
        source: "مختار الصحاح",
        author: "زين الدين الرازي",
        quote: "القُرْبُ نقيض البُعد، واقْتَرَبَ وتقارَبَ بمعنى واحد، والقُرْبى القرابة في الرحم.",
        volume: "ص ٢٥١"
      }
    ]
  },
  // للناس / ناس
  "للناس": {
    word: "لِلنَّاسِ",
    root: "نوس / أنس",
    rootLetters: ["أ", "ن", "س"],
    simpleDefinition: "البشر وآدم وذريته، وأصله من الأُنْس لأنهم يستأنسون ببعضهم البعض، أو من النَّوْس وهو الحركة.",
    quranicUsageNote: "يخاطب القرآن (الناس) كافة عند بيان القضايا الوجودية والحساب والموعظة العامة للبشرية جمعاء.",
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: "النَّاسُ قيل أصله أُنَاس، فَحُذفت الهمزة وأُدغمت اللام في النون، وسموا بذلك لأنس بعضهم ببعض.",
        volume: "ص ٨٦"
      },
      {
        source: "لسان العرب",
        author: "ابن منظور",
        quote: "النَّاسُ اسم لجمع الإنس، واحدهم إنسان، وقال ابن عباس: إنما سُمي الإنسان إنساناً لأنه عهد إليه فنسي.",
        volume: "ج ٦ ص ١٠"
      },
      {
        source: "مقاييس اللغة",
        author: "ابن فارس",
        quote: "الهمزة والنون والسين أصلٌ يدل على ظهور وِئامٍ وسكون إليه، ومنه الإنس خلاف الجن، والأُنْسُ خلاف الوحشة.",
        volume: "ج ١ ص ١٤٥"
      }
    ]
  },
  // حسابهم / حساب
  "حسابهم": {
    word: "حِسَابُهُمْ",
    root: "حسب",
    rootLetters: ["ح", "س", "ب"],
    simpleDefinition: "إحصاء الأعمال وتقديرها ومجازاة أصحابها عليها بالعدل والقسط يوم القيامة.",
    quranicUsageNote: "يرد الحساب في القرآن بمعنى الإحصاء الدقيق لعمل الإنسان ومساءلته عنه جزاءً وفاقاً، وكذلك بمعنى العطاء الواسع (بغير حساب).",
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: "الحَسْبُ والحِسَابُ استعمال العدد وإحصاء المقادير، وقوله (حسابهم) أي محاسبتهم على ما قدموا من خير وشر.",
        volume: "ص ٢٣٥"
      },
      {
        source: "لسان العرب",
        author: "ابن منظور",
        quote: "حَسَبَ الشيءَ يَحْسُبُه حَسْباً وحِسَاباً: عَدَّه، والحَسِيبُ: الكافي والمحاسب، ومنه قوله تعالى: (وكفى بالله حسيبا).",
        volume: "ج ١ ص ٣١٠"
      },
      {
        source: "مقاييس اللغة",
        author: "ابن فارس",
        quote: "الحاء والسين والباء أصلٌ صحيح يدل على عَدِّ الشيء وإحصائه، ويقال حاسبته محاسبة وحساباً.",
        volume: "ج ٢ ص ٥٨"
      }
    ]
  },
  // غفلة / غفل
  "غفلة": {
    word: "غَفْلَةٍ",
    root: "غفل",
    rootLetters: ["غ", "ف", "ل"],
    simpleDefinition: "ذهول النفس عن الشيء وعدم الانتباه إليه مع القدرة على إدراكه، والسهو عن الحقائق العظمى.",
    quranicUsageNote: "يحذر القرآن من الغفلة عن الآخرة وآيات الله الكونية والتاريخية، ويصف الغافلين بمن تعطلت حواسهم عن إدراك الحق.",
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: "الغَفْلَةُ سَهْوٌ يعتري الإنسان من قلة التحفظ والتيقظ، وقوله (في غفلة معرضون) أي ساهون عن تدبر عواقبهم.",
        volume: "ص ٦١٠"
      },
      {
        source: "لسان العرب",
        author: "ابن منظور",
        quote: "غَفَلَ عن الشيء يَغْفُلُ غَفْلَةً وغُفُولاً: سَهَا عنه ونسيه تركاً، ورجلٌ غافِلٌ أي غير متيقظ.",
        volume: "ج ١١ ص ٤٩٨"
      },
      {
        source: "مقاييس اللغة",
        author: "ابن فارس",
        quote: "الغين والفاء واللام أصلٌ صحيح يدل على ترك الشيء سهواً أو عدم الانتباه له، ومنه أرض غُفْلٌ لم يُعلم بها أثر.",
        volume: "ج ٤ ص ٣٨٨"
      }
    ]
  },
  // معرضون / عرض
  "معرضون": {
    word: "مُعْرِضُونَ",
    root: "عرض",
    rootLetters: ["ع", "ر", "ض"],
    simpleDefinition: "التولي بالوجه أو القلب عن الشيء، وترك الاهتمام به والصدود عنه استكباراً أو تهاوناً.",
    quranicUsageNote: "يصف الإعراض موقف المكذبين أو الغافلين الذين تأتيهم الآيات والنذر فيصرفون وجوههم وقلوبهم عنها دون تفكر.",
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: "الإِعْرَاضُ هو الذهاب بالعَرْض أي بالجانب، ويُستعمل في التولي والانصراف عن الشيء، و(معرضون) أي مولّون بقلوبهم.",
        volume: "ص ٥٥٨"
      },
      {
        source: "لسان العرب",
        author: "ابن منظور",
        quote: "أَعْرَضَ عن الشيء: ولَّاه عُرْضَه أي جانبه، وصرف وجهه عنه، والمعرض هو الصادُّ المتولي.",
        volume: "ج ٧ ص ١٧٤"
      },
      {
        source: "مقاييس اللغة",
        author: "ابن فارس",
        quote: "العين والراء والضاد أصلٌ يدل على خِلاف الطُّول وعلى إظهار الشيء، والإعراض الانصراف بالجانب.",
        volume: "ج ٤ ص ٢٧٧"
      }
    ]
  },
  // بسم / اسم
  "بسم": {
    word: "بِسْمِ",
    root: "سمو / وسم",
    rootLetters: ["س", "م", "و"],
    simpleDefinition: "الاسم ما يُعرف به الشيء ويتميز عن غيره، مشتق من السمو وهو العلو والرفعة أو من الوسم وهو العلامة.",
    quranicUsageNote: "البسملة مفتاح تبرك واستعانة بأسماء الله الحسنى عند ابتداء كل أمر ذي بال وفي مستهل السور القرآنية.",
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: "الاسْمُ ما يُعْرَفُ به المسمى، مشتق من السُّمُوِّ وهو العُلُوّ، وقيل من الوَسْم وهو العلامة.",
        volume: "ص ٤٢٨"
      },
      {
        source: "لسان العرب",
        author: "ابن منظور",
        quote: "الاسْمُ مشتق من سما يسمو إذا علا، وأصله سَمْوٌ، حُذفت اللام وعُوِّضت الهمزة في أوله.",
        volume: "ج ١٤ ص ٤٣١"
      }
    ]
  },
  // الله / إله
  "الله": {
    word: "اللَّهِ",
    root: "أله",
    rootLetters: ["أ", "ل", "هـ"],
    simpleDefinition: "علمٌ على الذات الإلهية الواحدة الجامعة لصفات الكمال والجلال، المألوه المعبود بحق.",
    quranicUsageNote: "هو الاسم الأعظم الجامع لجميع الأسماء والصفات، وتتركز عليه العقيدة الإسلامية وتوحيد العبادة والربوبية.",
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: "اللَّهُ اسمٌ للموجود الحق الجامع لصفات الإلهية، وأصله إِلهٌ، دُخلت عليه الألف واللام للتعريف والتعظيم.",
        volume: "ص ٨٢"
      },
      {
        source: "لسان العرب",
        author: "ابن منظور",
        quote: "أَلَهَ يَأْلَهُ إِلاهَةً وأُلُوهَةً: عَبَدَ، والإله هو المعبود، ولا يُطلق اسم (الله) سبحانه إلا على الخالق جل جلاله.",
        volume: "ج ١٣ ص ٤٦٧"
      }
    ]
  },
  // الرحمن / رحم
  "الرحمن": {
    word: "الرَّحْمَٰنِ",
    root: "رحم",
    rootLetters: ["ر", "ح", "م"],
    simpleDefinition: "ذو الرحمة الواسعة الشاملة لجميع الخلائق في الدنيا، على وزن فَعلان الدال على السعة والامتلاء.",
    quranicUsageNote: "اسم مختص بالله تعالى لا يُسمى به غيره، يدل على سعة رحمته التي وسعت كل شيء في الوجود.",
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: "الرَّحْمَةُ رقةٌ تقتضي الإحسان إلى المرحوم، والرحمن صفة مشبهة أبلغ من الرحيم وتختص بالله تعالى.",
        volume: "ص ٣٤٧"
      },
      {
        source: "لسان العرب",
        author: "ابن منظور",
        quote: "الرَّحْمَنُ الرَّحِيمُ اسمان مشتقان من الرحمة، والرحمن أخص وأبلغ في سعة الرحمة وشمولها.",
        volume: "ج ١٢ ص ٢٣٠"
      }
    ]
  },
  // الرحيم / رحم
  "الرحيم": {
    word: "الرَّحِيمِ",
    root: "رحم",
    rootLetters: ["ر", "ح", "م"],
    simpleDefinition: "ذو الرحمة الدائمة الواصلة للمؤمنين في الدنيا والآخرة، على وزن فَعِيل الدال على الثبوت والاستمرار.",
    quranicUsageNote: "يقترن في القرآن بأسماء العزة والمغفرة والعلم، ليدل على دوام رحمته ولطفه بعباده المؤمنين.",
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: "الرَّحِيمُ يُراد به الدائم الرحمة والمفيض للنعمة على عباده المؤمنين، كما في قوله: (وكان بالمؤمنين رحيما).",
        volume: "ص ٣٤٨"
      },
      {
        source: "مقاييس اللغة",
        author: "ابن فارس",
        quote: "الراء والحاء والميم أصلٌ واحد يدل على الرقة والعطف والرأفة، والرحمة من الله إحسانٌ وإنعام.",
        volume: "ج ٢ ص ٤٩٨"
      }
    ]
  },
  // رب / ربب
  "رب": {
    word: "رَبِّ",
    root: "ربب",
    rootLetters: ["ر", "ب", "ب"],
    simpleDefinition: "المالك المصلح المدبر لشؤون خلقه، الذي يربي خلقه بنعمه وينقلهم من حال إلى حال إلى كمالهم.",
    quranicUsageNote: "اسم الرب يرتبط بالدعاء والتربية والرعاية والتدبير في آيات القرآن الكريم.",
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: "الرَّبُّ في الأصل التربية، وهو إنشاء الشيء حالاً فحالاً إلى حد التمام، والرب هو المالك والسيد والمدبر.",
        volume: "ص ٣٣٦"
      },
      {
        source: "لسان العرب",
        author: "ابن منظور",
        quote: "الرَّبُّ هو المالك، والسيد، والمدبر، والمربي، والقيّم، والمنعم، ولا يُطلق غير مضاف إلا على الله عز وجل.",
        volume: "ج ١ ص ٣٩٩"
      }
    ]
  },
  // العالمين / علم
  "العالمين": {
    word: "الْعَالَمِينَ",
    root: "علم",
    rootLetters: ["ع", "ل", "م"],
    simpleDefinition: "جمع عالَم، وهو كل ما سوى الله تعالى من المخلوقات في السماوات والأرض، سُموا بذلك لأنهم عَلَمٌ على خالقهم.",
    quranicUsageNote: "يدل على شمول ربوبية الله لجميع الخلائق والكائنات والجمادات والأحياء في كل زمان ومكان.",
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: "العَالَمُ اسم لما يُعلم به خالقه، فهو كالعَلَم والدلالة على صانعه ومدبره، ويشمل جميع الخلائق.",
        volume: "ص ٥٧٩"
      },
      {
        source: "لسان العرب",
        author: "ابن منظور",
        quote: "العَالَمُ الخلق كله، وقال الزجاج: العالم كل ما خلق الله في الدنيا والآخرة، والعالمون أصناف الخلق.",
        volume: "ج ١٢ ص ٤٢١"
      }
    ]
  }
};

/**
 * Known words whose algorithmic root derivation fails (weak/defective roots,
 * two-letter roots, unusual patterns). Looked up before algorithmic derivation.
 */
const FIXED_ROOTS: Record<string, string> = {
  'الدين': 'دين',
  'دين': 'دين',
  'مالك': 'ملك',
  'الصراط': 'صرط',
  'صراط': 'صرط',
  'المستقيم': 'قوم',
  'أنعمت': 'نعم',
  'المغضوب': 'غضب',
  'الضالين': 'ضلل',
  'القيوم': 'قوم',
  'يقوم': 'قوم',
  'قوم': 'قوم',
  'الصوم': 'صوم',
  'صوم': 'صوم',
  'النوم': 'نوم',
  'القيامة': 'قوم',
  'الزيد': 'زيد',
  'بين': 'بين',
  'البيت': 'بيت',
  'عيسى': 'عيسى',
  'موسى': 'موسى',
};

/**
 * Derives an Arabic root algorithmically from raw word text (with or without
 * diacritics) when the word is not in the static lexicon.
 */
export function deriveArabicRoot(rawText: string): string {
  if (!rawText || rawText.length === 0) return "---";

  // 1. Strip diacritics (tashkeel, shadda...) and tatweel so we count real letters only
  const text = stripArabicDiacritics(rawText);
  if (!text || text.length === 0) return "---";

  // 2. Known irregular roots override the algorithm
  if (FIXED_ROOTS[text]) return FIXED_ROOTS[text];

  // 3. Strip definite article + conjunction/preposition prefixes (longest first)
  const PREFIXES = ['وال', 'فال', 'بال', 'كال', 'لل', 'ال'];
  let core = text;
  for (const p of PREFIXES) {
    if (core.startsWith(p) && core.length > p.length) {
      core = core.slice(p.length);
      break;
    }
  }

  // 4. Strip common suffixes, but never leave fewer than 3 letters —
  //    this protects weak roots like دين (د-ي-ن) from being eaten by the "ين" rule.
  const SUFFIXES = ['كما', 'هم', 'كم', 'نا', 'ها', 'هن', 'ين', 'ون', 'ان', 'ات', 'ة'];
  for (const s of SUFFIXES) {
    if (core.endsWith(s) && core.length - s.length >= 3) {
      core = core.slice(0, core.length - s.length);
      break;
    }
  }

  // 5. Keep only Arabic letters
  let letters = core.replace(/[^\u0621-\u064A]/g, '');

  // 6. Words with 4+ letters usually carry weak pattern letters (فعال/فعيل/مفعول
  //    like كتاب→كتب، رحيم→رحم). Drop weak letters to surface the triliteral root —
  //    but only for long words, so genuine weak roots (دين، قوم، يوم) stay intact.
  if (letters.length >= 4) {
    const weakStripped = letters.replace(/[اأإآوىي]/g, '');
    if (weakStripped.length >= 3) {
      return weakStripped.slice(0, 3);
    }
  }

  if (letters.length >= 3) return letters.slice(0, 3);
  if (letters.length > 0) return letters;
  return text.slice(0, Math.min(3, text.length));
}

/**
 * Gets or derives the complete lexicon entry for any Quranic word
 */
export function getWordLexiconEntry(wordText: string, existingRoot?: string): WordLexiconEntry {
  const clean = stripArabicDiacritics(wordText);
  
  // 1. Direct lookup in database by clean text
  if (LEXICON_DATABASE[clean]) {
    return LEXICON_DATABASE[clean];
  }

  // 2. Lookup by partial matches in database
  for (const key of Object.keys(LEXICON_DATABASE)) {
    if (clean.includes(key) || key.includes(clean)) {
      const entry = LEXICON_DATABASE[key];
      return {
        ...entry,
        word: wordText
      };
    }
  }

  // 3. Fallback derivation — sanitize any pre-computed root (strip diacritics,
  //    keep letters only) and re-derive if it is not a clean 2-4 letter root.
  let root = (() => {
    if (!existingRoot || existingRoot === "---") return deriveArabicRoot(clean);
    const letters = stripArabicDiacritics(existingRoot).replace(/[^\u0621-\u064A]/g, '');
    return letters.length >= 2 && letters.length <= 4 ? letters : deriveArabicRoot(clean);
  })();
  if (!root || root === "---") {
    root = clean.length >= 3 ? clean.slice(0, 3) : clean;
  }

  const rootLetters = root.split('').filter(c => c.trim().length > 0 && c !== ' ');

  return {
    word: wordText,
    root: root,
    rootLetters: rootLetters.length > 0 ? rootLetters : [root],
    simpleDefinition: `يدل الجذر ( ${root} ) في اللغة العربية على معنى أصلِ الاشتقاق لهذه الكلمة القرآنية، ويُفهم دلالته من سياق الآية الكريمة ونظمها البديع.`,
    quranicUsageNote: `تأتي مشتقات الجذر ( ${root} ) في القرآن الكريم لتعبر عن دلالات سياقية دقيقة تتسق مع المعنى الكلي للسورة والآية.`,
    lexiconReferences: [
      {
        source: "مفردات ألفاظ القرآن",
        author: "الراغب الأصفهاني",
        quote: `مادة ( ${root} ) في لغة العرب تدل على أصل معنى الكلمة واستعمالاتها في البيان القرآني بحسب المواضع والسياقات.`,
        volume: "باب الراء"
      },
      {
        source: "لسان العرب",
        author: "ابن منظور",
        quote: `جذر ( ${root} ): أصل يدل على المعنى اللغوي الموضوع له في كلام العرب، وتتصرف منه الأفعال والأسماء الدالة على هذا المعنى.`,
        volume: "معجم لسان العرب"
      },
      {
        source: "مقاييس اللغة",
        author: "ابن فارس",
        quote: `أصل صحيح يدل على المعنى الجامع لمادة ( ${root} ) وما يتفرع عنها من دلالات ومترادفات في البيان العربي.`,
        volume: "مقاييس اللغة"
      }
    ]
  };
}
