import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Ücretsiz çeviri API - MyMemory Translation API kullanıyoruz
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, from = 'tr', to } = body;

    if (!text || !to) {
      return NextResponse.json(
        { error: 'Text and target language (to) are required' },
        { status: 400 }
      );
    }

    if (from === to) {
      return NextResponse.json({ translatedText: text });
    }

    // MyMemory Translation API (ücretsiz, günlük 10,000 karakter limiti)
    const apiUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${from}|${to}`;
    
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error('Translation API failed');
    }

    const data = await response.json();
    
    if (data.responseStatus === 200 && data.responseData) {
      return NextResponse.json({ 
        translatedText: data.responseData.translatedText,
        originalText: text,
        from,
        to
      });
    } else {
      // Fallback: Eğer API başarısız olursa, orijinal metni döndür
      console.warn('Translation API returned unexpected response:', data);
      return NextResponse.json({ 
        translatedText: text,
        originalText: text,
        from,
        to,
        warning: 'Translation may not be accurate'
      });
    }
  } catch (error: any) {
    console.error('Error translating text:', error);
    return NextResponse.json(
      { error: 'Translation failed', details: error?.message },
      { status: 500 }
    );
  }
}
