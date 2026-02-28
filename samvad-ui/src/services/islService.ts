export interface ClipItem {
    word: string;
    url: string;
    found: boolean;
}

export interface TextToISLResponse {
    gloss: string[];
    clips: ClipItem[];
    coverage: number;
    mode: string;
}

export async function translateToISL(
    text: string,
    speed: number,
    persona: string
): Promise<TextToISLResponse> {
    const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/text-to-isl`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, speed, persona }),
        }
    );
    if (!res.ok) throw new Error(`Translation failed: ${res.status}`);
    return res.json();
}
