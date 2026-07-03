#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

user_problem_statement: |
  Build a Freshers' Quiz Challenge web app for a college orientation event with 500+ participants.
  Landing → Registration → Waiting → Live Quiz (server-timed, 10 min) → Results → Leaderboard → Winner screen.
  Admin dashboard at /admin (username: admin, password: pass7890) with:
  quiz control (start/stop/reset/duration), questions CRUD, bulk CSV upload, participants list,
  results export CSV. Prevent duplicates by USN, one attempt only, auto-save answers, disable copy/paste,
  warn before leaving. Stack adapted: Next.js + MongoDB (originally requested Vite+Supabase but env is Next+Mongo).

backend:
  - task: "Quiz status endpoint (GET /api/quiz)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Returns quiz object (main) + server_time. Auto-seeds quiz + 10 sample questions on first call."
        - working: true
          agent: "testing"
          comment: "✅ PASS - Returns 200 with quiz object (id='main', status='idle', duration_minutes=10) and server_time. Auto-seeding verified."

  - task: "Participant registration (POST /api/participants)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Creates participant with UUID. Rejects duplicate USN with 409."
        - working: true
          agent: "testing"
          comment: "✅ PASS - Creates participant with UUID successfully. Duplicate USN correctly rejected with 409. Missing required fields return 400."

  - task: "Get participant + response (GET /api/participants/:id)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Returns participant, existing response and result if any."
        - working: true
          agent: "testing"
          comment: "✅ PASS - Returns 200 with participant object, result, and response data correctly."

  - task: "Get quiz questions (GET /api/quiz/questions) - only when running"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Returns 403 when quiz is idle; hides correct_index."

  - task: "Save answer (POST /api/quiz/answer) - auto-save"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Upserts response per participant; handles marked-for-review flag; rejects after submission."

  - task: "Submit quiz (POST /api/quiz/submit)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Computes correct/wrong/percentage/time_taken; idempotent (returns existing result on re-submit)."

  - task: "Leaderboard (GET /api/leaderboard)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Sorted by score desc, time_taken asc; adds rank."

  - task: "Admin login (POST /api/admin/login)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Static credentials admin/pass7890; returns bearer token."

  - task: "Admin CRUD for questions"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "POST/PUT/DELETE + bulk endpoint. Requires Bearer token."

  - task: "Admin quiz control (start/end/reset/duration/title)"
    implemented: true
    working: "NA"
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: true
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Start sets status=running + started_at; reset wipes participants/responses/results."

frontend:
  - task: "Participant flow UI"
    implemented: true
    working: "NA"
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Landing/Register/Waiting/Quiz/Results/Leaderboard with glassmorphism + framer-motion."

  - task: "Admin dashboard UI"
    implemented: true
    working: "NA"
    file: "app/admin/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: "NA"
          agent: "main"
          comment: "Login + dashboard with stats, quiz control, questions CRUD, bulk upload, participants, results export."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 0
  run_ui: false

test_plan:
  current_focus:
    - "All backend endpoints (public + admin)"
  stuck_tasks: []
  test_all: true
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: |
        Built full MVP. Please test all backend endpoints in this exact user flow:
        1. GET /api/quiz -> expect idle quiz with 10 seeded questions
        2. POST /api/participants (with unique USN) -> get participant ID
        3. POST /api/participants with same USN -> expect 409
        4. GET /api/quiz/questions when idle -> expect 403
        5. POST /api/admin/login {username:"admin", password:"pass7890"} -> get token
        6. POST /api/admin/login with wrong creds -> 401
        7. GET /api/admin/stats WITHOUT token -> 401
        8. GET /api/admin/stats WITH token -> stats
        9. POST /api/admin/questions (add a question)
        10. PUT /api/admin/questions/:id (update)
        11. POST /api/admin/questions/bulk (CSV-style array)
        12. POST /api/admin/quiz/start -> status running
        13. GET /api/quiz/questions -> now returns questions (no correct_index)
        14. POST /api/quiz/answer (save an answer)
        15. POST /api/quiz/submit -> get result with correct/wrong/percentage/time_taken
        16. Re-submit -> should return same (idempotent)
        17. GET /api/leaderboard -> ranked results
        18. POST /api/admin/quiz/end -> status ended
        19. POST /api/admin/quiz/reset -> should wipe participants/results
        
        Base URL: use NEXT_PUBLIC_BASE_URL from /app/.env. All routes prefixed /api.
        Admin token = base64("admin:pass7890").
