import os
import re

def build_html():
    sop_path = os.path.join('docs', 'QMS_4_0_End_to_End_SOP.md')
    with open(sop_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    # Replace absolute brain image paths with relative paths
    md_text = re.sub(
        r'/C:/Users/DELL/\.gemini/antigravity/brain/[a-zA-Z0-9\-]+/sop_images_v5/',
        'sop_images_v5/',
        md_text
    )

    # Escape HTML special chars except inside markdown syntax
    def render_markdown(text):
        lines = text.split('\n')
        html_lines = []
        in_table = False
        table_rows = []
        in_code = False
        code_lines = []
        in_alert = False
        alert_type = 'info'
        alert_lines = []

        def flush_table():
            nonlocal in_table, table_rows
            if not table_rows:
                return ''
            header = table_rows[0]
            aligns = table_rows[1] if len(table_rows) > 1 else []
            body = table_rows[2:] if len(table_rows) > 2 else []

            out = '<div class="table-container my-6 overflow-x-auto rounded-xl border border-slate-700/80 shadow-lg"><table class="w-full text-start text-xs sm:text-sm border-collapse">\n'
            out += '  <thead class="bg-slate-800/90 text-cyan-300 font-bold border-b border-slate-700">\n    <tr>\n'
            for cell in header:
                out += f'      <th class="p-3 px-4 text-start">{format_inline(cell)}</th>\n'
            out += '    </tr>\n  </thead>\n  <tbody class="divide-y divide-slate-800 bg-slate-900/60">\n'
            for r in body:
                out += '    <tr class="hover:bg-slate-800/40 transition-colors">\n'
                for cell in r:
                    out += f'      <td class="p-3 px-4 text-slate-300">{format_inline(cell)}</td>\n'
                out += '    </tr>\n'
            out += '  </tbody>\n</table></div>\n'
            table_rows = []
            in_table = False
            return out

        def flush_alert():
            nonlocal in_alert, alert_lines, alert_type
            content = '<br>'.join([format_inline(l) for l in alert_lines])
            alert_classes = {
                'IMPORTANT': 'border-amber-500/50 bg-amber-950/20 text-amber-200',
                'NOTE': 'border-cyan-500/50 bg-cyan-950/20 text-cyan-200',
                'TIP': 'border-emerald-500/50 bg-emerald-950/20 text-emerald-200',
                'WARNING': 'border-rose-500/50 bg-rose-950/20 text-rose-200',
                'CAUTION': 'border-red-600/50 bg-red-950/30 text-red-200'
            }
            cls = alert_classes.get(alert_type, 'border-cyan-500/50 bg-cyan-950/20 text-cyan-200')
            icons = {
                'IMPORTANT': '⚠️ تنبيه هام',
                'NOTE': 'ℹ️ ملاحظة إرشادية',
                'TIP': '💡 نصيحة تشغيلية',
                'WARNING': '🚨 تحذير جودة',
                'CAUTION': '⛔ إجراء حرج'
            }
            icon_title = icons.get(alert_type, 'ℹ️ إرشاد')
            out = f'<div class="my-6 p-4 rounded-xl border-r-4 {cls} shadow-md backdrop-blur-sm">\n'
            out += f'  <div class="font-black text-sm mb-1.5 flex items-center gap-2">{icon_title}</div>\n'
            out += f'  <div class="text-xs sm:text-sm leading-relaxed">{content}</div>\n</div>\n'
            in_alert = False
            alert_lines = []
            return out

        def format_inline(line):
            # Bold code
            line = re.sub(r'`(.*?)`', r'<code class="px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono text-xs border border-slate-700/60">\1</code>', line)
            # Bold
            line = re.sub(r'\*\*(.*?)\*\*', r'<strong class="text-white font-bold">\1</strong>', line)
            # Italic
            line = re.sub(r'\*(.*?)\*', r'<em class="text-slate-300">\1</em>', line)
            # Links
            line = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2" class="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">\1</a>', line)
            return line

        i = 0
        while i < len(lines):
            line = lines[i]

            # Code blocks
            if line.startswith('```'):
                if in_code:
                    in_code = False
                    code_content = '\n'.join(code_lines)
                    html_lines.append(f'<pre class="my-4 p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs overflow-x-auto text-emerald-400"><code>{code_content}</code></pre>')
                    code_lines = []
                else:
                    in_code = True
                i += 1
                continue

            if in_code:
                code_lines.append(line.replace('<', '&lt;').replace('>', '&gt;'))
                i += 1
                continue

            # Alerts (> [!IMPORTANT])
            if line.startswith('> [!'):
                if in_alert:
                    html_lines.append(flush_alert())
                in_alert = True
                m = re.match(r'> \[!(.*?)\]', line)
                alert_type = m.group(1).upper() if m else 'NOTE'
                i += 1
                continue

            if in_alert:
                if line.startswith('>'):
                    alert_lines.append(line[1:].strip())
                    i += 1
                    continue
                else:
                    html_lines.append(flush_alert())

            # Tables
            if '|' in line and not line.startswith('```'):
                cells = [c.strip() for c in line.split('|')[1:-1]]
                if cells:
                    # check if separator
                    if all(set(c).issubset({'-', ':', ' '}) for c in cells):
                        pass # separator
                    else:
                        if not in_table:
                            in_table = True
                        table_rows.append(cells)
                    i += 1
                    continue
            else:
                if in_table:
                    html_lines.append(flush_table())

            # Images ![alt](url)
            img_match = re.match(r'!\[(.*?)\]\((.*?)\)', line)
            if img_match:
                alt = img_match.group(1)
                url = img_match.group(2)
                html_lines.append(f'''
<figure class="my-6 p-2 sm:p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-xl overflow-hidden group">
  <div class="relative cursor-pointer overflow-hidden rounded-xl bg-slate-950" onclick="openLightbox('{url}', '{alt}')">
    <img src="{url}" alt="{alt}" loading="lazy" class="w-full max-h-[550px] object-contain mx-auto transition-transform duration-300 group-hover:scale-[1.01]" />
    <div class="absolute inset-0 bg-cyan-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
      <span class="px-3 py-1.5 rounded-lg bg-black/80 text-cyan-300 text-xs font-bold border border-cyan-500/40 backdrop-blur-sm shadow-lg">🔍 انقر للتكبير ملء الشاشة</span>
    </div>
  </div>
  <figcaption class="mt-2.5 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
    <span class="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
    <span>{alt}</span>
  </figcaption>
</figure>''')
                i += 1
                continue

            # Headings
            if line.startswith('# '):
                text = line[2:].strip()
                html_lines.append(f'<h1 class="text-2xl sm:text-3xl font-black text-white mt-10 mb-6 pb-4 border-b border-cyan-500/30 flex items-center gap-3"><span class="w-3 h-8 bg-gradient-to-b from-cyan-400 to-blue-600 rounded-sm"></span>{format_inline(text)}</h1>')
                i += 1
                continue

            if line.startswith('## '):
                text = line[3:].strip()
                slug = re.sub(r'[^a-zA-Z0-9\u0600-\u06FF\-]+', '-', text).strip('-')
                html_lines.append(f'<h2 id="{slug}" class="text-xl sm:text-2xl font-black text-cyan-300 mt-12 mb-4 pt-4 border-t border-slate-800 flex items-center gap-2 scroll-mt-20"><span class="w-2.5 h-6 bg-cyan-500 rounded-sm"></span>{format_inline(text)}</h2>')
                i += 1
                continue

            if line.startswith('### '):
                text = line[4:].strip()
                slug = re.sub(r'[^a-zA-Z0-9\u0600-\u06FF\-]+', '-', text).strip('-')
                html_lines.append(f'<h3 id="{slug}" class="text-lg sm:text-xl font-bold text-white mt-8 mb-3 flex items-center gap-2 scroll-mt-20"><span class="w-2 h-2 rounded-full bg-amber-400"></span>{format_inline(text)}</h3>')
                i += 1
                continue

            if line.startswith('#### '):
                text = line[5:].strip()
                html_lines.append(f'<h4 class="text-base font-bold text-slate-200 mt-6 mb-2">{format_inline(text)}</h4>')
                i += 1
                continue

            # Horizontal Rule
            if line.strip() in ['---', '***', '___']:
                html_lines.append('<hr class="my-8 border-slate-800" />')
                i += 1
                continue

            # Unordered lists
            if line.strip().startswith('- ') or line.strip().startswith('* '):
                content = line.strip()[2:]
                html_lines.append(f'<li class="ms-5 list-disc text-slate-300 my-1 leading-relaxed">{format_inline(content)}</li>')
                i += 1
                continue

            # Ordered lists
            m_num = re.match(r'^\s*(\d+)\.\s+(.*)$', line)
            if m_num:
                num = m_num.group(1)
                content = m_num.group(2)
                html_lines.append(f'<li class="ms-5 list-decimal text-slate-300 my-1.5 leading-relaxed"><span class="font-bold text-cyan-400">{num}.</span> {format_inline(content)}</li>')
                i += 1
                continue

            # Empty lines
            if not line.strip():
                i += 1
                continue

            # Normal paragraphs
            html_lines.append(f'<p class="my-3 text-slate-300 leading-relaxed text-sm sm:text-base">{format_inline(line)}</p>')
            i += 1

        if in_table:
            html_lines.append(flush_table())
        if in_alert:
            html_lines.append(flush_alert())

        return '\n'.join(html_lines)

    rendered_body = render_markdown(md_text)

    # Extract headings for Table of Contents
    toc_items = []
    for h in re.finditer(r'<h([23]) id="(.*?)" class=".*?">(.*?)</h\1>', rendered_body):
        level = h.group(1)
        slug = h.group(2)
        raw_title = re.sub(r'<.*?>', '', h.group(3)).strip()
        toc_items.append((level, slug, raw_title))

    toc_html = '<nav class="space-y-1 text-xs sm:text-sm">\n'
    for level, slug, title in toc_items:
        indent = 'ps-2 font-bold text-slate-200 hover:text-cyan-300' if level == '2' else 'ps-6 text-slate-400 hover:text-white'
        toc_html += f'  <a href="#{slug}" class="block py-1.5 {indent} rounded-lg hover:bg-slate-800/60 transition-colors truncate" title="{title}">{title}</a>\n'
    toc_html += '</nav>'

    full_html = f'''<!DOCTYPE html>
<html lang="ar" dir="rtl" class="dark scroll-smooth">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>دليل التشغيل القياسي (SOP) - منظومة إدارة الجودة QMS 4.0</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2306b6d4' stroke-width='2'><path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z'/></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {{
      darkMode: 'class',
      theme: {{
        extend: {{
          fontFamily: {{
            sans: ['Cairo', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }},
        }}
      }}
    }}
  </script>
  <style>
    body {{
      font-family: 'Cairo', sans-serif;
    }}
    code, pre {{
      font-family: 'JetBrains Mono', monospace;
    }}
    @media print {{
      #sidebar, #top-bar, #lightbox, .no-print {{
        display: none !important;
      }}
      #main-content {{
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        max-width: 100% !important;
      }}
      body {{
        background: #fff !important;
        color: #000 !important;
      }}
      .table-container {{
        box-shadow: none !important;
        border: 1px solid #ccc !important;
      }}
    }}
  </style>
</head>
<body class="bg-slate-950 text-slate-200 antialiased selection:bg-cyan-500 selection:text-slate-950">

  <!-- TOP BAR -->
  <header id="top-bar" class="sticky top-0 z-40 w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-md">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
      <div class="flex items-center gap-3">
        <button id="menu-btn" class="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white" onclick="toggleSidebar()">
          ☰
        </button>
        <div class="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
        </div>
        <div>
          <h1 class="font-black text-sm sm:text-base text-white tracking-wide">QMS Enterprise 4.0 — دليل التشغيل القياسي</h1>
          <p class="text-[11px] text-cyan-400 font-mono">Standard Operating Procedure (SOP) & Work Instruction</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button onclick="window.print()" class="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 border border-cyan-500/30 font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm">
          <span>🖨️ طباعة / حفظ PDF</span>
        </button>
        <a href="https://qmssystem.gt.tc/" target="_blank" class="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all">
          <span>🌐 فتح المنظومة الحية ↗</span>
        </a>
      </div>
    </div>
  </header>

  <!-- MAIN LAYOUT -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex gap-8">
    
    <!-- SIDEBAR / TOC -->
    <aside id="sidebar" class="hidden lg:block w-72 shrink-0 sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto pr-2 pb-10 scrollbar-thin border-l border-slate-800">
      <div class="mb-4">
        <h3 class="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">📑 فهرس المحتويات والسيناريوهات</h3>
        <input 
          type="text" 
          id="toc-search" 
          placeholder="بحث سريع في المحتويات..." 
          onkeyup="filterToc()"
          class="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
        />
      </div>
      <div id="toc-list">
        {toc_html}
      </div>
    </aside>

    <!-- CONTENT BODY -->
    <main id="main-content" class="flex-1 min-w-0 max-w-4xl bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-sm">
      {rendered_body}
      
      <!-- FOOTER -->
      <footer class="mt-16 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          <span>منظومة إدارة الجودة الصناعية QMS 4.0 — الإصدار الشامل المعتمد</span>
        </div>
        <div>
          <span>تصميم وتطوير: <a href="https://www.facebook.com/share/1BZWXmCZRm/" target="_blank" class="text-cyan-400 font-bold hover:underline">PixoraCo</a></span>
        </div>
      </footer>
    </main>

  </div>

  <!-- LIGHTBOX MODAL (FOR ZOOMING ON SCREENSHOTS) -->
  <div id="lightbox" class="fixed inset-0 z-50 bg-black/90 backdrop-blur-md hidden flex items-center justify-center p-4 cursor-pointer" onclick="closeLightbox()">
    <div class="relative max-w-5xl w-full max-h-[90vh] flex flex-col items-center" onclick="event.stopPropagation()">
      <button class="absolute -top-10 end-0 text-white hover:text-cyan-400 text-xl font-bold p-2" onclick="closeLightbox()">✕ إغلاق</button>
      <img id="lightbox-img" src="" alt="" class="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl border border-white/10" />
      <p id="lightbox-caption" class="mt-3 text-center text-sm font-bold text-cyan-300"></p>
    </div>
  </div>

  <script>
    function openLightbox(src, caption) {{
      document.getElementById('lightbox-img').src = src;
      document.getElementById('lightbox-caption').innerText = caption;
      document.getElementById('lightbox').classList.remove('hidden');
    }}
    function closeLightbox() {{
      document.getElementById('lightbox').classList.add('hidden');
    }}
    document.addEventListener('keydown', (e) => {{
      if (e.key === 'Escape') closeLightbox();
    }});

    function toggleSidebar() {{
      const sb = document.getElementById('sidebar');
      sb.classList.toggle('hidden');
      if (!sb.classList.contains('hidden')) {{
        sb.classList.add('fixed', 'inset-y-0', 'start-0', 'z-50', 'bg-slate-950', 'p-6', 'w-80', 'shadow-2xl');
      }} else {{
        sb.classList.remove('fixed', 'inset-y-0', 'start-0', 'z-50', 'bg-slate-950', 'p-6', 'w-80', 'shadow-2xl');
      }}
    }}

    function filterToc() {{
      const q = document.getElementById('toc-search').value.toLowerCase();
      const links = document.querySelectorAll('#toc-list a');
      links.forEach(a => {{
        const text = a.innerText.toLowerCase();
        if (text.includes(q)) {{
          a.style.display = 'block';
        }} else {{
          a.style.display = 'none';
        }}
      }});
    }}
  </script>
</body>
</html>
'''

    os.makedirs('docs', exist_ok=True)
    os.makedirs(os.path.join('public', 'docs'), exist_ok=True)

    out_path_docs = os.path.join('docs', 'sop.html')
    out_path_public = os.path.join('public', 'docs', 'sop.html')

    with open(out_path_docs, 'w', encoding='utf-8') as f:
        f.write(full_html)
    with open(out_path_public, 'w', encoding='utf-8') as f:
        f.write(full_html)

    print(f"Generated {out_path_docs} ({len(full_html)} bytes)")
    print(f"Generated {out_path_public} ({len(full_html)} bytes)")

if __name__ == '__main__':
    build_html()
