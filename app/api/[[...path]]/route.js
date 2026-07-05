import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';

const uri = process.env.MONGO_URL;
const dbName = process.env.DB_NAME || 'freshers_quiz';

let cachedClient = null;
let seeded = false;
async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri);
    await cachedClient.connect();
  }
  return cachedClient.db(dbName);
}

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'pass7890';
const ADMIN_TOKEN = Buffer.from(`${ADMIN_USER}:${ADMIN_PASS}`).toString('base64');

function isAdmin(request) {
  const auth = request.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '').trim();
  return token === ADMIN_TOKEN;
}

function json(data, status = 200) {
  return NextResponse.json(data, { status });
}

const SEED_QUESTIONS = [
  { question_text: "What does 'HTTP' stand for?", options: ["HyperText Transfer Protocol","HighText Transmission Protocol","HyperTool Transfer Protocol","HyperText Transmission Process"], correct_index: 0 },
  { question_text: "Who is known as the father of computers?", options: ["Alan Turing","Charles Babbage","Bill Gates","Tim Berners-Lee"], correct_index: 1 },
  { question_text: "Which planet is known as the Red Planet?", options: ["Venus","Jupiter","Mars","Saturn"], correct_index: 2 },
  { question_text: "Which language runs in a web browser?", options: ["Java","C","Python","JavaScript"], correct_index: 3 },
  { question_text: "Which of these is NOT a programming language?", options: ["Python","HTML","Java","C++"], correct_index: 1 },
  { question_text: "What is the largest ocean on Earth?", options: ["Atlantic","Indian","Arctic","Pacific"], correct_index: 3 },
  { question_text: "Who wrote 'Romeo and Juliet'?", options: ["Charles Dickens","William Shakespeare","Mark Twain","Jane Austen"], correct_index: 1 },
  { question_text: "What is 15 x 12?", options: ["170","180","190","175"], correct_index: 1 },
  { question_text: "Which company created the iPhone?", options: ["Google","Samsung","Apple","Microsoft"], correct_index: 2 },
  { question_text: "What does 'AI' stand for?", options: ["Automated Intelligence","Artificial Intelligence","Applied Informatics","Analog Interface"], correct_index: 1 },
];

async function ensureSeed(db) {
  if (seeded) return; // ponytail: per-process flag; cold start re-seeds, warm calls skip the 5-Atlas round-trips
  let quiz = await db.collection('quiz').findOne({ id: 'main' });
  if (!quiz) {
    quiz = {
      id: 'main',
      title: "Freshers' Quiz Challenge 2025",
      duration_minutes: 10,
      status: 'idle', // idle | running | ended
      started_at: null,
      ended_at: null,
      created_at: new Date().toISOString(),
    };
    await db.collection('quiz').insertOne(quiz);
  }
  const count = await db.collection('questions').countDocuments({ quiz_id: 'main' });
  if (count === 0) {
    const docs = SEED_QUESTIONS.map((q, idx) => ({
      id: uuidv4(),
      quiz_id: 'main',
      question_text: q.question_text,
      options: q.options,
      correct_index: q.correct_index,
      image_url: null,
      order: idx,
      created_at: new Date().toISOString(),
    }));
    await db.collection('questions').insertMany(docs);
  }
  // Seed the sequential registration counter (upsert — safe on warm restarts)
  await db.collection('counters').updateOne(
    { _id: 'participant_seq' },
    { $setOnInsert: { seq: 1000 } },
    { upsert: true }
  );
  // Indexes
  try {
    await db.collection('participants').createIndex({ id: 1 }, { unique: true });
    await db.collection('participants').createIndex({ reg_number: 1 }, { unique: true, sparse: true });
    await db.collection('questions').createIndex({ quiz_id: 1, order: 1 });
    await db.collection('results').createIndex({ score: -1, time_taken_seconds: 1 });
    await db.collection('results').createIndex({ participant_id: 1 }, { unique: true });
    await db.collection('responses').createIndex({ participant_id: 1 }, { unique: true });
  } catch (_) {}
  seeded = true;
  return quiz;
}

