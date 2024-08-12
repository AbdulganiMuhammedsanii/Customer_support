import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';
import pool from '../../../db'; // Import the PostgreSQL connection

const systemPrompt = `
"First of all, in all your responses, NEVER have Student or AI labels at the start. Return only the AI response without a tag no matter what. The following tags are merely to understand the system prompt. You are the academic advisor AI for a university's Computer Science department. Your role is to assist students with inquiries about courses, provide detailed information about course content, prerequisites, and outcomes, and guide them on course selections.

1. General Inquiry:
    - Student: 'What topics are covered in CS 1110?'
    - AI: 'CS 1110 covers programming and problem solving using Python. It emphasizes software development principles, style, and testing. Topics include procedural statements, loops, functions, recursion, arrays, strings, algorithms, exceptions, and object-oriented programming. The course is designed for students with no prior programming experience.'
2. Prerequisite Information:
    - Student: 'What is the prerequisite for CS 2110?'
    - AI: 'The prerequisite for CS 2110 is either CS 1110 or CS 1112, or an equivalent course on programming in a procedural language.'
3. Course Content:
    - Student: 'What data structures are taught in CS 3110?'
    - AI: 'CS 3110 covers various data structures including graph algorithms, balanced trees, memory heaps, and garbage collection. It also emphasizes functional programming techniques.'
4. Course Outcomes:
    - Student: 'What will I learn in CS 3410?'
    - AI: 'In CS 3410, you will learn about computer organization, systems programming, and the hardware/software interface. Topics include instruction sets, computer arithmetic, memory hierarchies, I/O devices, and multicore architectures. You will also learn assembly language programming and design a pipelined RISC processor.'
5. Escalation:
    - Student: 'I am confused about which course to take next.'
    - AI: 'I'm here to help you. Could you please provide more details about your current course progress and career goals? I will guide you on the best course options.'

Remember, your primary goal is to provide accurate and helpful information, ensuring students have a clear understanding of the courses and can make informed decisions about their academic path."
`;

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); // Make sure the API key is set in your environment variables

// Function to retrieve relevant documents from the knowledge base
function retrieveDocuments(query) {
  const filePath = path.join(process.cwd(), 'data', 'knowledge_base.json');
  let knowledgeBase;
  try {
    const jsonData = fs.readFileSync(filePath, 'utf-8');
    knowledgeBase = JSON.parse(jsonData);
  } catch (error) {
    console.error("Failed to read the knowledge base JSON file:", error);
    return [];
  }

  const relevantDocs = [];
  const queryWords = query.toLowerCase().split(' ');

  knowledgeBase.forEach(doc => {
    const contentLower = doc.content.toLowerCase();
    const containsQueryWord = queryWords.some(word => contentLower.includes(word));

    if (containsQueryWord) {
      relevantDocs.push(doc);
    }
  });

  if (relevantDocs.length === 0) {
    console.warn("No relevant documents found for query:", query);
  }

  return relevantDocs.slice(0, 3);
}

export async function POST(req) {
  const { query } = await req.json();

  if (typeof query !== 'string' || query.trim() === '') {
    return new NextResponse(JSON.stringify({ error: 'Invalid query' }), { status: 400 });
  }

  const retrievedDocs = retrieveDocuments(query);
  const context = retrievedDocs.map(doc => doc.content).join("\n");
  const modifiedPrompt = `${systemPrompt}\n\nContext:\n${context}\n\n`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: modifiedPrompt },
        { role: 'user', content: query },
      ],
      model: 'gpt-3.5-turbo',
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const text = encoder.encode(content);
              controller.enqueue(text);
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);

  } catch (error) {
    console.error('Error generating response:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to generate response' }), { status: 500 });
  }
}

export async function GET() {
  try {
    // Establish a connection to the database
    const client = await pool.connect();

    // Debug log to verify the function is running
    console.log("Database connection established");

    // Execute the query to select all courses
    const result = await client.query('SELECT * FROM courses');

    // Debug log to verify the query result
    console.log("Query Result:", result.rows);

    // Release the client back to the pool
    client.release();

    // Return the query result as JSON
    return NextResponse.json(result.rows);
  } catch (error) {
    // Log any errors that occur during the process
    console.error('Error fetching courses:', error);

    // Return an error response
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}

