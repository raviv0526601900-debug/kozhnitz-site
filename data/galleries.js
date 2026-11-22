/* ──────────────────────────────────────────────────────────────────────────
   שמות האירועים ותוספות ידניות.

   הגלריות עצמן נוצרות אוטומטית מהאלבום (data/galleries-album.js, רשומה לכל
   יום צילום, id בצורת album-YYYY-MM-DD). כאן נותנים לכל יום כזה שם אירוע,
   ואפשר גם להוסיף לו פריטים (למשל סרטונים). רשומה עם אותו id מתאחדת עם
   הרשומה מהאלבום: הכותרת מכאן גוברת, והפריטים מצטרפים.

   שדות:
     id          album-YYYY-MM-DD (כמו בקובץ האלבום), או מזהה חדש לגלריה ידנית
     title       שם האירוע
     date        (רשות) ISO; בלי שדה זה נלקח התאריך מהאלבום
     hebrewDate  (רשות) תאריך עברי בכתב יד — עוקף את החישוב האוטומטי
     place       (רשות)
     items       (רשות) פריטים נוספים:
                   { type: 'photo', src, thumb, ratio, alt, caption }
                   { type: 'video', src, poster, caption }
   ────────────────────────────────────────────────────────────────────────── */
window.GALLERIES = [
  { id: 'album-2026-09-28', title: 'חול המועד סוכות', items: [] },
  { id: 'album-2026-09-13', title: 'צילומים מחצר הקודש', items: [] },
  { id: 'album-2026-08-20', title: 'צילומים מחצר הקודש', items: [] },
  { id: 'album-2026-03-02', title: 'ליל פורים', items: [] },
  { id: 'album-2025-12-21', title: 'זאת חנוכה', items: [
      { type: 'video', src: 'assets/video/clip-1.mp4', poster: 'assets/img/clip-1-poster.jpg', caption: 'ליד המנורה' },
  ] },
  { id: 'album-2025-12-04', title: 'שמחה בחצר הקודש', items: [] },
  { id: 'album-2025-12-03', title: 'שמחה בחצר הקודש', items: [
      { type: 'video', src: 'assets/video/clip-2.mp4', poster: 'assets/img/tish-1-900.jpg' },
      { type: 'video', src: 'assets/video/clip-3.mp4', poster: 'assets/img/tish-2-900.jpg' },
  ] },
  { id: 'album-2025-12-02', title: 'שמחה בחצר הקודש', items: [] },
  { id: 'album-2025-10-09', title: 'חול המועד סוכות', items: [] },
  { id: 'album-2025-06-26', title: 'צילומים מחצר הקודש', items: [] },
  { id: 'album-2024-12-21', title: 'צילומים מחצר הקודש', items: [] },
  { id: 'album-2023-12-11', title: 'חנוכה', items: [] },
  { id: 'album-2023-05-08', title: 'ל״ג בעומר', items: [] },
  { id: 'album-2023-04-10', title: 'חול המועד פסח', items: [] },
  { id: 'album-2023-02-27', title: 'צילומים מחצר הקודש', items: [] },
  { id: 'album-2023-02-22', title: 'ראש חודש אדר', items: [] },
  { id: 'album-2022-10-14', title: 'חול המועד סוכות', items: [] },
  { id: 'album-2020-03-10', title: 'פורים', items: [] },
  { id: 'album-2019-10-18', title: 'חול המועד סוכות', items: [] },
  { id: 'album-2019-09-28', title: 'צילומים מחצר הקודש', items: [] },
  { id: 'album-2019-03-15', title: 'צילומים מחצר הקודש', items: [] },
  { id: 'album-2018-12-09', title: 'חנוכה', items: [] },
  { id: 'album-2018-09-28', title: 'חול המועד סוכות', items: [] },
  { id: 'album-2018-05-29', title: 'צילומים מחצר הקודש', items: [] },
  { id: 'album-2017-10-08', title: 'חול המועד סוכות', items: [] },
  { id: 'album-2015-09-26', title: 'צילומים מחצר הקודש', items: [] },
  { id: 'album-unknown', title: 'תמונות ללא תאריך צילום', items: [] },
];
