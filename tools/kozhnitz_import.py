#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ייבוא אלבום גוגל פוטוס (ZIP) לאתר קאזניץ — רץ על מק.

מה הוא עושה:
  1. פורס את קובצי ה-ZIP לתיקיית עבודה (~/kozhnitz-work/raw)
  2. סופר תמונות וסרטונים, קורא את תאריך הצילום (EXIF) דרך sips
  3. מקבץ את התמונות לגלריות לפי יום צילום
  4. מקטין כל תמונה לרשת (1800px + תמונה ממוזערת 900px) — HEIC הופך ל-JPEG
  5. מעתיק את התוצאה לריפו של האתר וכותב data/galleries-album.js
  6. עושה commit + push (אם git זמין ומחובר)
  סרטונים לא נכנסים לאתר (כבדים מדי ל-GitHub Pages): הם נאספים
  ב-~/kozhnitz-work/videos לפי תאריך, ומופיעים בדו"ח.

שימוש:
  python3 kozhnitz_import.py ~/Downloads/album-001.zip [עוד zip...]
  python3 kozhnitz_import.py --no-push ...     # רק להכין, בלי push
"""
import os, re, sys, shutil, subprocess, zipfile, json, datetime
from collections import defaultdict

REPO_URL = "https://github.com/raviv0526601900-debug/kozhnitz-site"
WORK = os.path.expanduser("~/kozhnitz-work")
RAW = os.path.join(WORK, "raw")
VIDEOS = os.path.join(WORK, "videos")
REPO = os.path.join(WORK, "kozhnitz-site")
IMG_EXT = {".jpg", ".jpeg", ".png", ".heic", ".heif", ".webp"}
VID_EXT = {".mp4", ".mov", ".m4v", ".avi"}
LARGE, THUMB, QUALITY = 1800, 900, 82

def run(cmd, **kw):
    return subprocess.run(cmd, capture_output=True, text=True, **kw)

def log(msg):
    print(msg, flush=True)

def extract(zips):
    os.makedirs(RAW, exist_ok=True)
    for z in zips:
        marker = os.path.join(RAW, "." + os.path.basename(z) + ".done")
        if os.path.exists(marker):
            log(f"  כבר נפרס: {os.path.basename(z)}")
            continue
        log(f"  פורס: {os.path.basename(z)} ...")
        with zipfile.ZipFile(z) as zf:
            for info in zf.infolist():
                name = info.filename
                if name.startswith("__MACOSX") or os.path.basename(name).startswith("."):
                    continue
                zf.extract(info, RAW)
        open(marker, "w").close()

def sips_props(path, *props):
    args = ["sips"]
    for p in props:
        args += ["-g", p]
    args.append(path)
    out = run(args).stdout
    res = {}
    for line in out.splitlines():
        m = re.match(r"\s*(\w+):\s*(.*)", line)
        if m:
            res[m.group(1)] = m.group(2).strip()
    return res

def parse_exif_date(s):
    # "2025:12:03 16:55:36" -> datetime
    m = re.match(r"(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})", s or "")
    if not m:
        return None
    try:
        return datetime.datetime(*map(int, m.groups()))
    except ValueError:
        return None

def file_date(path):
    # fallback: modification time written by the ZIP (not reliable, but better than nothing)
    try:
        return datetime.datetime.fromtimestamp(os.path.getmtime(path))
    except Exception:
        return None

def scan():
    photos, videos = [], []
    for root, dirs, files in os.walk(RAW):
        dirs[:] = [d for d in dirs if not d.startswith(".") and d != "__MACOSX"]
        for f in files:
            if f.startswith("."):
                continue
            p = os.path.join(root, f)
            ext = os.path.splitext(f)[1].lower()
            if ext in IMG_EXT:
                props = sips_props(p, "creation", "pixelWidth", "pixelHeight")
                dt = parse_exif_date(props.get("creation"))
                photos.append({"path": p, "dt": dt, "exif": dt is not None,
                               "w": int(props.get("pixelWidth") or 0), "h": int(props.get("pixelHeight") or 0)})
            elif ext in VID_EXT:
                videos.append({"path": p, "dt": file_date(p), "size": os.path.getsize(p)})
    return photos, videos

def resize(src, dst, max_px):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    r = run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", str(QUALITY),
             "-Z", str(max_px), src, "--out", dst])
    if r.returncode != 0:
        raise RuntimeError(r.stderr.strip() or r.stdout.strip())
    p = sips_props(dst, "pixelWidth", "pixelHeight")
    return int(p.get("pixelWidth") or 0), int(p.get("pixelHeight") or 0)

def js_str(s):
    return json.dumps(s, ensure_ascii=False)

def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    no_push = "--no-push" in sys.argv
    zips = [os.path.expanduser(a) for a in args if a.lower().endswith(".zip")]
    if not zips and not os.path.isdir(RAW):
        log("שימוש: python3 kozhnitz_import.py <קובץ.zip> [עוד...]")
        sys.exit(1)
    if run(["which", "sips"]).returncode != 0:
        log("sips לא נמצא — הסקריפט מיועד ל-macOS."); sys.exit(1)

    log("== שלב 1: פריסת ה-ZIP")
    extract(zips)

    log("== שלב 2: סריקה וקריאת תאריכים (יכול לקחת כמה דקות)")
    photos, videos = scan()
    log(f"  נמצאו {len(photos)} תמונות ו-{len(videos)} סרטונים")

    # group photos by day
    groups = defaultdict(list)
    for ph in photos:
        key = ph["dt"].strftime("%Y-%m-%d") if ph["dt"] else "unknown"
        groups[key].append(ph)
    for key in groups:
        groups[key].sort(key=lambda x: (x["dt"] or datetime.datetime.min, x["path"]))

    log("== שלב 3: הקטנת תמונות לרשת")
    out_root = os.path.join(WORK, "site-assets", "img", "album")
    if os.path.isdir(out_root):
        shutil.rmtree(out_root)
    galleries = []
    total_bytes = 0
    for key in sorted(groups, reverse=True):
        items = []
        for i, ph in enumerate(groups[key], 1):
            base = f"{key}/{i:03d}"
            big = os.path.join(out_root, base + ".jpg")
            small = os.path.join(out_root, base + "-900.jpg")
            try:
                w, h = resize(ph["path"], big, LARGE)
                resize(ph["path"], small, THUMB)
            except Exception as e:
                log(f"  דילוג על {os.path.basename(ph['path'])}: {e}")
                continue
            total_bytes += os.path.getsize(big) + os.path.getsize(small)
            items.append({"src": f"assets/img/album/{base}.jpg", "thumb": f"assets/img/album/{base}-900.jpg",
                          "ratio": f"{w} / {h}", "alt": "מחצר הקודש קאזניץ"})
        if not items:
            continue
        first = groups[key][0]
        iso = first["dt"].strftime("%Y-%m-%dT%H:%M:%S") if first["dt"] else None
        galleries.append({"id": f"album-{key}", "title": "צילומים מחצר הקודש",
                          "date": iso, "items": items, "count": len(items)})
        log(f"  {key}: {len(items)} תמונות")

    log("== שלב 4: איסוף סרטונים (לא נכנסים לאתר)")
    vid_groups = defaultdict(list)
    for v in videos:
        key = v["dt"].strftime("%Y-%m-%d") if v["dt"] else "unknown"
        d = os.path.join(VIDEOS, key)
        os.makedirs(d, exist_ok=True)
        dst = os.path.join(d, os.path.basename(v["path"]))
        if not os.path.exists(dst):
            shutil.copy2(v["path"], dst)
        vid_groups[key].append(v)

    # galleries-album.js
    lines = ["/* נוצר אוטומטית על ידי tools/kozhnitz_import.py — אפשר לערוך כותרות ידנית */",
             "window.GALLERIES = (window.GALLERIES || []).concat(["]
    for g in galleries:
        lines.append("  {")
        lines.append(f"    id: {js_str(g['id'])},")
        lines.append(f"    title: {js_str(g['title'])},")
        lines.append(f"    date: {js_str(g['date']) if g['date'] else 'null'},")
        lines.append("    items: [")
        for it in g["items"]:
            lines.append("      { type: 'photo', src: %s, thumb: %s, ratio: %s, alt: %s }," % (
                js_str(it["src"]), js_str(it["thumb"]), js_str(it["ratio"]), js_str(it["alt"])))
        lines.append("    ],")
        lines.append("  },")
    lines.append("]);")
    js_path = os.path.join(WORK, "site-assets", "galleries-album.js")
    with open(js_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

    # report
    rep = ["דו\"ח ייבוא — " + datetime.datetime.now().strftime("%d.%m.%Y %H:%M"), ""]
    rep.append(f"סה\"כ תמונות: {len(photos)}   סה\"כ סרטונים: {len(videos)}")
    rep.append(f"תמונות ללא תאריך צילום: {sum(1 for p in photos if not p['exif'])}")
    rep.append(f"משקל התמונות לאתר אחרי הקטנה: {total_bytes/1e6:.0f} MB")
    rep.append(f"משקל הסרטונים (לא הועלו): {sum(v['size'] for v in videos)/1e9:.2f} GB")
    rep.append("")
    rep.append("תאריך        תמונות  סרטונים")
    for key in sorted(set(list(groups) + list(vid_groups)), reverse=True):
        rep.append(f"{key:<12} {len(groups.get(key, [])):>6}  {len(vid_groups.get(key, [])):>7}")
    report = "\n".join(rep)
    with open(os.path.join(WORK, "report.txt"), "w", encoding="utf-8") as f:
        f.write(report + "\n")
    log("\n" + report + "\n")

    log("== שלב 5: עדכון הריפו")
    if run(["which", "git"]).returncode != 0:
        log("git לא מותקן. הריצו: xcode-select --install   ואז הריצו שוב את הסקריפט."); sys.exit(2)
    if not os.path.isdir(os.path.join(REPO, ".git")):
        r = run(["git", "clone", REPO_URL, REPO])
        if r.returncode != 0:
            log("שיבוט הריפו נכשל:\n" + r.stderr); sys.exit(2)
    else:
        run(["git", "-C", REPO, "pull", "--ff-only"])
    dst_img = os.path.join(REPO, "assets", "img", "album")
    if os.path.isdir(dst_img):
        shutil.rmtree(dst_img)
    shutil.copytree(out_root, dst_img)
    shutil.copy2(js_path, os.path.join(REPO, "data", "galleries-album.js"))
    run(["git", "-C", REPO, "add", "-A"])
    msg = f"ייבוא אלבום: {len(photos)} תמונות ב-{len(galleries)} גלריות"
    r = run(["git", "-C", REPO, "-c", "user.name=Kozhnitz import", "-c", "user.email=import@kozhnitz.local",
             "commit", "-m", msg])
    if r.returncode != 0 and "nothing to commit" in (r.stdout + r.stderr):
        log("  אין שינויים חדשים."); return
    if no_push:
        log(f"  הוכן commit בלי push. לדחיפה: git -C {REPO} push"); return
    log("  דוחף ל-GitHub (אם תתבקשו: Username = שם המשתמש, Password = הטוקן) ...")
    r = subprocess.run(["git", "-C", REPO, "push", "-u", "origin", "main"])
    if r.returncode == 0:
        log("\n✅ הועלה. האתר יתעדכן תוך כדקה:\n   https://raviv0526601900-debug.github.io/kozhnitz-site/")
        log(f"\nעכשיו אפשר למחוק את קובצי ה-ZIP ואת {RAW}")
    else:
        log("\n❌ ה-push נכשל. ראו את ההודעה למעלה; אפשר לנסות שוב עם:\n   git -C " + REPO + " push -u origin main")

if __name__ == "__main__":
    main()
