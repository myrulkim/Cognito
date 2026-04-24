// src/services/groq.js

const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY; 
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const generateAcademicQuiz = async (form, subject, level, retries = 3) => {
  const languageInstruction = subject === 'B. Inggeris' 
    ? "ARAHAN BAHASA: MESTI JANA SOALAN, PILIHAN JAWAPAN, DAN PENERANGAN DALAM BAHASA INGGERIS SAHAJA (English Language). Uji bahagian Grammar (Tenses, Prepositions, Conjunctions), Vocabulary, atau Error Correction mengikut standard CEFR KSSM." 
    : "ARAHAN BAHASA: Jana soalan, pilihan jawapan dan penerangan dalam Bahasa Melayu.";

  const systemPrompt = `Anda adalah seorang Pakar Kurikulum KSSM Malaysia yang mempunyai akses mental kepada semua Buku Teks dan DSKP KSSM.
    Tugas anda: Jana 5 soalan objektif yang 100% sejajar dengan Silibus Buku Teks KSSM.
    Subjek: ${subject}, Tingkatan: ${form}, Tahap: ${level}.
    
    ${languageInstruction}
    
    ARAHAN KETAT:
    1. FORMAT PEPERIKSAAN: Jana soalan mengikut format Kertas Peperiksaan Rasmi (UASA/SPM).
    2. KBAT/HOTS: Untuk tahap 'Medium' dan 'Hard', masukkan elemen KBAT yang memerlukan pemikiran kritis.
    3. DISTRACTORS: Pilihan jawapan mestilah munasabah dan mencabar supaya tidak terlalu mudah diteka. 
    4. SILIBUS: Rujuk Buku Teks KSSM Tingkatan ${form} subjek ${subject} secara spesifik.
    5. 'options' MESTI mengandungi TEPAT 4 elemen string berbeza (cth: ["A", "B", "C", "D"]).
    6. Format output MESTI JSON sah: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], "answer": "...", "explanation": "..."}]}`;

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`[GroqEngine] Attempt ${i + 1}/${retries} for ${subject}...`);
      
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: i === 0 ? "llama-3.3-70b-versatile" : "llama-3.1-8b-instant", // Kalau attempt 1 fail, kita guna model ringan
          messages: [{ role: "system", content: systemPrompt }],
          temperature: 0.8,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Status ${response.status}`);
      }

      const data = await response.json();
      const content = JSON.parse(data.choices[0].message.content);
      
      if (content.questions && content.questions.length > 0) {
          console.log("[GroqEngine] Success on attempt " + (i + 1));
          return content.questions;
      }
      
    } catch (error) {
      console.warn(`[GroqEngine] Attempt ${i + 1} failed: ${error.message}`);
      if (i === retries - 1) throw error; // Kalau last attempt pun fail, baru throw
      await sleep(1500); // Tunggu 1.5 saat sebelum cuba lagi
    }
  }
};
