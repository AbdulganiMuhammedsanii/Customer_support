import { NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import fs from 'fs';
import path from 'path';

// System prompt remains the same
const systemPrompt = `
"First of all, in all your responses, NEVER have Customer or AI labels at the start. Return only the AI response without a tag no matter what. The following tags are merely to understand for the system prompt.You are the customer support AI for Zara, a global fashion retailer offering trendy and stylish clothing, shoes, and accessories for men, women, and children. Your role is to assist customers with inquiries, provide information about products and services, help with order issues, and offer guidance on returns and exchanges.

1. General Inquiry:
    - Customer: 'What is Zara's return policy?'
    - AI: 'Hello! Zara offers a 30-day return policy for most items. You can return items in-store or by mail. Would you like detailed instructions on how to proceed?'
2. Order Issue:
    - Customer: 'I need to track my order.'
    - AI: 'I'm here to help. Please provide your order number, and I will check the status for you.'
3. Product Information:
    - Customer: 'What materials are used in this dress?'
    - AI: 'This dress is made from 100% organic cotton. It's breathable and comfortable for everyday wear. Is there anything else you would like to know?'
4. Returns and Exchanges:
    - Customer: 'How do I exchange an item?'
    - AI: 'To exchange an item, please visit our website and fill out the exchange form or visit your nearest Zara store. Would you like me to provide the link to the form?'
5. Escalation:
    - Customer: 'My order was delivered to the wrong address.'
    - AI: 'I'm sorry for the inconvenience. I will escalate this to our customer support team right away. Could you please provide your order number and the correct address?'

Remember, your primary goal is to provide excellent customer service, ensuring customers have a smooth and enjoyable experience with Zara."
`;

// Initialize OpenAI
const openai = new OpenAI();

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
    console.log("Processing document:", doc);  // Log the entire document

    if (doc.content && typeof doc.content === 'string') {

      const contentLower = doc.content.toLowerCase();
      const containsQueryWord = queryWords.some(word => contentLower.includes(word));

      if (containsQueryWord) {
        console.log(`Document ID: ${doc.id} - Content: ${doc.content}`);
        relevantDocs.push(doc);
      }
    } else {
      console.warn(`Skipping document with undefined or invalid content:`, doc);
    }
  });

  if (relevantDocs.length === 0) {
    console.warn("No relevant documents found for query:", query);
  }

  return relevantDocs.slice(0, 3);
}

export async function POST(req) {
  // Parse the request body to extract the `query` parameter
  const { query } = await req.json();

  // Validation: Check if `query` is a valid string
  if (typeof query !== 'string' || query.trim() === '') {
    console.error("Invalid query received:", query);
    return new NextResponse(JSON.stringify({ error: "Invalid query" }), { status: 400 });
  }

  console.log("Received query:", query);  // Log the received query for debugging

  // Retrieve relevant documents based on the validated query
  const retrievedDocs = retrieveDocuments(query);

  if (retrievedDocs.length === 0) {
    console.warn("No relevant documents found for query:", query);
  }

  // Combine the retrieved documents to form a context
  const context = retrievedDocs.map(doc => doc.content).join("\n");

  // Modify the system prompt to include the retrieved context
  const modifiedPrompt = `${systemPrompt}\n\nContext:\n${context}\n\n`;

  // Generate the response using OpenAI's API
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "system", content: modifiedPrompt },
      { role: "user", content: query },
    ],
    model: "gpt-3.5-turbo",
    stream: true,
  });

  // Stream the response back to the client
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
}