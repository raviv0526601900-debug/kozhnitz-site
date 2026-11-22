/* ──────────────────────────────────────────────────────────────────────────
   רשימת הגלריות — כל אירוע הוא רשומה אחת.

   שדות:
     id          מזהה באנגלית, ייחודי (משמש בכתובת: gallery.html?g=ID)
     title       שם האירוע
     date        מועד הצילום, ISO עם אזור זמן. null אם לא ידוע.
     hebrewDate  (רשות) תאריך עברי בכתב יד — עוקף את החישוב האוטומטי
     place       (רשות) מקום
     cover       (רשות) תמונת שער; ברירת המחדל — התמונה/הפוסטר הראשון
     items       תמונות וסרטונים, לפי סדר ההצגה:
                   { type: 'photo', src, thumb, ratio, alt, caption }
                   { type: 'video', src, poster, caption }
   ────────────────────────────────────────────────────────────────────────── */
window.GALLERIES = [
  {
    id: 'purim-5786',
    title: 'ליל פורים',
    date: '2026-03-02T19:18:56+02:00',
    place: 'חצר הקודש קאזניץ',
    items: [
      { type: 'photo', src: 'assets/img/rebbe-portrait.jpg', thumb: 'assets/img/rebbe-portrait-900.jpg', ratio: '1016 / 1800',
        alt: 'כ״ק מרן אדמו״ר שליט״א ליד השולחן בליל פורים', caption: 'כ״ק מרן אדמו״ר שליט״א' },
    ],
  },
  {
    id: 'zos-chanukah-5786',
    title: 'זאת חנוכה',
    date: '2025-12-21T20:27:13+02:00',
    place: 'חצר הקודש קאזניץ',
    items: [
      { type: 'video', src: 'assets/video/clip-1.mp4', poster: 'assets/img/clip-1-poster.jpg', caption: 'ליד המנורה' },
    ],
  },
  {
    id: 'simcha-kislev-5786',
    title: 'שמחה בחצר הקודש',
    date: '2025-12-03T16:55:36+02:00',
    items: [
      { type: 'photo', src: 'assets/img/tish-1.jpg', thumb: 'assets/img/tish-1-900.jpg', ratio: '4 / 3',
        alt: 'הרבי משוחח עם החתן ליד שולחן ערוך בכלי כסף', caption: 'עם החתן' },
      { type: 'photo', src: 'assets/img/tish-2.jpg', thumb: 'assets/img/tish-2-900.jpg', ratio: '4 / 3',
        alt: 'הרבי מברך את החתן ליד השולחן', caption: 'ברכת הרבי' },
      { type: 'video', src: 'assets/video/clip-2.mp4', poster: 'assets/img/tish-1-900.jpg' },
      { type: 'video', src: 'assets/video/clip-3.mp4', poster: 'assets/img/tish-2-900.jpg' },
    ],
  },
  {
    id: 'beis-medrash',
    title: 'קריאת התורה בבית המדרש',
    date: null,
    items: [
      { type: 'photo', src: 'assets/img/krias-hatorah.jpg', thumb: 'assets/img/krias-hatorah-900.jpg', ratio: '2017 / 1583',
        alt: 'הרבי עטוף בטלית ליד ספר תורה פתוח, בבית המדרש', caption: 'בבית המדרש' },
    ],
  },
];
