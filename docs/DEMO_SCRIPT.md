# InkDoc demo script (under 2 minutes)

**Before recording:**
- Have two terminals open: backend running (`uvicorn app.main:app --reload`) and frontend running (`npm run dev`).
- Have two or three clear photos of handwritten pages ready.
- Clear History so the demo starts from the empty state.
- Have a terminal ready with the load balancer loop from the last step.

| Time | Show | Say |
| --- | --- | --- |
| 0:00–0:10 | Terminals running backend and frontend, then http://localhost:5173 | "InkDoc turns photos of handwritten notes into documents. Here it's running locally: a FastAPI backend and a React frontend." |
| 0:10–0:20 | Home page; click **Start converting** | "The landing page explains the three steps. Let's convert some notes." |
| 0:20–0:40 | Drop 2–3 photos; use the arrow buttons to reorder; remove one; click **Extract text** and let the per-page progress run | "I can drop photos or use the phone camera, reorder and remove pages, then extract. Each page goes through the Pen to Print API on the server; the key never reaches the browser." |
| 0:40–1:05 | Editor: switch **Per page / Combined**; find a word, toggle case, **Replace all**; click **Join broken lines** and **Sentence case**, then **Undo**; rename the title | "Each photo sits beside its text. Find and replace, cleanup tools with undo, live word count and reading time, and it autosaves to history." |
| 1:05–1:20 | Export panel: choose **Word**, download; choose **PDF**, size 14, download; open both files briefly | "Export to Word, PDF, Markdown, HTML or text, with font size, date and page-break options." |
| 1:20–1:40 | **History**: search a word (highlighted), filter by **Exported as: PDF**, change sort to **Most words**, rename a document, delete one through the confirm dialog | "History is stored in the browser: searchable, filterable by date and export format, sortable, with rename and delete." |
| 1:40–1:55 | Open http://34.205.73.55, then run `for i in $(seq 6); do curl -s http://34.205.73.55/api/health \| grep -o '"server":"[^"]*"'; done` in the terminal | "In production, HAProxy balances two web servers. You can see requests alternate between web-01 and web-02, and the editor badge shows which server handled the OCR." |
| 1:55–2:00 | Toggle dark mode | "That's InkDoc: handwriting in, clean documents out." |
