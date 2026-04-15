"""
Seeder: creates Subject → Topic → Subtopic hierarchy and seeds questions.
Run via POST /interview/seed-questions endpoint.
"""

from sqlalchemy.orm import Session

from models.subject import Subject
from models.topic import Topic
from models.subtopic import Subtopic
from models.question import Question
from models.interview_session import InterviewSession
from models.user import User
from models.answer import Answer

from data.question_bank import QUESTION_BANK


# ── Full hierarchy definition ────────────────────────────────────────────────

SUBJECTS_HIERARCHY = {
    "DSA": {
        "Arrays":              ["Basics", "Prefix Sum", "Kadane", "Two Pointers", "Rotation", "Dutch Flag", "Matrix", "Intervals", "Cyclic Sort", "Binary Search", "Expert"],
        "Strings":             ["Basics", "Palindrome", "Anagram", "Sliding Window", "Pattern Matching", "Compression", "Rotation", "Advanced", "Expert"],
        "Linked List":         ["Basics", "Reversal", "Cycle Detection", "Merge", "Fast Slow", "Advanced", "LRU"],
        "Stacks":              ["Basics", "Parentheses", "Monotonic", "Histogram", "Design"],
        "Queues":              ["Basics", "Sliding Window", "Design"],
        "Hashing":             ["Basics", "Frequency", "Subarray", "Advanced"],
        "Recursion":           ["Basics", "Divide and Conquer", "Advanced"],
        "Binary Search":       ["Basics", "Bounds", "Search on Answer", "Peak"],
        "Sorting":             ["Basic Sorts", "Efficient Sorts", "Non-Comparison"],
        "Two Pointers":        ["Basics", "Intermediate"],
        "Sliding Window":      ["Fixed", "Variable"],
        "Backtracking":        ["Basics", "Permutations", "Subsets", "N-Queens"],
        "Trees":               ["Basics", "Traversal", "LCA", "Diameter", "Advanced"],
        "BST":                 ["Basics", "Validation", "Kth Smallest"],
        "Heaps":               ["Basics", "Top K", "Median"],
        "Graphs":              ["Basics", "BFS", "DFS", "Cycle Detection", "Topological Sort", "Shortest Path", "MST"],
        "Greedy":              ["Basics", "Activity Selection", "Advanced"],
        "Dynamic Programming": ["Basics", "1D DP", "Knapsack", "LIS", "LCS", "Expert"],
        "Tries":               ["Basics", "Autocomplete"],
        "Union Find":          ["Basics"],
    },
    "OOPS": {
        "Pillars of OOP":      ["Encapsulation", "Abstraction", "Inheritance", "Polymorphism"],
        "Design Principles":   ["SOLID"],
        "Design Patterns":     ["Singleton", "Factory", "Observer"],
    },
    "System Design": {
        "Scalability":         ["Basics"],
        "Caching":             ["Basics"],
        "URL Shortener":       ["Design"],
        "Rate Limiter":        ["Design"],
        "Distributed Systems": ["Expert"],
    },
    "DBMS": {
        "Fundamentals":        ["Basics"],
        "Transactions":        ["ACID"],
        "Normalization":       ["Normal Forms"],
        "SQL":                 ["Basics", "Joins"],
        "Indexing":            ["B-Tree"],
        "Concurrency":        ["Deadlocks"],
        "Distributed DB":      ["CAP Theorem"],
    },
    "OS & Networking": {
        "OS Basics":           ["Process vs Thread"],
        "Scheduling":          ["CPU Scheduling"],
        "Memory Management":   ["Paging"],
        "Deadlock":            ["Conditions"],
        "Networking":          ["URL Flow", "TCP vs UDP", "REST"],
    },
    "Machine Learning": {
        "Fundamentals":        ["Supervised vs Unsupervised"],
        "Regularization":      ["Overfitting"],
        "Evaluation":          ["Metrics"],
        "Algorithms":          ["Linear Regression"],
        "Neural Networks":     ["Backpropagation", "CNN", "Transformers"],
        "LLMs":                ["Fine-tuning"],
    },
    "Behavioral": {
        "Introduction":        ["Self Introduction"],
        "Strengths":           ["Self Assessment"],
        "Challenges":          ["STAR Method"],
        "Teamwork":            ["Conflict Resolution"],
        "Goals":               ["Career Planning"],
        "Failure":             ["Growth Mindset"],
    },
}


# ── Mapping from old flat topic+subtopic → (subject, topic, subtopic) ────────

