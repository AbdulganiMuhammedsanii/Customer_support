import { NextResponse } from 'next/server';
import pool from '../../../db';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { HttpResponseOutputParser } from 'langchain/output_parsers';
import { JSONLoader } from 'langchain/document_loaders/fs/json';
import { RunnableSequence } from '@langchain/core/runnables';
import { formatDocumentsAsString } from 'langchain/util/document';
import path from 'path';

const loader = new JSONLoader(
  path.join(process.cwd(), 'data', 'knowledge_base_department.json'), // Updated structure
  ["/computer_science"]
);
const loader1 = new JSONLoader(
  path.join(process.cwd(), 'data', 'knowledge_base_courses.json'), // Updated structure
  ["/courses"]
);

export const dynamic = 'force-dynamic';

const TEMPLATE = `Answer the user's questions based only on the following context. If the answer is not in the context, reply politely that you do not have that information available.:
==============================
Context: {context}
==============================
Current conversation: {chat_history}

user: {question}
assistant:`;

export async function POST(req) {
  try {
    const { messages } = await req.json();
    console.log('Messages:', messages.length);

    const formattedPreviousMessages = messages.slice(0, -1).map(message => `${message.role}: ${message.content}`);
    const currentMessageContent = messages[messages.length - 1].content;

    const docs = await loader.load();

    const prompt = PromptTemplate.fromTemplate(TEMPLATE);

    const model = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'gpt-3.5-turbo',
      temperature: 0,
      verbose: true,
    });

    const parser = new HttpResponseOutputParser();

    const chain = RunnableSequence.from([
      {
        question: input => input.question,
        chat_history: input => input.chat_history,
        context: () => formatDocumentsAsString(docs),
      },
      prompt,
      model,
      parser,
    ]);

    const result = await chain.invoke({
      chat_history: formattedPreviousMessages.join('\n'),
      question: currentMessageContent,
    });

    const decoder = new TextDecoder('utf-8');
    const responseText = decoder.decode(result);

    return NextResponse.json({ response: responseText });
  } catch (e) {
    console.error('Error during POST request:', e.message);
    return NextResponse.json({ error: e.message }, { status: e.status ?? 500 });
  }
}

export async function GET() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT * FROM courses');
    client.release();

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching courses:', error);
    return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
  }
}
