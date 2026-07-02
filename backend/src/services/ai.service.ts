interface ChatHistoryItem {
  role: 'user' | 'model';
  text: string;
}

export const askGemini = async (
  prompt: string,
  history: ChatHistoryItem[],
  userProfile?: any
): Promise<string> => {
  const apiKey = process.env.GEMINI_API_KEY;

  const studentName = userProfile?.name || 'Student';
  const roleName = userProfile?.role || 'student';
  const deptName = userProfile?.department?.name || 'Unspecified Major';
  const semesterStr = userProfile?.semester ? `Semester ${userProfile.semester}` : 'Unspecified Semester';

  // Fallback response for local dev testing when GEMINI_API_KEY is unconfigured
  if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY') {
    return `Hello **${studentName}**! 👋 

I am currently running in **Dev-Helper Offline Mode** because the \`GEMINI_API_KEY\` is not yet configured in the backend \`.env\` file. 

However, as the CampusHub assistant, I can outline how the platform works:
1. **Attendance geofencing:** Your professor opens a 30-second time-decaying QR code. Our backend uses the *Haversine formula* to measure your GPS coordinates and verify you are within **30 meters** of the classroom before checking you in.
2. **Student Marketplace:** You can list items (Books, Lab Coats, Calculators, etc.) for sale. They default to *Pending* status and must be approved by an administrator before appearing on the public catalog feed.
3. **Campus Events:** Faculty organizers post seminars or workshops, and students can join RSVPs with one click.
4. **Study Materials:** Access pdf note packets shared by professors and track downloads.

*To unlock live conversational queries, please add a valid Gemini API Key to your server settings!*`;
  }

  const systemInstruction = `You are CampusHub Advisor, the official friendly AI assistant for the CampusHub student portal.
Your goal is to answer student and faculty queries about university life, study tips, and platform guides.
Always remain polite, encouraging, concise, and academically helpful. Format answers using markdown (bolding, lists, and line breaks).
Do not make up university policies or grades. If you don't know the answer, politely say so.

Current User Context:
- Name: ${studentName}
- Role: ${roleName}
- Department/Major: ${deptName}
- Academic Level: ${semesterStr}

Always address the user by their name (${studentName}) when welcoming them or concluding instructions, where natural.`;

  try {
    // Format history into Gemini API role/parts layout
    const contents = history.map((item) => ({
      role: item.role,
      parts: [{ text: item.text }],
    }));

    // Add the active prompt at the end
    contents.push({
      role: 'user',
      parts: [{ text: prompt }],
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents,
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800,
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Response Error:', errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const resData = await response.json();
    const reply = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!reply) {
      throw new Error('Invalid empty response structure from Gemini API');
    }

    return reply;
  } catch (error: any) {
    console.error('Failed to communicate with Gemini API:', error.message);
    return `Hello ${studentName}. I encountered an error while communicating with my AI model (${error.message}). Please try again shortly.`;
  }
};