OLD_TO_NEW = {
    # DSA topics
    ("arrays", "basics"):          ("DSA", "Arrays", "Basics"),
    ("arrays", "prefix_sum"):      ("DSA", "Arrays", "Prefix Sum"),
    ("arrays", "kadane"):          ("DSA", "Arrays", "Kadane"),
    ("arrays", "two_pointers"):    ("DSA", "Arrays", "Two Pointers"),
    ("arrays", "rotation"):        ("DSA", "Arrays", "Rotation"),
    ("arrays", "dutch_flag"):      ("DSA", "Arrays", "Dutch Flag"),
    ("arrays", "matrix"):          ("DSA", "Arrays", "Matrix"),
    ("arrays", "intervals"):       ("DSA", "Arrays", "Intervals"),
    ("arrays", "cyclic_sort"):     ("DSA", "Arrays", "Cyclic Sort"),
    ("arrays", "binary_search"):   ("DSA", "Arrays", "Binary Search"),
    ("arrays", "expert"):          ("DSA", "Arrays", "Expert"),
    ("strings", "basics"):         ("DSA", "Strings", "Basics"),
    ("strings", "palindrome"):     ("DSA", "Strings", "Palindrome"),
    ("strings", "anagram"):        ("DSA", "Strings", "Anagram"),
    ("strings", "sliding_window"): ("DSA", "Strings", "Sliding Window"),
    ("strings", "pattern_matching"):("DSA", "Strings", "Pattern Matching"),
    ("strings", "compression"):    ("DSA", "Strings", "Compression"),
    ("strings", "rotation"):       ("DSA", "Strings", "Rotation"),
    ("strings", "advanced"):       ("DSA", "Strings", "Advanced"),
    ("strings", "expert"):         ("DSA", "Strings", "Expert"),
    ("linked_list", "basics"):     ("DSA", "Linked List", "Basics"),
    ("linked_list", "reversal"):   ("DSA", "Linked List", "Reversal"),
    ("linked_list", "cycle"):      ("DSA", "Linked List", "Cycle Detection"),
    ("linked_list", "merge"):      ("DSA", "Linked List", "Merge"),
    ("linked_list", "fast_slow"):  ("DSA", "Linked List", "Fast Slow"),
    ("linked_list", "advanced"):   ("DSA", "Linked List", "Advanced"),
    ("linked_list", "lru"):        ("DSA", "Linked List", "LRU"),
    ("stacks", "basics"):          ("DSA", "Stacks", "Basics"),
    ("stacks", "parentheses"):     ("DSA", "Stacks", "Parentheses"),
    ("stacks", "monotonic"):       ("DSA", "Stacks", "Monotonic"),
    ("stacks", "histogram"):       ("DSA", "Stacks", "Histogram"),
    ("stacks", "design"):          ("DSA", "Stacks", "Design"),
    ("queues", "basics"):          ("DSA", "Queues", "Basics"),
    ("queues", "sliding_window"):  ("DSA", "Queues", "Sliding Window"),
    ("queues", "design"):          ("DSA", "Queues", "Design"),
    ("hashing", "basics"):         ("DSA", "Hashing", "Basics"),
    ("hashing", "frequency"):      ("DSA", "Hashing", "Frequency"),
    ("hashing", "subarray"):       ("DSA", "Hashing", "Subarray"),
    ("hashing", "advanced"):       ("DSA", "Hashing", "Advanced"),
    ("recursion", "basics"):       ("DSA", "Recursion", "Basics"),
    ("recursion", "divide_conquer"):("DSA", "Recursion", "Divide and Conquer"),
    ("recursion", "advanced"):     ("DSA", "Recursion", "Advanced"),
    ("binary_search", "basics"):   ("DSA", "Binary Search", "Basics"),
    ("binary_search", "bounds"):   ("DSA", "Binary Search", "Bounds"),
    ("binary_search", "search_on_answer"):("DSA", "Binary Search", "Search on Answer"),
    ("binary_search", "peak"):     ("DSA", "Binary Search", "Peak"),
    ("sorting", "basic_sorts"):    ("DSA", "Sorting", "Basic Sorts"),
    ("sorting", "efficient_sorts"):("DSA", "Sorting", "Efficient Sorts"),
    ("sorting", "non_comparison"): ("DSA", "Sorting", "Non-Comparison"),
    ("two_pointers", "basics"):    ("DSA", "Two Pointers", "Basics"),
    ("two_pointers", "intermediate"):("DSA", "Two Pointers", "Intermediate"),
    ("sliding_window", "fixed"):   ("DSA", "Sliding Window", "Fixed"),
    ("sliding_window", "variable"):("DSA", "Sliding Window", "Variable"),
    ("backtracking", "basics"):    ("DSA", "Backtracking", "Basics"),
    ("backtracking", "permutations"):("DSA", "Backtracking", "Permutations"),
    ("backtracking", "subsets"):   ("DSA", "Backtracking", "Subsets"),
    ("backtracking", "n_queens"):  ("DSA", "Backtracking", "N-Queens"),
    ("trees", "basics"):           ("DSA", "Trees", "Basics"),
    ("trees", "traversal"):        ("DSA", "Trees", "Traversal"),
    ("trees", "lca"):              ("DSA", "Trees", "LCA"),
    ("trees", "diameter"):         ("DSA", "Trees", "Diameter"),
    ("trees", "advanced"):         ("DSA", "Trees", "Advanced"),
    ("bst", "basics"):             ("DSA", "BST", "Basics"),
    ("bst", "validation"):         ("DSA", "BST", "Validation"),
    ("bst", "kth_smallest"):       ("DSA", "BST", "Kth Smallest"),
    ("heaps", "basics"):           ("DSA", "Heaps", "Basics"),
    ("heaps", "top_k"):            ("DSA", "Heaps", "Top K"),
    ("heaps", "median"):           ("DSA", "Heaps", "Median"),
    ("graphs", "basics"):          ("DSA", "Graphs", "Basics"),
    ("graphs", "bfs"):             ("DSA", "Graphs", "BFS"),
    ("graphs", "dfs"):             ("DSA", "Graphs", "DFS"),
    ("graphs", "cycle"):           ("DSA", "Graphs", "Cycle Detection"),
    ("graphs", "topological"):     ("DSA", "Graphs", "Topological Sort"),
    ("graphs", "shortest_path"):   ("DSA", "Graphs", "Shortest Path"),
    ("graphs", "mst"):             ("DSA", "Graphs", "MST"),
    ("greedy", "basics"):          ("DSA", "Greedy", "Basics"),
    ("greedy", "activity_selection"):("DSA", "Greedy", "Activity Selection"),
    ("greedy", "advanced"):        ("DSA", "Greedy", "Advanced"),
    ("dynamic_programming", "basics"):("DSA", "Dynamic Programming", "Basics"),
    ("dynamic_programming", "1d_dp"):("DSA", "Dynamic Programming", "1D DP"),
    ("dynamic_programming", "knapsack"):("DSA", "Dynamic Programming", "Knapsack"),
    ("dynamic_programming", "lis"):("DSA", "Dynamic Programming", "LIS"),
    ("dynamic_programming", "lcs"):("DSA", "Dynamic Programming", "LCS"),
    ("dynamic_programming", "expert"):("DSA", "Dynamic Programming", "Expert"),
    ("tries", "basics"):           ("DSA", "Tries", "Basics"),
    ("tries", "autocomplete"):     ("DSA", "Tries", "Autocomplete"),
    ("union_find", "basics"):      ("DSA", "Union Find", "Basics"),
    # OOPS
    ("oops", "pillars"):           ("OOPS", "Pillars of OOP", "Encapsulation"),
    ("oops", "inheritance"):       ("OOPS", "Pillars of OOP", "Inheritance"),
    ("oops", "abstraction"):       ("OOPS", "Pillars of OOP", "Abstraction"),
    ("oops", "solid"):             ("OOPS", "Design Principles", "SOLID"),
    ("oops", "patterns"):          ("OOPS", "Design Patterns", "Singleton"),
    # System Design
    ("system_design", "basics"):   ("System Design", "Scalability", "Basics"),
    ("system_design", "caching"):  ("System Design", "Caching", "Basics"),
    ("system_design", "url_shortener"):("System Design", "URL Shortener", "Design"),
    ("system_design", "rate_limiter"):("System Design", "Rate Limiter", "Design"),
    ("system_design", "expert"):   ("System Design", "Distributed Systems", "Expert"),
    # DBMS
    ("dbms", "basics"):            ("DBMS", "Fundamentals", "Basics"),
    ("dbms", "acid"):              ("DBMS", "Transactions", "ACID"),
    ("dbms", "normalization"):     ("DBMS", "Normalization", "Normal Forms"),
    ("dbms", "sql"):               ("DBMS", "SQL", "Basics"),
    ("dbms", "indexing"):          ("DBMS", "Indexing", "B-Tree"),
    ("dbms", "advanced"):          ("DBMS", "Concurrency", "Deadlocks"),
    ("dbms", "expert"):            ("DBMS", "Distributed DB", "CAP Theorem"),
    # OS & Networking
    ("os_cn", "os_basics"):        ("OS & Networking", "OS Basics", "Process vs Thread"),
    ("os_cn", "scheduling"):       ("OS & Networking", "Scheduling", "CPU Scheduling"),
    ("os_cn", "memory"):           ("OS & Networking", "Memory Management", "Paging"),
    ("os_cn", "deadlock"):         ("OS & Networking", "Deadlock", "Conditions"),
    ("os_cn", "networking"):       ("OS & Networking", "Networking", "URL Flow"),
    ("os_cn", "advanced"):         ("OS & Networking", "Networking", "REST"),
    # ML
    ("ml_ai", "basics"):           ("Machine Learning", "Fundamentals", "Supervised vs Unsupervised"),
    ("ml_ai", "overfitting"):      ("Machine Learning", "Regularization", "Overfitting"),
    ("ml_ai", "metrics"):          ("Machine Learning", "Evaluation", "Metrics"),
    ("ml_ai", "algorithms"):       ("Machine Learning", "Algorithms", "Linear Regression"),
    ("ml_ai", "neural_networks"):  ("Machine Learning", "Neural Networks", "Backpropagation"),
    ("ml_ai", "advanced"):         ("Machine Learning", "Neural Networks", "Transformers"),
    ("ml_ai", "expert"):           ("Machine Learning", "LLMs", "Fine-tuning"),
    # Behavioral
    ("behavioral", "introduction"):("Behavioral", "Introduction", "Self Introduction"),
    ("behavioral", "strengths"):   ("Behavioral", "Strengths", "Self Assessment"),
    ("behavioral", "challenges"):  ("Behavioral", "Challenges", "STAR Method"),
    ("behavioral", "teamwork"):    ("Behavioral", "Teamwork", "Conflict Resolution"),
    ("behavioral", "goals"):       ("Behavioral", "Goals", "Career Planning"),
    ("behavioral", "failure"):     ("Behavioral", "Failure", "Growth Mindset"),
}


