#!/usr/bin/env python3
"""
Backend API Test Suite for Freshers' Quiz Challenge
Tests all 25 steps as specified in the review request
"""

import requests
import json
import sys
from typing import Dict, Any

# Configuration
BASE_URL = "https://quiz-leaderboard-50.preview.emergentagent.com/api"
ADMIN_TOKEN = "YWRtaW46cGFzczc4OTA="  # base64("admin:pass7890")

# Test data storage
test_data = {
    "participant_id": None,
    "question_id": None,
    "added_question_id": None,
    "result": None
}

def print_step(step_num: int, description: str):
    """Print test step header"""
    print(f"\n{'='*80}")
    print(f"STEP {step_num}: {description}")
    print('='*80)

def print_result(success: bool, message: str, details: Any = None):
    """Print test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {message}")
    if details:
        print(f"Details: {json.dumps(details, indent=2)}")
    return success

def test_step_1():
    """GET /api/quiz -> 200, returns quiz object with id='main', status='idle', duration_minutes=10, server_time present"""
    print_step(1, "GET /api/quiz - Check quiz status and auto-seeding")
    try:
        response = requests.get(f"{BASE_URL}/quiz", timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        if "quiz" not in data:
            return print_result(False, "Missing 'quiz' in response", data)
        
        quiz = data["quiz"]
        checks = [
            (quiz.get("id") == "main", f"quiz.id should be 'main', got {quiz.get('id')}"),
            (quiz.get("status") == "idle", f"quiz.status should be 'idle', got {quiz.get('status')}"),
            (quiz.get("duration_minutes") == 10, f"quiz.duration_minutes should be 10, got {quiz.get('duration_minutes')}"),
            ("server_time" in data, "server_time should be present in response")
        ]
        
        for check, msg in checks:
            if not check:
                return print_result(False, msg, data)
        
        return print_result(True, "Quiz status endpoint working correctly", {"quiz_id": quiz.get("id"), "status": quiz.get("status")})
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_2():
    """POST /api/participants with valid data -> 200, returns participant with UUID id"""
    print_step(2, "POST /api/participants - Register new participant")
    try:
        payload = {
            "name": "Alice Johnson",
            "course": "CSE",
            "usn": "TEST001"
        }
        response = requests.post(f"{BASE_URL}/participants", json=payload, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        if "participant" not in data:
            return print_result(False, "Missing 'participant' in response", data)
        
        participant = data["participant"]
        if not participant.get("id"):
            return print_result(False, "Participant ID missing", data)
        
        # Store for later tests
        test_data["participant_id"] = participant["id"]
        
        return print_result(True, f"Participant registered successfully", {"id": participant["id"], "name": participant.get("name")})
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_3():
    """POST /api/participants with same USN -> 409 duplicate error"""
    print_step(3, "POST /api/participants - Duplicate USN should return 409")
    try:
        payload = {
            "name": "Bob Smith",
            "course": "ECE",
            "usn": "TEST001"  # Same USN as Alice
        }
        response = requests.post(f"{BASE_URL}/participants", json=payload, timeout=10)
        if response.status_code != 409:
            return print_result(False, f"Expected 409 for duplicate USN, got {response.status_code}", response.text)
        
        data = response.json()
        if "error" not in data:
            return print_result(False, "Expected error message in response", data)
        
        return print_result(True, "Duplicate USN correctly rejected with 409", {"error": data.get("error")})
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_4():
    """POST /api/participants with missing name -> 400"""
    print_step(4, "POST /api/participants - Missing required field should return 400")
    try:
        payload = {
            "course": "CSE",
            "usn": "TEST002"
        }
        response = requests.post(f"{BASE_URL}/participants", json=payload, timeout=10)
        if response.status_code != 400:
            return print_result(False, f"Expected 400 for missing name, got {response.status_code}", response.text)
        
        return print_result(True, "Missing name correctly rejected with 400")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_5():
    """GET /api/quiz/questions while quiz is idle -> 403"""
    print_step(5, "GET /api/quiz/questions - Should return 403 when quiz is idle")
    try:
        response = requests.get(f"{BASE_URL}/quiz/questions", timeout=10)
        if response.status_code != 403:
            return print_result(False, f"Expected 403 when quiz is idle, got {response.status_code}", response.text)
        
        return print_result(True, "Questions correctly blocked when quiz is idle (403)")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_6():
    """POST /api/admin/login with wrong credentials -> 401"""
    print_step(6, "POST /api/admin/login - Wrong credentials should return 401")
    try:
        payload = {
            "username": "admin",
            "password": "wrongpassword"
        }
        response = requests.post(f"{BASE_URL}/admin/login", json=payload, timeout=10)
        if response.status_code != 401:
            return print_result(False, f"Expected 401 for wrong credentials, got {response.status_code}", response.text)
        
        return print_result(True, "Wrong credentials correctly rejected with 401")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_7():
    """POST /api/admin/login with correct credentials -> 200, returns token"""
    print_step(7, "POST /api/admin/login - Correct credentials should return token")
    try:
        payload = {
            "username": "admin",
            "password": "pass7890"
        }
        response = requests.post(f"{BASE_URL}/admin/login", json=payload, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        if "token" not in data:
            return print_result(False, "Missing 'token' in response", data)
        
        if data["token"] != ADMIN_TOKEN:
            return print_result(False, f"Token mismatch. Expected {ADMIN_TOKEN}, got {data['token']}")
        
        return print_result(True, "Admin login successful with correct token")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_8():
    """GET /api/admin/stats WITHOUT auth header -> 401"""
    print_step(8, "GET /api/admin/stats - Without auth should return 401")
    try:
        response = requests.get(f"{BASE_URL}/admin/stats", timeout=10)
        if response.status_code != 401:
            return print_result(False, f"Expected 401 without auth, got {response.status_code}", response.text)
        
        return print_result(True, "Admin stats correctly protected (401 without auth)")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_9():
    """GET /api/admin/stats WITH Bearer token -> 200, returns stats"""
    print_step(9, "GET /api/admin/stats - With auth should return stats")
    try:
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        response = requests.get(f"{BASE_URL}/admin/stats", headers=headers, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        required_fields = ["participants", "submissions", "questions", "quiz"]
        for field in required_fields:
            if field not in data:
                return print_result(False, f"Missing '{field}' in stats response", data)
        
        return print_result(True, "Admin stats retrieved successfully", {
            "participants": data.get("participants"),
            "submissions": data.get("submissions"),
            "questions": data.get("questions")
        })
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_10():
    """GET /api/admin/questions with token -> returns list of 10 seeded questions"""
    print_step(10, "GET /api/admin/questions - Should return seeded questions")
    try:
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        response = requests.get(f"{BASE_URL}/admin/questions", headers=headers, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        if "questions" not in data:
            return print_result(False, "Missing 'questions' in response", data)
        
        questions = data["questions"]
        if len(questions) < 10:
            return print_result(False, f"Expected at least 10 seeded questions, got {len(questions)}")
        
        # Store first question ID for later tests
        if questions:
            test_data["question_id"] = questions[0]["id"]
        
        return print_result(True, f"Retrieved {len(questions)} questions successfully")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_11():
    """POST /api/admin/questions with new question -> 200 returns question"""
    print_step(11, "POST /api/admin/questions - Add new question")
    try:
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        payload = {
            "question_text": "What is the capital of France?",
            "options": ["London", "Berlin", "Paris", "Madrid"],
            "correct_index": 2
        }
        response = requests.post(f"{BASE_URL}/admin/questions", json=payload, headers=headers, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        if "question" not in data:
            return print_result(False, "Missing 'question' in response", data)
        
        question = data["question"]
        if not question.get("id"):
            return print_result(False, "Question ID missing", data)
        
        # Store for later deletion
        test_data["added_question_id"] = question["id"]
        
        return print_result(True, "Question added successfully", {"id": question["id"], "text": question.get("question_text")})
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_12():
    """PUT /api/admin/questions/:id updating the question_text -> 200 ok"""
    print_step(12, "PUT /api/admin/questions/:id - Update question")
    try:
        if not test_data["added_question_id"]:
            return print_result(False, "No question ID available from previous test")
        
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        payload = {
            "question_text": "What is the capital city of France?"
        }
        response = requests.put(
            f"{BASE_URL}/admin/questions/{test_data['added_question_id']}", 
            json=payload, 
            headers=headers, 
            timeout=10
        )
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        return print_result(True, "Question updated successfully")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_13():
    """POST /api/admin/questions/bulk with questions array -> 200 inserted:1"""
    print_step(13, "POST /api/admin/questions/bulk - Bulk insert questions")
    try:
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        payload = {
            "questions": [
                {
                    "question_text": "What is 2 + 2?",
                    "options": ["3", "4", "5", "6"],
                    "correct_index": 1
                }
            ]
        }
        response = requests.post(f"{BASE_URL}/admin/questions/bulk", json=payload, headers=headers, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        if "inserted" not in data:
            return print_result(False, "Missing 'inserted' count in response", data)
        
        if data["inserted"] != 1:
            return print_result(False, f"Expected inserted:1, got {data['inserted']}")
        
        return print_result(True, "Bulk insert successful", {"inserted": data["inserted"]})
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_14():
    """DELETE /api/admin/questions/:id -> 200 ok"""
    print_step(14, "DELETE /api/admin/questions/:id - Delete question")
    try:
        if not test_data["added_question_id"]:
            return print_result(False, "No question ID available from previous test")
        
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        response = requests.delete(
            f"{BASE_URL}/admin/questions/{test_data['added_question_id']}", 
            headers=headers, 
            timeout=10
        )
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        return print_result(True, "Question deleted successfully")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_15():
    """POST /api/admin/quiz/start -> 200. Verify GET /api/quiz shows status='running'"""
    print_step(15, "POST /api/admin/quiz/start - Start quiz")
    try:
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        response = requests.post(f"{BASE_URL}/admin/quiz/start", headers=headers, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        # Verify quiz status changed to running
        response = requests.get(f"{BASE_URL}/quiz", timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Failed to verify quiz status: {response.status_code}")
        
        data = response.json()
        quiz = data.get("quiz", {})
        if quiz.get("status") != "running":
            return print_result(False, f"Expected status 'running', got '{quiz.get('status')}'", data)
        
        if not quiz.get("started_at"):
            return print_result(False, "started_at should be set", data)
        
        return print_result(True, "Quiz started successfully", {"status": quiz.get("status"), "started_at": quiz.get("started_at")})
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_16():
    """GET /api/quiz/questions now -> 200 with questions; verify NO correct_index field"""
    print_step(16, "GET /api/quiz/questions - Should return questions WITHOUT correct_index")
    try:
        response = requests.get(f"{BASE_URL}/quiz/questions", timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        if "questions" not in data:
            return print_result(False, "Missing 'questions' in response", data)
        
        questions = data["questions"]
        if not questions:
            return print_result(False, "Questions array is empty")
        
        # Verify NO question has correct_index
        for q in questions:
            if "correct_index" in q:
                return print_result(False, f"Question should NOT include 'correct_index' field", q)
        
        # Store first question ID for answer submission
        if not test_data["question_id"] and questions:
            test_data["question_id"] = questions[0]["id"]
        
        return print_result(True, f"Questions retrieved correctly without correct_index ({len(questions)} questions)")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_17():
    """POST /api/quiz/answer with participant_id, question_id, selected_index -> 200"""
    print_step(17, "POST /api/quiz/answer - Submit answer")
    try:
        if not test_data["participant_id"]:
            return print_result(False, "No participant_id available")
        if not test_data["question_id"]:
            return print_result(False, "No question_id available")
        
        payload = {
            "participant_id": test_data["participant_id"],
            "question_id": test_data["question_id"],
            "selected_index": 0
        }
        response = requests.post(f"{BASE_URL}/quiz/answer", json=payload, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        return print_result(True, "Answer submitted successfully")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_18():
    """POST /api/quiz/answer again with different selected_index and marked:true -> 200"""
    print_step(18, "POST /api/quiz/answer - Change answer and mark for review")
    try:
        if not test_data["participant_id"]:
            return print_result(False, "No participant_id available")
        if not test_data["question_id"]:
            return print_result(False, "No question_id available")
        
        payload = {
            "participant_id": test_data["participant_id"],
            "question_id": test_data["question_id"],
            "selected_index": 1,
            "marked": True
        }
        response = requests.post(f"{BASE_URL}/quiz/answer", json=payload, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        return print_result(True, "Answer updated and marked for review successfully")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_19():
    """POST /api/quiz/submit -> 200 returns result with all required fields"""
    print_step(19, "POST /api/quiz/submit - Submit quiz")
    try:
        if not test_data["participant_id"]:
            return print_result(False, "No participant_id available")
        
        payload = {
            "participant_id": test_data["participant_id"]
        }
        response = requests.post(f"{BASE_URL}/quiz/submit", json=payload, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        if "result" not in data:
            return print_result(False, "Missing 'result' in response", data)
        
        result = data["result"]
        required_fields = ["correct", "wrong", "total", "score", "percentage", "time_taken_seconds", "submission_time"]
        for field in required_fields:
            if field not in result:
                return print_result(False, f"Missing '{field}' in result", result)
        
        # Store result for later verification
        test_data["result"] = result
        
        return print_result(True, "Quiz submitted successfully", {
            "correct": result.get("correct"),
            "wrong": result.get("wrong"),
            "percentage": result.get("percentage"),
            "time_taken_seconds": result.get("time_taken_seconds")
        })
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_20():
    """POST /api/quiz/submit again -> should be idempotent, verify count is 1"""
    print_step(20, "POST /api/quiz/submit - Re-submit should be idempotent")
    try:
        if not test_data["participant_id"]:
            return print_result(False, "No participant_id available")
        
        payload = {
            "participant_id": test_data["participant_id"]
        }
        response = requests.post(f"{BASE_URL}/quiz/submit", json=payload, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        result = data.get("result", {})
        
        # Verify it's the same result
        if test_data["result"]:
            if result.get("id") != test_data["result"].get("id"):
                return print_result(False, "Re-submit created a new result instead of returning existing one")
        
        # Verify count via admin/results
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        response = requests.get(f"{BASE_URL}/admin/results", headers=headers, timeout=10)
        if response.status_code == 200:
            results_data = response.json()
            results = results_data.get("results", [])
            participant_results = [r for r in results if r.get("participant_id") == test_data["participant_id"]]
            if len(participant_results) != 1:
                return print_result(False, f"Expected 1 result for participant, found {len(participant_results)}")
        
        return print_result(True, "Re-submit is idempotent (returned same result)")
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_21():
    """GET /api/leaderboard -> returns array with rank field"""
    print_step(21, "GET /api/leaderboard - Retrieve leaderboard")
    try:
        response = requests.get(f"{BASE_URL}/leaderboard", timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        if "leaderboard" not in data:
            return print_result(False, "Missing 'leaderboard' in response", data)
        
        leaderboard = data["leaderboard"]
        if not leaderboard:
            return print_result(False, "Leaderboard is empty")
        
        # Verify rank field exists
        for entry in leaderboard:
            if "rank" not in entry:
                return print_result(False, "Missing 'rank' field in leaderboard entry", entry)
        
        # Find Alice's entry
        alice_entry = None
        for entry in leaderboard:
            if entry.get("participant_id") == test_data["participant_id"]:
                alice_entry = entry
                break
        
        if not alice_entry:
            return print_result(False, "Alice's result not found in leaderboard")
        
        return print_result(True, f"Leaderboard retrieved successfully ({len(leaderboard)} entries)", {
            "alice_rank": alice_entry.get("rank"),
            "alice_score": alice_entry.get("score")
        })
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_22():
    """GET /api/participants/:id -> returns participant + result"""
    print_step(22, "GET /api/participants/:id - Retrieve participant with result")
    try:
        if not test_data["participant_id"]:
            return print_result(False, "No participant_id available")
        
        response = requests.get(f"{BASE_URL}/participants/{test_data['participant_id']}", timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        data = response.json()
        if "participant" not in data:
            return print_result(False, "Missing 'participant' in response", data)
        
        if "result" not in data:
            return print_result(False, "Missing 'result' in response", data)
        
        participant = data["participant"]
        result = data["result"]
        
        if participant.get("id") != test_data["participant_id"]:
            return print_result(False, "Participant ID mismatch")
        
        if result and result.get("participant_id") != test_data["participant_id"]:
            return print_result(False, "Result participant_id mismatch")
        
        return print_result(True, "Participant with result retrieved successfully", {
            "name": participant.get("name"),
            "has_result": result is not None
        })
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_23():
    """POST /api/admin/quiz/end -> 200, quiz status='ended'"""
    print_step(23, "POST /api/admin/quiz/end - End quiz")
    try:
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        response = requests.post(f"{BASE_URL}/admin/quiz/end", headers=headers, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        # Verify quiz status changed to ended
        response = requests.get(f"{BASE_URL}/quiz", timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Failed to verify quiz status: {response.status_code}")
        
        data = response.json()
        quiz = data.get("quiz", {})
        if quiz.get("status") != "ended":
            return print_result(False, f"Expected status 'ended', got '{quiz.get('status')}'", data)
        
        return print_result(True, "Quiz ended successfully", {"status": quiz.get("status")})
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_24():
    """POST /api/admin/quiz/duration {duration_minutes: 5} -> 200; verify GET /api/quiz shows 5"""
    print_step(24, "POST /api/admin/quiz/duration - Update quiz duration")
    try:
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        payload = {"duration_minutes": 5}
        response = requests.post(f"{BASE_URL}/admin/quiz/duration", json=payload, headers=headers, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        # Verify duration changed
        response = requests.get(f"{BASE_URL}/quiz", timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Failed to verify quiz duration: {response.status_code}")
        
        data = response.json()
        quiz = data.get("quiz", {})
        if quiz.get("duration_minutes") != 5:
            return print_result(False, f"Expected duration_minutes 5, got {quiz.get('duration_minutes')}", data)
        
        return print_result(True, "Quiz duration updated successfully", {"duration_minutes": quiz.get("duration_minutes")})
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def test_step_25():
    """POST /api/admin/quiz/reset -> 200. Verify collections empty, status='idle', questions remain"""
    print_step(25, "POST /api/admin/quiz/reset - Reset quiz")
    try:
        headers = {"Authorization": f"Bearer {ADMIN_TOKEN}"}
        response = requests.post(f"{BASE_URL}/admin/quiz/reset", headers=headers, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Expected 200, got {response.status_code}", response.text)
        
        # Verify via admin/stats
        response = requests.get(f"{BASE_URL}/admin/stats", headers=headers, timeout=10)
        if response.status_code != 200:
            return print_result(False, f"Failed to verify stats: {response.status_code}")
        
        data = response.json()
        if data.get("participants") != 0:
            return print_result(False, f"Expected 0 participants after reset, got {data.get('participants')}")
        
        if data.get("submissions") != 0:
            return print_result(False, f"Expected 0 submissions after reset, got {data.get('submissions')}")
        
        # Verify questions still exist
        if data.get("questions") == 0:
            return print_result(False, "Questions should NOT be deleted after reset")
        
        # Verify quiz status is idle
        quiz = data.get("quiz", {})
        if quiz.get("status") != "idle":
            return print_result(False, f"Expected status 'idle' after reset, got '{quiz.get('status')}'")
        
        return print_result(True, "Quiz reset successfully", {
            "participants": data.get("participants"),
            "submissions": data.get("submissions"),
            "questions": data.get("questions"),
            "status": quiz.get("status")
        })
    except Exception as e:
        return print_result(False, f"Exception: {str(e)}")

def main():
    """Run all test steps"""
    print("\n" + "="*80)
    print("FRESHERS' QUIZ BACKEND API TEST SUITE")
    print(f"Base URL: {BASE_URL}")
    print("="*80)
    
    results = []
    
    # Run all 25 test steps
    test_functions = [
        test_step_1, test_step_2, test_step_3, test_step_4, test_step_5,
        test_step_6, test_step_7, test_step_8, test_step_9, test_step_10,
        test_step_11, test_step_12, test_step_13, test_step_14, test_step_15,
        test_step_16, test_step_17, test_step_18, test_step_19, test_step_20,
        test_step_21, test_step_22, test_step_23, test_step_24, test_step_25
    ]
    
    for test_func in test_functions:
        try:
            result = test_func()
            results.append(result)
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR in {test_func.__name__}: {str(e)}")
            results.append(False)
    
    # Summary
    print("\n" + "="*80)
    print("TEST SUMMARY")
    print("="*80)
    passed = sum(results)
    total = len(results)
    print(f"Passed: {passed}/{total}")
    print(f"Failed: {total - passed}/{total}")
    
    if passed == total:
        print("\n✅ ALL TESTS PASSED!")
        return 0
    else:
        print(f"\n❌ {total - passed} TEST(S) FAILED")
        return 1

if __name__ == "__main__":
    sys.exit(main())