// ---------- ROUTE HANDLERS ----------

async function handle(request, method, pathParts) {
  const db = await getDb();
  await ensureSeed(db);
  const path = pathParts.join('/');
  const url = new URL(request.url);

  // ===== PUBLIC =====
  if (path === '' || path === 'health') return json({ ok: true, message: "Freshers' Quiz API" });

  // Quiz status (public)
  if (path === 'quiz' && method === 'GET') {
    const q = await db.collection('quiz').findOne({ id: 'main' }, { projection: { _id: 0 } });
    return json({ quiz: q, server_time: new Date().toISOString() });
  }

  // Get questions (public, without correct answers) — also records individual start time exactly once
  if (path === 'quiz/questions' && method === 'GET') {
    const q = await db.collection('quiz').findOne({ id: 'main' });
    if (!q || q.status === 'idle') return json({ error: 'Quiz has not started' }, 403);
    if (q.status === 'ended') return json({ error: 'Quiz has ended' }, 403);
    const participant_id = url.searchParams.get('participant_id');
    let started_at = null;
    if (participant_id) {
      const existing = await db.collection('responses').findOne({ participant_id });
      if (!existing) {
        started_at = new Date().toISOString();
        await db.collection('responses').insertOne({
          id: uuidv4(),
          participant_id,
          quiz_id: 'main',
          answers: {},
          marked: [],
          started_at,
          submitted: false,
          submitted_at: null,
        });
      } else {
        started_at = existing.started_at;
      }
    }
    const questions = await db.collection('questions')
      .find({ quiz_id: 'main' }, { projection: { _id: 0, correct_index: 0 } })
      .sort({ order: 1 }).toArray();
    return json({ questions, started_at });
  }

  // Register participant
  if (path === 'participants' && method === 'POST') {
    const body = await request.json();
    const { name, course, usn } = body;
    if (!name || !course) return json({ error: 'Name and course are required' }, 400);
    if (usn) {
      const existing = await db.collection('participants').findOne({ usn: usn.trim().toUpperCase() });
      if (existing) return json({ error: 'A participant with this USN/Roll number already exists' }, 409);
    }
    // Atomically grab the next sequential registration number — race-proof even at 500 concurrent requests
    const counter = await db.collection('counters').findOneAndUpdate(
      { _id: 'participant_seq' },
      { $inc: { seq: 1 } },
      { returnDocument: 'after', upsert: true }
    );
    const reg_number = counter.seq;
    const participant = {
      id: uuidv4(),
      reg_number,
      name: name.trim(),
      course: course.trim(),
      usn: usn ? usn.trim().toUpperCase() : null,
      created_at: new Date().toISOString(),
    };
    await db.collection('participants').insertOne(participant);
    return json({ participant });
  }

  // Get participant by id
  if (pathParts[0] === 'participants' && pathParts.length === 2 && method === 'GET') {
    const p = await db.collection('participants').findOne({ id: pathParts[1] }, { projection: { _id: 0 } });
    if (!p) return json({ error: 'Not found' }, 404);
    const result = await db.collection('results').findOne({ participant_id: p.id }, { projection: { _id: 0 } });
    const response = await db.collection('responses').findOne({ participant_id: p.id }, { projection: { _id: 0 } });
    return json({ participant: p, result, response });
  }

  // Submit quiz
  if (path === 'quiz/submit' && method === 'POST') {
    const body = await request.json();
    const { participant_id, answers: submittedAnswers, marked: submittedMarked } = body;
    if (!participant_id) return json({ error: 'Missing participant_id' }, 400);
    const existing = await db.collection('responses').findOne({ participant_id });

    // Idempotency: already submitted — return existing result
    if (existing && existing.submitted) {
      const existingResult = await db.collection('results').findOne({ participant_id });
      if (existingResult) return json({ result: { ...existingResult, _id: undefined } });
    }

    const participant = await db.collection('participants').findOne({ id: participant_id });
    if (!participant) return json({ error: 'Participant not found' }, 404);
    const quiz = await db.collection('quiz').findOne({ id: 'main' });
    const questions = await db.collection('questions').find({ quiz_id: 'main' }).toArray();

    // Use submitted answers; fall back to any stored draft answers
    const answers = submittedAnswers || (existing && existing.answers) || {};
    const markedArr = submittedMarked || (existing && existing.marked) || [];

    let correct = 0;
    let wrong = 0;
    for (const q of questions) {
      if (answers[q.id] === undefined) continue;
      if (Number(answers[q.id]) === Number(q.correct_index)) correct++;
      else wrong++;
    }
    const total = questions.length;
    const percentage = total > 0 ? Math.round((correct / total) * 10000) / 100 : 0;
    const submitted_at = new Date().toISOString();
    const started_at = existing?.started_at || quiz?.started_at || submitted_at;
    const time_taken_seconds = Math.max(0, Math.floor((new Date(submitted_at) - new Date(started_at)) / 1000));

    if (existing) {
      await db.collection('responses').updateOne(
        { participant_id },
        { $set: { answers, marked: markedArr, submitted: true, submitted_at } }
      );
    } else {
      await db.collection('responses').insertOne({
        id: uuidv4(), participant_id, quiz_id: 'main', answers, marked: markedArr, started_at, submitted: true, submitted_at,
      });
    }

    const existingResult = await db.collection('results').findOne({ participant_id });
    if (existingResult) return json({ result: { ...existingResult, _id: undefined } });

    const result = {
      id: uuidv4(),
      participant_id,
      participant_name: participant.name,
      participant_course: participant.course,
      quiz_id: 'main',
      correct,
      wrong,
      total,
      score: correct,
      percentage,
      submission_time: submitted_at,
      time_taken_seconds,
    };
    await db.collection('results').insertOne(result);
    return json({ result });
  }

  // Leaderboard
  if (path === 'leaderboard' && method === 'GET') {
    const results = await db.collection('results')
      .find({}, { projection: { _id: 0 } })
      .sort({ score: -1, time_taken_seconds: 1 })
      .limit(100)
      .toArray();
    const ranked = results.map((r, i) => ({ ...r, rank: i + 1 }));
    return json({ leaderboard: ranked });
  }

  // ===== ADMIN =====
  if (path === 'admin/login' && method === 'POST') {
    const body = await request.json();
    if (body.username === ADMIN_USER && body.password === ADMIN_PASS) {
      return json({ token: ADMIN_TOKEN });
    }
    return json({ error: 'Invalid credentials' }, 401);
  }

  if (path.startsWith('admin/') && !isAdmin(request) && path !== 'admin/login') {
    return json({ error: 'Unauthorized' }, 401);
  }

  if (path === 'admin/stats' && method === 'GET') {
    const [participants, results, questions, quiz] = await Promise.all([
      db.collection('participants').countDocuments({}),
      db.collection('results').countDocuments({}),
      db.collection('questions').countDocuments({ quiz_id: 'main' }),
      db.collection('quiz').findOne({ id: 'main' }, { projection: { _id: 0 } }),
    ]);
    return json({ participants, submissions: results, questions, quiz });
  }

  if (path === 'admin/questions' && method === 'GET') {
    const questions = await db.collection('questions').find({ quiz_id: 'main' }, { projection: { _id: 0 } }).sort({ order: 1 }).toArray();
    return json({ questions });
  }

  if (path === 'admin/questions' && method === 'POST') {
    const body = await request.json();
    const { question_text, options, correct_index, image_url } = body;
    if (!question_text || !Array.isArray(options) || options.length !== 4) return json({ error: 'Invalid data' }, 400);
    const maxOrder = await db.collection('questions').find({ quiz_id: 'main' }).sort({ order: -1 }).limit(1).toArray();
    const nextOrder = (maxOrder[0]?.order ?? -1) + 1;
    const q = {
      id: uuidv4(), quiz_id: 'main', question_text, options,
      correct_index: Number(correct_index) || 0, image_url: image_url || null,
      order: nextOrder, created_at: new Date().toISOString(),
    };
    await db.collection('questions').insertOne(q);
    return json({ question: q });
  }

  if (pathParts[0] === 'admin' && pathParts[1] === 'questions' && pathParts.length === 3 && method === 'PUT') {
    const body = await request.json();
    const update = {};
    ['question_text','options','correct_index','image_url','order'].forEach(k => { if (body[k] !== undefined) update[k] = body[k]; });
    await db.collection('questions').updateOne({ id: pathParts[2] }, { $set: update });
    return json({ ok: true });
  }

  if (pathParts[0] === 'admin' && pathParts[1] === 'questions' && pathParts.length === 3 && method === 'DELETE') {
    await db.collection('questions').deleteOne({ id: pathParts[2] });
    return json({ ok: true });
  }

  if (path === 'admin/questions/bulk' && method === 'POST') {
    const body = await request.json();
    const { questions } = body;
    if (!Array.isArray(questions) || questions.length === 0) return json({ error: 'No questions' }, 400);
    const maxOrder = await db.collection('questions').find({ quiz_id: 'main' }).sort({ order: -1 }).limit(1).toArray();
    let nextOrder = (maxOrder[0]?.order ?? -1) + 1;
    const docs = questions.map(q => ({
      id: uuidv4(), quiz_id: 'main',
      question_text: q.question_text, options: q.options,
      correct_index: Number(q.correct_index) || 0,
      image_url: q.image_url || null,
      order: nextOrder++, created_at: new Date().toISOString(),
    }));
    await db.collection('questions').insertMany(docs);
    return json({ inserted: docs.length });
  }

  // Quiz control
  if (path === 'admin/quiz/start' && method === 'POST') {
    const now = new Date().toISOString();
    await db.collection('quiz').updateOne({ id: 'main' }, { $set: { status: 'running', started_at: now, ended_at: null } });
    return json({ ok: true, started_at: now });
  }
  if (path === 'admin/quiz/end' && method === 'POST') {
    const now = new Date().toISOString();
    await db.collection('quiz').updateOne({ id: 'main' }, { $set: { status: 'ended', ended_at: now } });
    return json({ ok: true });
  }
  if (path === 'admin/quiz/reset' && method === 'POST') {
    await db.collection('quiz').updateOne({ id: 'main' }, { $set: { status: 'idle', started_at: null, ended_at: null } });
    await db.collection('responses').deleteMany({});
    await db.collection('results').deleteMany({});
    await db.collection('participants').deleteMany({});
    return json({ ok: true });
  }
  if (path === 'admin/quiz/duration' && method === 'POST') {
    const body = await request.json();
    const duration_minutes = Number(body.duration_minutes);
    if (!duration_minutes || duration_minutes < 1) return json({ error: 'Invalid duration' }, 400);
    await db.collection('quiz').updateOne({ id: 'main' }, { $set: { duration_minutes } });
    return json({ ok: true });
  }
  if (path === 'admin/quiz/title' && method === 'POST') {
    const body = await request.json();
    await db.collection('quiz').updateOne({ id: 'main' }, { $set: { title: body.title } });
    return json({ ok: true });
  }

  if (path === 'admin/participants' && method === 'GET') {
    const participants = await db.collection('participants').find({}, { projection: { _id: 0 } }).sort({ created_at: -1 }).toArray();
    return json({ participants });
  }
  if (path === 'admin/results' && method === 'GET') {
    const results = await db.collection('results').find({}, { projection: { _id: 0 } }).sort({ score: -1, time_taken_seconds: 1 }).toArray();
    return json({ results });
  }

  return json({ error: 'Not found', path }, 404);
}

export async function GET(request, { params }) {
  const p = await params;
  return handle(request, 'GET', p.path || []);
}
export async function POST(request, { params }) {
  const p = await params;
  return handle(request, 'POST', p.path || []);
}
export async function PUT(request, { params }) {
  const p = await params;
  return handle(request, 'PUT', p.path || []);
}
export async function DELETE(request, { params }) {
  const p = await params;
  return handle(request, 'DELETE', p.path || []);
}
