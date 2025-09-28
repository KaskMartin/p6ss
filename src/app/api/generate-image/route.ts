import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {GoogleGenAI, PersonGeneration} from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    // Check if user is authenticated
    const session = await getServerSession(authOptions)
    if (!session) {
      console.log("MISSING SESSION!!!")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { prompt } = await request.json()

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Check if Gemini API key is configured
    // To get a Gemini API key:
    // 1. Go to https://makersuite.google.com/app/apikey
    // 2. Create a new API key
    // 3. Add it to your .env.local file as GEMINI_API_KEY=your-key-here
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY environment variable is not set")
      return NextResponse.json(
        { error: "Image generation service is not configured. Please set GEMINI_API_KEY environment variable." },
        { status: 500 }
      )
    }

    const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          includeRaiReason: true,
          aspectRatio: "3:4",
          personGeneration: PersonGeneration.ALLOW_ADULT,
        },
      });

    console.log(response.generatedImages);

    const img = (response.generatedImages && response.generatedImages[0]) || null;

    if (!img || !img.image) {
      return NextResponse.json({
            error: "No image generated",
        }, { status: 400 })
    }

    return NextResponse.json({
        image: img.image,
        enhancedPrompt: img.enhancedPrompt,
        prompt: prompt,
        timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error generating image:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
