# ResuMate

Open `index.html` in a browser. Paste a resume and job description, upload a resume file, or use the sample button.

Contact:

- brahmanisunkara@gmail.com
- +91 7569576029

## What it does

- Uses NLP-style normalization, tokenization, stop-word removal, and TF-IDF cosine similarity.
- Accepts TXT, MD, CSV, PDF, DOCX, and legacy DOC uploads.
- Extracts text from PDF files with PDF.js and DOCX files with Mammoth in the browser.
- Extracts role-specific and job-description-specific skills.
- Scores resume/job fit across four explainable dimensions:
  - Semantic fit: 34%
  - Skill coverage: 32%
  - ATS readiness: 16%
  - Evidence quality: 18%
- Produces matched skills, missing priorities, keyword opportunities, and ranked recommendations.
- Lets you adjust strictness to make scoring more or less demanding.
- Presents the tool as ResuMate with a polished, user-friendly interface and visible contact details.

## File support notes

PDF and DOCX extraction use browser-loaded libraries from jsDelivr, so those formats need internet access when the page is opened from disk. Legacy `.doc` files are accepted by the file picker, but old binary Word text cannot be reliably extracted in a browser-only static app. Convert `.doc` to `.docx` or PDF for accurate analysis.

## About 94% accuracy

The app is tuned for transparent, high-signal matching, but no resume analyzer can honestly claim 94%+ accuracy without a labeled validation dataset. To prove that number, collect resumes, job descriptions, and known outcomes or expert labels, then evaluate precision, recall, F1 score, and calibration. The current app is built so those scoring weights can be tuned against that dataset later.
