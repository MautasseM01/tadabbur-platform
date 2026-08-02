import { GoogleGenAI } from '@google/genai';
import { NextRequest, NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "mock-key" });

export async function POST(req: NextRequest) {
  try {
    const { urls } = await req.json();
    
    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
    }

    // In a real application, we would first grab the YouTube transcripts via an external API.
    // For this prototype, we'll ask Gemini to "simulate" or attempt to classify based on URL.
    // If we have a real Gemini API key, we call it. If not, we return mocked results.
    
    if (!process.env.GEMINI_API_KEY) {
      // Return mocked behavior if no API key is present
      const mockedResults = urls.map((url: string, index: number) => {
        // Randomly assign to Anbiya or Fatiha
        const surahId = index % 2 === 0 ? 21 : 1;
        const shahrur = index % 3 === 0;
        return {
          url,
          surahId,
          ayahNumber: Math.floor(Math.random() * 5) + 1,
          title: `استخراج تجريبي للفيديو ${index + 1}`,
          scholar: shahrur ? 'د. محمد شحرور' : 'د. فاضل السامرائي',
          status: 'success'
        };
      });
      // Simulate delay
      await new Promise(res => setTimeout(res, 2000));
      return NextResponse.json({ results: mockedResults });
    }

    const prompt = `You are a Quranic automation assistant.
The user provided the following list of YouTube URLs. 
Normally you would read their exact transcript, but here please simulate extracting the title, the scholar, and mapping them to a logical Surah ID (number) and Ayah Number.
The primary scholars involved in this project are "د. فاضل السامرائي" and "د. محمد شحرور".
Return ONLY a raw JSON array of objects with the structure:
[{ "url": "...", "surahId": NUMBER, "ayahNumber": NUMBER, "title": "...", "scholar": "...", "status": "success" }]

URLs:
${urls.join('\n')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    try {
      // Removing potential markdown JSON formatting
      const rawText = response.text || "[]";
      const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const aiResults = JSON.parse(cleanText);
      
      return NextResponse.json({ results: aiResults });
    } catch (parseError) {
       return NextResponse.json({ 
         error: 'Failed to parse AI response', 
         rawResponse: response.text 
       }, { status: 500 });
    }

  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
