import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Google AI client with the API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

// Function to convert a file stream to a Buffer
async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convert file to a GoogleGenerativeAI.Part object
    const buffer = await streamToBuffer(file.stream());
    const base64String = buffer.toString('base64');
    
    const imagePart = {
      inlineData: {
        data: base64String,
        mimeType: file.type,
      },
    };

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
You are an expert receipt scanning assistant. Analyze the receipt image and extract the item details.

Return ONLY a valid JSON object with the following structure:
{
  "items": [
    {"quantity": number, "name": "item name", "price": number}
  ],
  "tax": number,
  "service": number
}

Rules:
1.  **Items**: Extract all individual items. 
    -   'quantity' should be the item count, default to 1 if not specified.
    -   'name' should be the item's name.
    -   'price' must be the total price for that line item (quantity * unit price), as a full numerical value (e.g., 18000 for eighteen thousand), without currency symbols or abbreviations like 'k'.
2.  **Tax**: Find the tax **percentage**. Return it as a number (e.g., 11 for 11%). If not found, use 0.
3.  **Service**: Find the service charge **percentage**. Return it as a number (e.g., 10.5 for 10.5%). If not found, use 0.
4.  **Important**: Do not include subtotal or total fields in the final JSON. Only include items, tax, and service.
5.  **Output**: Your entire response must be ONLY the raw JSON object, without any surrounding text, explanations, or markdown formatting like \`\`\`json.
`;

    let result;
    const maxRetries = 3;
    let attempt = 0;
    while (attempt < maxRetries) {
      try {
        result = await model.generateContent([prompt, imagePart]);
        // If successful, break out of the loop
        break; 
      } catch (error: any) {
        attempt++;
        // Only retry if error is 503 (Service Unavailable) and not yet max retries
        if (attempt < maxRetries && error.status === 503) {
          console.log(`Attempt ${attempt} failed with 503. Retrying in ${attempt}s...`);
          // Wait before retrying (exponential backoff: 1s, then 2s)
          await new Promise(resolve => setTimeout(resolve, attempt * 1000));
        } else {
          // Re-throw other errors or on final attempt
          throw error;
        }
      }
    }

    // If after all attempts, result is still undefined, throw a general error
    if (!result) {
      throw new Error('Failed to get a response from Gemini after multiple retries.');
    }

    const response = result.response;
    const text = response.text();

    // Clean up the response to ensure it's a valid JSON string
    // The model might sometimes include markdown ```json ... ```
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Gemini Response Text:", text);
      throw new Error('No valid JSON object found in the Gemini response.');
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(extractedData);
  } catch (error) {
    console.error('Error in /api/extract:', error);
    return NextResponse.json(
      { error: 'Failed to extract data from image.' },
      { status: 500 }
    );
  }
}
