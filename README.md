# tadabbur-platform

منصة التدبر القرآني: تلاوة السور، تحليل الكلمات من المعاجم، المقارنة البيانية بين الكلمات، مؤقت تقدم التدبر، ومزامنة اختيارية مع Firebase.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create `.env.local` from `.env.example` and set `OPENROUTER_API_KEY` (اختياري — التحليل المجاني عبر openrouter.ai):
   - `OPENROUTER_API_KEY=sk-or-v1-...` — سجّل في https://openrouter.ai وانسخ المفتاح
3. Run the app:
   `npm run dev`

يعمل التحليل دون أي مفتاح عبر المحلل المعجمي المحلي المدمج، أو عبر OpenRouter بالنماذج المجانية (`openrouter/free` وغيرها).