def seed_all(db: Session) -> dict:
    """
    Seed the entire hierarchy: Subjects → Topics → Subtopics → Questions.
    Clears all existing data first.
    """

    # ── 1. Clear existing data (respect FK order) ────────────────────────
    db.query(Answer).delete()
    db.query(Question).delete()
    db.query(Subtopic).delete()
    db.query(Topic).delete()
    db.query(Subject).delete()
    db.commit()

    # ── 2. Create hierarchy ──────────────────────────────────────────────
    subject_cache = {}   # name → Subject obj
    topic_cache = {}     # (subject_name, topic_name) → Topic obj
    subtopic_cache = {}  # (subject_name, topic_name, subtopic_name) → Subtopic obj

    for subject_name, topics in SUBJECTS_HIERARCHY.items():
        subj = Subject(name=subject_name, type="hr" if subject_name == "Behavioral" else "technical")
        db.add(subj)
        db.flush()
        subject_cache[subject_name] = subj

        for topic_name, subtopics in topics.items():
            top = Topic(name=topic_name, subject_id=subj.id)
            db.add(top)
            db.flush()
            topic_cache[(subject_name, topic_name)] = top

            for subtopic_name in subtopics:
                sub = Subtopic(name=subtopic_name, topic_id=top.id)
                db.add(sub)
                db.flush()
                subtopic_cache[(subject_name, topic_name, subtopic_name)] = sub

    db.commit()

    # ── 3. Seed questions ────────────────────────────────────────────────
    count = 0
    skipped = 0

    for q in QUESTION_BANK:
        old_topic = q.get("topic", "")
        old_subtopic = q.get("subtopic", "general")
        key = (old_topic, old_subtopic)

        mapping = OLD_TO_NEW.get(key)
        if not mapping:
            skipped += 1
            continue

        subj_name, topic_name, subtopic_name = mapping
        subj = subject_cache.get(subj_name)
        top = topic_cache.get((subj_name, topic_name))
        sub = subtopic_cache.get((subj_name, topic_name, subtopic_name))

        if not all([subj, top, sub]):
            skipped += 1
            continue

        question = Question(
            subject_id=subj.id,
            topic_id=top.id,
            subtopic_id=sub.id,
            title=q["question_text"][:80],
            difficulty=q["difficulty"],
            type=q["type"],
            question_text=q["question_text"],
            ideal_answer=q["ideal_answer"],
            tags=q.get("tags", ""),
            companies=q.get("companies", ""),
            time_complexity=q.get("time_complexity", "N/A"),
            space_complexity=q.get("space_complexity", "N/A"),
        )
        db.add(question)
        count += 1

    db.commit()

    return {
        "message": f"Seeded {len(subject_cache)} subjects, "
                   f"{len(topic_cache)} topics, "
                   f"{len(subtopic_cache)} subtopics, "
                   f"{count} questions. "
                   f"({skipped} questions skipped — no mapping found)."
    }
