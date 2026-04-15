from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import re

model = SentenceTransformer('all-MiniLM-L6-v2')

# ─────────────────────────────────────────────
# STOP WORDS — filter non-technical filler
# ─────────────────────────────────────────────
STOP_WORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "shall", "can", "need", "dare", "ought",
    "used", "to", "of", "in", "on", "at", "by", "for", "with", "about",
    "against", "between", "into", "through", "during", "before", "after",
    "above", "below", "from", "up", "down", "out", "off", "over", "under",
    "again", "further", "then", "once", "here", "there", "when", "where",
    "why", "how", "all", "both", "each", "few", "more", "most", "other",
    "some", "such", "no", "not", "only", "same", "so", "than", "too",
    "very", "just", "because", "as", "until", "while", "and", "but", "or",
    "nor", "so", "yet", "although", "though", "even", "if", "unless",
    "since", "also", "this", "that", "these", "those", "it", "its",
    "which", "who", "whom", "what", "i", "we", "you", "he", "she", "they",
    "me", "us", "him", "her", "them", "my", "our", "your", "his", "their",
    "mine", "ours", "yours", "hers", "theirs", "else", "case", "count",
    "index", "value", "using", "uses", "use", "used", "make", "makes",
    "allow", "allows", "provide", "provides", "helps", "help", "gives",
    "give", "takes", "take", "called", "known", "means", "mean",
    "refer", "refers", "basically", "generally", "usually", "often",
    "always", "never", "sometimes", "example", "examples", "like", "such",
    "way", "ways", "type", "types", "kind", "kinds", "different", "various",
    "any", "every", "either", "neither", "one", "two", "three", "many",
    "much", "number", "numbers", "works", "work", "common",
    "main", "key", "important", "basic", "simple", "complex", "good",
    "best", "better", "new", "first", "last", "next", "previous"
}

# ─────────────────────────────────────────────
# FULL CONCEPT MAP
# core      → must-know terms (heavily weighted)
# ops       → operations / methods
# props     → properties / characteristics
# uses      → real-world use cases
# synonyms  → alternate names for topic detection
# ─────────────────────────────────────────────
CONCEPT_MAP = {

    # ══════════════════════════════════════════
    # DATA STRUCTURES
    # ══════════════════════════════════════════

    "array": {
        "core": ["index", "element", "contiguous", "memory", "random access", "fixed size", "zero indexed"],
        "ops": ["traverse", "insert", "delete", "search", "update", "sort", "resize"],
        "props": ["O(1) access", "O(n) insert", "cache friendly", "static", "dynamic"],
        "uses": ["matrix", "image processing", "buffer", "lookup table", "prefix sum"],
        "synonyms": ["arrays", "list", "static array", "dynamic array"]
    },

    "linked list": {
        "core": ["node", "pointer", "next", "head", "tail", "null", "dynamic memory"],
        "ops": ["insert", "delete", "traverse", "reverse", "search", "merge"],
        "props": ["O(1) insert at head", "O(n) search", "no random access", "dynamic size"],
        "uses": ["stack implementation", "queue implementation", "undo feature", "browser history", "adjacency list"],
        "synonyms": ["linked list", "singly linked", "doubly linked", "circular linked"]
    },

    "doubly linked list": {
        "core": ["prev pointer", "next pointer", "bidirectional", "node", "head", "tail"],
        "ops": ["insert before", "insert after", "delete", "traverse forward", "traverse backward"],
        "props": ["O(1) delete with reference", "more memory", "two pointers per node"],
        "uses": ["LRU cache", "browser navigation", "music playlist", "undo redo"],
        "synonyms": ["doubly linked", "double linked", "doubly linked list"]
    },

    "stack": {
        "core": ["LIFO", "push", "pop", "top", "overflow", "underflow"],
        "ops": ["push", "pop", "peek", "isEmpty", "isFull"],
        "props": ["last in first out", "O(1) push pop", "linear structure"],
        "uses": ["function call", "recursion", "undo", "expression evaluation", "backtracking", "DFS"],
        "synonyms": ["stacks", "LIFO structure", "call stack"]
    },

    "queue": {
        "core": ["FIFO", "enqueue", "dequeue", "front", "rear", "circular queue"],
        "ops": ["enqueue", "dequeue", "peek", "isEmpty", "isFull"],
        "props": ["first in first out", "O(1) enqueue dequeue", "linear structure"],
        "uses": ["BFS", "scheduling", "print queue", "message queue", "level order traversal", "producer consumer"],
        "synonyms": ["queues", "FIFO structure", "circular queue", "deque", "priority queue"]
    },

    "deque": {
        "core": ["double ended queue", "front", "rear", "insert both ends", "delete both ends"],
        "ops": ["push_front", "push_back", "pop_front", "pop_back", "peek"],
        "props": ["O(1) at both ends", "flexible", "more versatile than queue"],
        "uses": ["sliding window", "palindrome check", "scheduling", "undo redo"],
        "synonyms": ["deque", "double ended queue", "deck"]
    },

    "heap": {
        "core": ["complete binary tree", "max heap", "min heap", "heapify", "parent", "child", "array representation"],
        "ops": ["insert", "extract max", "extract min", "heapify", "build heap", "decrease key"],
        "props": ["O(log n) insert", "O(log n) delete", "O(1) peek", "stored as array"],
        "uses": ["priority queue", "heap sort", "Dijkstra", "Prim", "top K elements", "median finding"],
        "synonyms": ["heaps", "max heap", "min heap", "binary heap", "priority queue"]
    },

    "hash table": {
        "core": ["hash function", "bucket", "collision", "chaining", "open addressing", "load factor", "key value"],
        "ops": ["insert", "search", "delete", "rehash"],
        "props": ["O(1) average", "O(n) worst case", "unordered", "key value pairs"],
        "uses": ["dictionary", "caching", "frequency count", "anagram detection", "database indexing"],
        "synonyms": ["hash map", "hash", "dictionary", "hashmap", "hashtable", "hash table"]
    },

    "binary search tree": {
        "core": ["BST property", "left subtree smaller", "right subtree larger", "inorder", "root", "node"],
        "ops": ["insert", "search", "delete", "inorder traversal", "find min", "find max"],
        "props": ["O(log n) average", "O(n) worst case skewed", "ordered", "recursive structure"],
        "uses": ["sorted data", "range queries", "symbol table", "autocomplete"],
        "synonyms": ["BST", "binary search tree", "ordered tree"]
    },

    "binary tree": {
        "core": ["root", "node", "leaf", "parent", "child", "height", "depth", "level", "two children max"],
        "ops": ["inorder", "preorder", "postorder", "BFS", "DFS", "insert", "search"],
        "props": ["at most two children", "recursive structure", "balanced vs unbalanced"],
        "uses": ["expression tree", "file system", "XML parsing", "Huffman coding", "decision tree"],
        "synonyms": ["binary tree", "tree", "BT", "tree structure"]
    },

    "avl tree": {
        "core": ["balance factor", "left rotation", "right rotation", "height balanced", "self balancing"],
        "ops": ["insert", "delete", "rotate left", "rotate right", "rebalance"],
        "props": ["O(log n) guaranteed", "balance factor -1 0 or 1", "self balancing BST"],
        "uses": ["database indexing", "ordered set", "map implementation"],
        "synonyms": ["AVL", "avl tree", "balanced BST", "self balancing tree"]
    },

    "trie": {
        "core": ["prefix tree", "node", "character", "end of word", "root", "children array"],
        "ops": ["insert", "search", "prefix search", "delete", "autocomplete"],
        "props": ["O(L) operations where L is word length", "space intensive", "prefix based"],
        "uses": ["autocomplete", "spell checker", "IP routing", "word search", "dictionary lookup"],
        "synonyms": ["trie", "prefix tree", "digital tree", "radix tree"]
    },

    "graph": {
        "core": ["vertex", "edge", "directed", "undirected", "weighted", "adjacency list", "adjacency matrix", "cycle"],
        "ops": ["BFS", "DFS", "add vertex", "add edge", "shortest path", "topological sort"],
        "props": ["cyclic or acyclic", "connected or disconnected", "sparse or dense"],
        "uses": ["maps", "social network", "web crawling", "dependency resolution", "network routing"],
        "synonyms": ["graphs", "directed graph", "undirected graph", "DAG", "weighted graph"]
    },

    "union find": {
        "core": ["disjoint set", "union", "find", "path compression", "union by rank", "representative"],
        "ops": ["make set", "union", "find", "check connected"],
        "props": ["near O(1) amortized", "detects cycle", "tracks connected components"],
        "uses": ["Kruskal MST", "cycle detection", "connected components", "social network grouping"],
        "synonyms": ["union find", "disjoint set", "DSU", "disjoint set union"]
    },

    # ══════════════════════════════════════════
    # ALGORITHMS
    # ══════════════════════════════════════════

    "binary search": {
        "core": ["sorted array", "mid", "left", "right", "divide", "O(log n)", "search space reduction"],
        "ops": ["compare with mid", "move left pointer", "move right pointer", "return index"],
        "props": ["requires sorted input", "O(log n) time", "O(1) space iterative", "O(log n) space recursive"],
        "uses": ["sorted array lookup", "first last occurrence", "peak element", "rotated array search", "answer binary search"],
        "synonyms": ["binary search", "bisect", "logarithmic search", "half interval search"]
    },

    "sorting": {
        "core": ["comparison", "swap", "pivot", "merge", "in-place", "stable", "unstable", "divide"],
        "ops": ["bubble sort", "merge sort", "quick sort", "heap sort", "insertion sort", "counting sort", "radix sort"],
        "props": ["O(n log n) efficient algorithms", "O(n²) naive", "stable preserves relative order", "in-place vs extra space"],
        "uses": ["ordering data", "binary search prep", "top K elements", "ranking", "median finding"],
        "synonyms": ["sort", "sorting algorithms", "merge sort", "quick sort", "heap sort", "bubble sort"]
    },

    "prefix sum": {
        "core": ["prefix array", "cumulative sum", "range query", "preprocessing", "running total"],
        "ops": ["build prefix array", "range sum query", "difference array", "2D prefix sum"],
        "props": ["O(n) build", "O(1) range query", "trade space for time", "immutable array assumption"],
        "uses": ["range sum queries", "subarray sum equals K", "product except self", "count subarrays", "image blurring"],
        "synonyms": ["prefix sum", "cumulative sum", "running sum", "partial sums", "scan"]
    },

    "kadane": {
        "core": ["maximum subarray", "local maximum", "global maximum", "running sum", "reset to zero"],
        "ops": ["track current sum", "reset if negative", "update global max", "handle all negative"],
        "props": ["O(n) time", "O(1) space", "single pass", "dynamic programming variant"],
        "uses": ["maximum subarray sum", "maximum product subarray", "circular array max sum", "stock profit"],
        "synonyms": ["kadane", "kadane algorithm", "maximum subarray", "maximum contiguous sum"]
    },

    "dutch flag": {
        "core": ["three way partition", "low pointer", "mid pointer", "high pointer", "three colors"],
        "ops": ["swap low mid", "advance mid", "swap mid high", "decrement high"],
        "props": ["O(n) time", "O(1) space", "in-place", "single pass", "three partitions"],
        "uses": ["sort 0s 1s 2s", "partition around pivot", "segregate even odd", "quicksort pivot"],
        "synonyms": ["dutch national flag", "three way partition", "dijkstra partition", "3-way partition"]
    },

    "cyclic sort": {
        "core": ["place at correct index", "swap to position", "range 1 to n", "missing numbers", "duplicates"],
        "ops": ["check correct position", "swap to num-1 index", "advance if correct", "scan for missing"],
        "props": ["O(n) time", "O(1) space", "works for range 1 to n", "in-place"],
        "uses": ["find missing number", "find duplicate", "find all missing", "first missing positive"],
        "synonyms": ["cyclic sort", "index sort", "placement sort"]
    },

    "lru cache": {
        "core": ["least recently used", "hashmap", "doubly linked list", "capacity", "eviction", "O(1) operations"],
        "ops": ["get", "put", "move to front", "evict tail", "update existing"],
        "props": ["O(1) get and put", "capacity bounded", "doubly linked list for order", "hashmap for lookup"],
        "uses": ["browser cache", "database query cache", "OS page replacement", "CDN cache", "session cache"],
        "synonyms": ["LRU", "LRU cache", "least recently used cache", "cache eviction", "LFU cache"]
    },

    "recursion": {
        "core": ["base case", "recursive call", "call stack", "self similar subproblem", "stack frame"],
        "ops": ["define base case", "break into smaller problem", "combine results", "memoize"],
        "props": ["O(n) stack space", "elegant code", "stack overflow risk", "tail recursion optimization"],
        "uses": ["tree traversal", "DFS", "backtracking", "divide and conquer", "factorial", "fibonacci", "tower of Hanoi"],
        "synonyms": ["recursive", "recursion", "recursive function", "self referential"]
    },

    "dynamic programming": {
        "core": ["optimal substructure", "overlapping subproblems", "memoization", "tabulation", "state", "transition", "DP table"],
        "ops": ["define state", "write recurrence", "fill DP table", "top down memoization", "bottom up tabulation"],
        "props": ["avoids recomputation", "polynomial time from exponential", "space time tradeoff"],
        "uses": ["fibonacci", "knapsack", "LCS", "LIS", "matrix chain", "coin change", "edit distance", "shortest path"],
        "synonyms": ["DP", "dynamic programming", "memoization", "tabulation", "optimal substructure"]
    },

    "backtracking": {
        "core": ["explore choices", "prune invalid", "undo choice", "state space tree", "constraint check"],
        "ops": ["choose", "explore", "unchoose", "check constraint", "prune"],
        "props": ["exponential worst case", "smarter than brute force", "DFS based", "implicit tree"],
        "uses": ["N-queens", "sudoku solver", "permutations", "combinations", "word search", "subset sum"],
        "synonyms": ["backtracking", "constraint satisfaction", "pruning"]
    },

    "greedy": {
        "core": ["local optimum", "global optimum", "greedy choice property", "feasibility", "no backtracking"],
        "ops": ["sort input", "select best locally", "add to solution", "verify feasibility"],
        "props": ["O(n log n) typical", "not always globally optimal", "simple and fast"],
        "uses": ["activity selection", "Huffman coding", "Dijkstra", "Prim", "fractional knapsack", "coin change"],
        "synonyms": ["greedy algorithm", "greedy approach", "greedy method"]
    },

    "two pointers": {
        "core": ["left pointer", "right pointer", "converge toward center", "sorted input", "O(n)"],
        "ops": ["initialize two pointers", "move left right based on condition", "check target"],
        "props": ["O(n) time", "O(1) space", "requires sorted or specific structure"],
        "uses": ["two sum sorted", "container with most water", "palindrome check", "remove duplicates", "triplet sum"],
        "synonyms": ["two pointer", "two pointers technique", "opposite pointers"]
    },

    "sliding window": {
        "core": ["window", "expand right", "shrink left", "subarray", "substring", "maximum minimum"],
        "ops": ["add element to window", "remove element from window", "update result", "slide window"],
        "props": ["O(n) time", "O(1) to O(k) space", "contiguous subarray or substring"],
        "uses": ["max sum subarray", "longest substring no repeat", "minimum window substring", "find anagram"],
        "synonyms": ["sliding window", "window technique", "variable window"]
    },

    "divide and conquer": {
        "core": ["divide problem", "solve subproblems recursively", "combine results", "recurrence", "Master theorem"],
        "ops": ["split input", "solve each half", "merge results"],
        "props": ["O(n log n) typical", "parallelizable", "overhead from merging"],
        "uses": ["merge sort", "quick sort", "binary search", "Strassen matrix", "closest pair of points"],
        "synonyms": ["divide and conquer", "divide conquer combine"]
    },

    "BFS": {
        "core": ["queue", "visited array", "level order", "shortest path unweighted", "neighbor exploration"],
        "ops": ["enqueue source", "dequeue node", "mark visited", "enqueue unvisited neighbors"],
        "props": ["O(V+E) time", "O(V) space", "finds shortest path in unweighted graph"],
        "uses": ["shortest path", "level order tree traversal", "bipartite check", "connected components", "word ladder"],
        "synonyms": ["breadth first search", "BFS", "level order traversal", "level BFS"]
    },

    "DFS": {
        "core": ["stack", "visited array", "backtrack", "depth first", "recursive"],
        "ops": ["push/recurse into node", "mark visited", "explore each neighbor", "backtrack on dead end"],
        "props": ["O(V+E) time", "O(V) space", "can use recursion or explicit stack"],
        "uses": ["cycle detection", "topological sort", "path finding", "maze solving", "connected components"],
        "synonyms": ["depth first search", "DFS", "depth first traversal"]
    },

    "dijkstra": {
        "core": ["shortest path", "priority queue", "edge relaxation", "non-negative weights", "distance array"],
        "ops": ["initialize distances to infinity", "enqueue source", "relax edges", "extract minimum node"],
        "props": ["O((V+E) log V)", "no negative edge weights", "greedy approach"],
        "uses": ["GPS navigation", "network routing", "maps", "game pathfinding", "flight booking"],
        "synonyms": ["dijkstra", "dijkstra algorithm", "shortest path weighted graph"]
    },

    "topological sort": {
        "core": ["DAG", "in-degree", "linear ordering", "Kahn algorithm", "DFS finish time"],
        "ops": ["compute in-degree", "enqueue zero in-degree nodes", "reduce in-degree of neighbors", "append to result"],
        "props": ["O(V+E)", "only valid for DAG", "multiple valid orderings"],
        "uses": ["task scheduling", "build systems", "course prerequisites", "package dependency resolution"],
        "synonyms": ["topological sort", "topological ordering", "topological order"]
    },

    # ══════════════════════════════════════════
    # OOP
    # ══════════════════════════════════════════

    "oop": {
        "core": ["class", "object", "encapsulation", "inheritance", "polymorphism", "abstraction", "instance"],
        "ops": ["define class", "create object", "inherit", "override method", "overload method"],
        "props": ["modular", "reusable", "maintainable", "models real world entities"],
        "uses": ["large software systems", "frameworks", "game development", "UI design"],
        "synonyms": ["object oriented", "OOP", "object oriented programming", "object oriented design"]
    },

    "encapsulation": {
        "core": ["data hiding", "access modifier", "private", "public", "protected", "getter", "setter", "bundling"],
        "ops": ["make fields private", "provide getters setters", "restrict direct access"],
        "props": ["hides internal state", "controlled access", "reduces coupling", "improves security"],
        "uses": ["API design", "security", "data validation", "clean interfaces", "banking systems"],
        "synonyms": ["encapsulation", "data hiding", "information hiding", "access control"]
    },

    "inheritance": {
        "core": ["parent class", "child class", "extends", "super keyword", "base class", "derived class", "IS-A relationship"],
        "ops": ["extend class", "call super constructor", "override method", "add new methods"],
        "props": ["code reuse", "hierarchical relationship", "tight coupling risk", "fragile base class problem"],
        "uses": ["animal hierarchy", "vehicle types", "UI component hierarchy", "shape hierarchy"],
        "synonyms": ["inheritance", "class inheritance", "extends", "subclass", "superclass"]
    },

    "polymorphism": {
        "core": ["method overriding", "method overloading", "runtime polymorphism", "compile time polymorphism", "same interface different behavior"],
        "ops": ["override parent method", "overload with different params", "use parent reference for child"],
        "props": ["flexible code", "runtime decision via dynamic dispatch", "reduces if-else chains"],
        "uses": ["shape area calculation", "animal sound", "payment methods", "plugin systems"],
        "synonyms": ["polymorphism", "method overriding", "method overloading", "runtime polymorphism"]
    },

    "abstraction": {
        "core": ["abstract class", "interface", "hide implementation", "show only essentials", "contract", "blueprint"],
        "ops": ["define abstract method", "implement interface", "hide complex logic"],
        "props": ["reduces complexity", "forces contract on subclasses", "loose coupling"],
        "uses": ["database abstraction layer", "payment gateway", "UI abstraction", "hardware abstraction"],
        "synonyms": ["abstraction", "abstract class", "interface", "abstract method"]
    },

    "design patterns": {
        "core": ["singleton", "factory", "observer", "decorator", "strategy", "SOLID principles", "creational structural behavioral"],
        "ops": ["apply pattern", "define interface", "implement concrete class", "separate concerns"],
        "props": ["reusable proven solution", "improves maintainability", "reduces code duplication"],
        "uses": ["large system design", "framework development", "team collaboration", "open source libraries"],
        "synonyms": ["design pattern", "patterns", "singleton", "factory pattern", "observer pattern", "SOLID"]
    },

    # ══════════════════════════════════════════
    # OPERATING SYSTEMS
    # ══════════════════════════════════════════

    "os": {
        "core": ["process", "thread", "memory management", "file system", "CPU scheduling", "kernel", "system call"],
        "ops": ["create process", "schedule CPU", "allocate memory", "handle interrupt", "manage files"],
        "props": ["manages hardware resources", "provides abstraction", "multi-user", "multitasking"],
        "uses": ["runs user programs", "manages hardware", "security isolation", "resource allocation"],
        "synonyms": ["operating system", "OS", "kernel"]
    },

    "process": {
        "core": ["program in execution", "PCB", "process state", "PID", "context switch", "states: new ready running waiting terminated"],
        "ops": ["fork", "exec", "wait", "kill", "context switch"],
        "props": ["isolated address space", "independent execution", "heavyweight", "has its own memory"],
        "uses": ["run programs", "process isolation", "multiprocessing", "background services"],
        "synonyms": ["process", "program execution", "task"]
    },

    "thread": {
        "core": ["lightweight process", "shared memory space", "stack per thread", "TID", "concurrent execution"],
        "ops": ["create thread", "join thread", "synchronize", "mutex lock", "signal"],
        "props": ["shared address space", "lightweight", "faster context switch than process", "race condition risk"],
        "uses": ["web server requests", "GUI responsiveness", "parallel computation", "concurrent I/O"],
        "synonyms": ["thread", "multithreading", "concurrent thread", "lightweight process"]
    },

    "deadlock": {
        "core": ["mutual exclusion", "hold and wait", "no preemption", "circular wait", "Coffman conditions", "resource allocation"],
        "ops": ["detect deadlock", "prevent via ordering", "avoid via Banker algorithm", "recover by killing process"],
        "props": ["system halts progress", "four necessary conditions", "preventable or avoidable"],
        "uses": ["OS resource management", "database transaction locking", "concurrent programming"],
        "synonyms": ["deadlock", "circular wait", "resource deadlock", "livelock"]
    },

    "cpu scheduling": {
        "core": ["FCFS", "SJF", "round robin", "priority scheduling", "preemptive", "non-preemptive", "time quantum", "context switch"],
        "ops": ["select next process", "dispatch to CPU", "context switch", "preempt on quantum expiry"],
        "props": ["maximize CPU utilization", "minimize waiting time", "fairness", "prevent starvation"],
        "uses": ["OS task management", "real time systems", "batch processing", "interactive systems"],
        "synonyms": ["CPU scheduling", "process scheduling", "round robin", "FCFS", "SJF"]
    },

    "memory management": {
        "core": ["paging", "segmentation", "virtual memory", "page fault", "TLB", "frame", "page table", "address translation"],
        "ops": ["allocate memory", "free memory", "page in", "page out", "translate virtual to physical"],
        "props": ["isolation between processes", "allows more programs than RAM", "internal external fragmentation"],
        "uses": ["OS memory allocation", "virtual address space", "process isolation", "memory mapped files"],
        "synonyms": ["memory management", "virtual memory", "paging", "segmentation", "page table"]
    },

    "synchronization": {
        "core": ["mutex", "semaphore", "lock", "race condition", "critical section", "monitor", "atomic operation"],
        "ops": ["lock mutex", "unlock mutex", "wait on semaphore", "signal semaphore", "enter critical section"],
        "props": ["prevents race conditions", "ensures atomicity", "overhead cost", "can cause deadlock"],
        "uses": ["shared resource access", "bank account update", "file write", "producer consumer problem"],
        "synonyms": ["synchronization", "mutex", "semaphore", "lock", "monitor", "critical section"]
    },

    # ══════════════════════════════════════════
    # DBMS
    # ══════════════════════════════════════════

    "dbms": {
        "core": ["table", "row record", "column attribute", "schema", "primary key", "foreign key", "SQL query"],
        "ops": ["SELECT", "INSERT", "UPDATE", "DELETE", "JOIN", "GROUP BY", "ORDER BY", "WHERE"],
        "props": ["structured data storage", "ACID compliance", "persistent", "concurrent access"],
        "uses": ["web applications", "banking systems", "ERP", "user management", "e-commerce"],
        "synonyms": ["database", "DBMS", "relational database", "RDBMS", "SQL", "database management"]
    },

    "normalization": {
        "core": ["1NF", "2NF", "3NF", "BCNF", "functional dependency", "redundancy elimination", "update anomaly"],
        "ops": ["identify functional dependencies", "decompose tables", "eliminate partial dependency", "eliminate transitive dependency"],
        "props": ["reduces data redundancy", "improves integrity", "may reduce query performance"],
        "uses": ["database schema design", "remove update anomaly", "remove insertion anomaly", "remove deletion anomaly"],
        "synonyms": ["normalization", "normal forms", "1NF 2NF 3NF", "database normalization"]
    },

    "acid": {
        "core": ["atomicity", "consistency", "isolation", "durability", "transaction", "commit", "rollback"],
        "ops": ["begin transaction", "execute statements", "commit on success", "rollback on failure"],
        "props": ["all or nothing execution", "maintains database validity", "concurrent transaction safety", "data persists after commit"],
        "uses": ["bank money transfer", "order placement", "inventory update", "booking systems"],
        "synonyms": ["ACID", "ACID properties", "transaction properties", "atomicity consistency isolation durability"]
    },

    "indexing": {
        "core": ["index structure", "B-tree index", "hash index", "clustered index", "non-clustered index", "search key"],
        "ops": ["create index", "drop index", "index scan", "full table scan"],
        "props": ["O(log n) search with index", "extra storage cost", "slows write operations", "speeds read queries"],
        "uses": ["fast query execution", "primary key lookup", "full text search", "range queries"],
        "synonyms": ["index", "database index", "B-tree index", "clustered index"]
    },

    "sql joins": {
        "core": ["INNER JOIN", "LEFT JOIN", "RIGHT JOIN", "FULL OUTER JOIN", "ON clause", "matching rows", "NULL for unmatched"],
        "ops": ["join two tables on condition", "filter with WHERE", "select columns from both"],
        "props": ["combines rows from multiple tables", "LEFT JOIN keeps all left rows", "NULL for unmatched right"],
        "uses": ["customer order reports", "find students without grades", "combine product and category data"],
        "synonyms": ["join", "joins", "SQL join", "inner join", "outer join", "left join", "right join"]
    },

    "transactions": {
        "core": ["begin transaction", "commit", "rollback", "savepoint", "isolation level", "concurrency control"],
        "ops": ["start transaction", "execute SQL", "commit if success", "rollback on error"],
        "props": ["ACID compliant unit", "atomic execution", "recoverable on failure"],
        "uses": ["bank transfer", "ticket booking", "order processing", "inventory management"],
        "synonyms": ["transaction", "database transaction", "SQL transaction", "DB transaction"]
    },

    # ══════════════════════════════════════════
    # COMPUTER NETWORKS
    # ══════════════════════════════════════════

    "networking": {
        "core": ["protocol", "IP address", "TCP", "UDP", "HTTP", "DNS", "packet", "socket", "port"],
        "ops": ["send packet", "receive packet", "establish connection", "resolve hostname"],
        "props": ["layered architecture", "OSI and TCP/IP models", "reliable vs unreliable delivery"],
        "uses": ["internet browsing", "web applications", "file transfer", "video calls"],
        "synonyms": ["network", "computer networks", "networking", "data communication"]
    },

    "tcp ip": {
        "core": ["three way handshake", "SYN", "SYN-ACK", "ACK", "connection oriented", "reliable delivery", "flow control", "congestion control"],
        "ops": ["SYN from client", "SYN-ACK from server", "ACK from client", "send segment", "receive acknowledgment"],
        "props": ["guaranteed delivery", "ordered packets", "error detection", "slower than UDP due to overhead"],
        "uses": ["HTTP web browsing", "FTP file transfer", "email SMTP", "database connections"],
        "synonyms": ["TCP", "TCP/IP", "transmission control protocol", "reliable transport"]
    },

    "udp": {
        "core": ["connectionless", "datagram", "no handshake", "unreliable", "best effort delivery", "low latency"],
        "ops": ["send datagram", "receive datagram", "no acknowledgment needed"],
        "props": ["faster than TCP", "no delivery guarantee", "no ordering", "low overhead"],
        "uses": ["video streaming", "DNS lookup", "online gaming", "VoIP", "live broadcast"],
        "synonyms": ["UDP", "user datagram protocol", "connectionless protocol"]
    },

    "http https": {
        "core": ["request response model", "GET POST PUT DELETE", "status code", "header", "TLS encryption", "stateless protocol"],
        "ops": ["send HTTP request", "receive HTTP response", "set request headers", "handle status codes"],
        "props": ["stateless", "HTTPS uses TLS for encryption", "text based protocol", "port 80 for HTTP 443 for HTTPS"],
        "uses": ["web browsing", "REST API calls", "file download", "form submission", "API integration"],
        "synonyms": ["HTTP", "HTTPS", "HTTP protocol", "REST", "web protocol", "HyperText Transfer Protocol"]
    },

    "osi model": {
        "core": ["physical layer", "data link layer", "network layer", "transport layer", "session layer", "presentation layer", "application layer", "7 layers"],
        "ops": ["encapsulate data going down", "decapsulate going up", "route at network layer", "switch at data link"],
        "props": ["layered abstraction model", "each layer has specific role", "enables interoperability"],
        "uses": ["network troubleshooting", "protocol design reference", "teaching networking concepts"],
        "synonyms": ["OSI", "OSI model", "seven layer model", "open systems interconnection"]
    },

    "dns": {
        "core": ["domain name to IP mapping", "resolver", "root name server", "authoritative server", "TTL", "recursive query"],
        "ops": ["query DNS resolver", "resolve hostname to IP", "cache DNS response", "iterative or recursive lookup"],
        "props": ["hierarchical distributed system", "cached for performance", "UDP based", "TTL controls cache life"],
        "uses": ["website access", "email routing", "load balancing via DNS", "CDN distribution"],
        "synonyms": ["DNS", "domain name system", "name resolution"]
    },

    # ══════════════════════════════════════════
    # SYSTEM DESIGN
    # ══════════════════════════════════════════

    "system design": {
        "core": ["scalability", "availability", "reliability", "latency", "throughput", "consistency", "partition tolerance", "tradeoffs"],
        "ops": ["design API endpoints", "choose database type", "add caching layer", "add load balancer", "shard database"],
        "props": ["no perfect solution only tradeoffs", "CAP theorem governs distributed systems", "horizontal vs vertical scaling"],
        "uses": ["URL shortener", "Twitter feed", "YouTube", "WhatsApp", "Uber design interviews"],
        "synonyms": ["system design", "distributed system design", "large scale system", "high level design"]
    },

    "load balancer": {
        "core": ["distribute incoming traffic", "round robin algorithm", "least connections", "health check", "horizontal scaling"],
        "ops": ["route request to healthy server", "perform health checks", "handle failover", "session persistence"],
        "props": ["improves availability", "prevents single server overload", "itself can be single point of failure"],
        "uses": ["web server farms", "API gateways", "cloud auto scaling", "zero downtime deployment"],
        "synonyms": ["load balancer", "load balancing", "reverse proxy", "traffic distribution"]
    },

    "caching": {
        "core": ["cache hit", "cache miss", "eviction policy", "LRU eviction", "TTL time to live", "Redis", "Memcached"],
        "ops": ["get from cache", "set in cache", "evict old entries", "invalidate stale cache"],
        "props": ["drastically faster reads", "reduces database load", "stale data risk", "memory limited"],
        "uses": ["session token storage", "frequently read database results", "API response cache", "CDN edge caching"],
        "synonyms": ["cache", "caching", "Redis cache", "Memcached", "in-memory cache"]
    },

    "cap theorem": {
        "core": ["consistency all nodes same data", "availability system always responds", "partition tolerance survives network split", "choose two of three"],
        "ops": ["handle network partition", "sacrifice consistency for availability", "sacrifice availability for consistency"],
        "props": ["cannot simultaneously guarantee all three", "partition tolerance is usually required", "CP vs AP systems"],
        "uses": ["choosing between SQL and NoSQL", "distributed database design", "microservices architecture decisions"],
        "synonyms": ["CAP theorem", "CAP", "Brewer theorem", "consistency availability partition"]
    },

    "microservices": {
        "core": ["independent deployable service", "API gateway", "service discovery", "loose coupling", "Docker", "Kubernetes", "bounded context"],
        "ops": ["split monolith by domain", "communicate via REST or gRPC", "deploy each service independently", "scale individual services"],
        "props": ["independent deployment", "technology heterogeneity", "complex inter-service communication", "distributed tracing needed"],
        "uses": ["Netflix architecture", "Amazon services", "large scale cloud applications", "fintech platforms"],
        "synonyms": ["microservices", "microservice architecture", "service oriented architecture", "SOA"]
    },

    "database sharding": {
        "core": ["shard partition of data", "shard key", "horizontal partitioning", "data distribution across nodes", "routing layer"],
        "ops": ["choose shard key", "route query to correct shard", "rebalance shards when adding nodes"],
        "props": ["scales horizontally", "cross shard queries are complex", "hotspot risk with poor shard key"],
        "uses": ["large user databases sharded by user ID", "geographic data by region", "high write throughput apps"],
        "synonyms": ["sharding", "database sharding", "horizontal partitioning", "data partitioning"]
    },

    "message queue": {
        "core": ["producer sends messages", "consumer receives messages", "broker stores messages", "topic", "async communication", "Kafka", "RabbitMQ"],
        "ops": ["publish message to topic", "consume message from queue", "acknowledge processing", "retry on failure"],
        "props": ["decouples producer and consumer", "async communication", "durable message storage", "scalable"],
        "uses": ["order processing pipeline", "notification service", "log aggregation", "event driven architecture"],
        "synonyms": ["message queue", "message broker", "Kafka", "RabbitMQ", "pub sub", "event queue"]
    },

    "CDN": {
        "core": ["content delivery network", "edge server close to user", "origin server", "geographic distribution", "static content caching"],
        "ops": ["cache static assets at edge", "serve from nearest edge node", "invalidate cache when content changes"],
        "props": ["reduces latency dramatically", "high availability", "reduces origin server load"],
        "uses": ["serving images videos CSS JS", "video streaming platforms", "global web applications", "software distribution"],
        "synonyms": ["CDN", "content delivery network", "edge network", "content distribution"]
    },

    # ══════════════════════════════════════════
    # MACHINE LEARNING
    # ══════════════════════════════════════════

    "machine learning": {
        "core": ["supervised learning", "unsupervised learning", "reinforcement learning", "training data", "model", "features", "labels", "prediction"],
        "ops": ["train model on data", "evaluate on test set", "predict on new data", "tune hyperparameters", "cross validate"],
        "props": ["learns patterns from data", "generalizes to unseen data", "requires sufficient training data"],
        "uses": ["spam detection", "image recognition", "recommendation systems", "medical diagnosis", "fraud detection"],
        "synonyms": ["ML", "machine learning", "statistical learning", "predictive modeling"]
    },

    "neural network": {
        "core": ["neuron", "layer", "weights", "bias", "activation function", "forward pass", "backpropagation", "gradient descent"],
        "ops": ["forward pass compute output", "compute loss", "backpropagation compute gradients", "update weights"],
        "props": ["learns complex non-linear patterns", "requires GPU for training", "black box model", "prone to overfitting"],
        "uses": ["image classification", "NLP tasks", "speech recognition", "generative AI", "recommendation systems"],
        "synonyms": ["neural network", "deep learning", "ANN", "MLP", "deep neural network", "artificial neural network"]
    },

    "overfitting": {
        "core": ["high variance", "low training error", "high test error", "memorizing training data", "poor generalization", "bias variance tradeoff"],
        "ops": ["add dropout layers", "L1 L2 regularization", "reduce model complexity", "add more training data", "cross validation"],
        "props": ["model memorizes instead of learning patterns", "overly complex model", "training vs validation gap"],
        "uses": ["model evaluation and selection", "hyperparameter tuning", "neural network training"],
        "synonyms": ["overfitting", "overfit", "high variance problem", "generalization failure"]
    },

    "gradient descent": {
        "core": ["loss function", "gradient of loss", "learning rate", "weight update rule", "convergence", "epoch", "local minima"],
        "ops": ["compute forward pass", "compute loss", "compute gradient via backprop", "update weights by negative gradient"],
        "props": ["iterative optimization algorithm", "sensitive to learning rate", "may stuck in local minima", "SGD adds noise"],
        "uses": ["training neural networks", "logistic regression optimization", "linear regression", "all gradient based models"],
        "synonyms": ["gradient descent", "SGD", "stochastic gradient descent", "optimizer", "Adam", "backpropagation"]
    },

    "cnn": {
        "core": ["convolution operation", "filter kernel", "feature map", "pooling layer", "stride", "padding", "receptive field", "parameter sharing"],
        "ops": ["convolve input with filter", "apply activation ReLU", "max pooling", "flatten", "fully connected layer"],
        "props": ["translation invariant", "parameter sharing reduces parameters", "learns hierarchical features"],
        "uses": ["image classification", "object detection YOLO", "face recognition", "medical imaging", "video analysis"],
        "synonyms": ["CNN", "convolutional neural network", "convolution network", "ConvNet"]
    },

    "rnn lstm": {
        "core": ["recurrent connection", "hidden state", "sequence processing", "LSTM forget gate input gate output gate", "cell state", "vanishing gradient"],
        "ops": ["process each token in sequence", "update hidden state", "gate information with sigmoid", "output sequence or final state"],
        "props": ["handles sequential data", "vanishing gradient problem in basic RNN", "LSTM solves long term dependencies", "GRU is simpler LSTM variant"],
        "uses": ["NLP text generation", "time series prediction", "speech recognition", "machine translation", "sentiment analysis"],
        "synonyms": ["RNN", "LSTM", "GRU", "recurrent neural network", "sequence model", "long short term memory"]
    },

    "transformers": {
        "core": ["self attention mechanism", "query key value", "multi-head attention", "positional encoding", "encoder decoder", "attention score"],
        "ops": ["compute Q K V matrices", "compute attention scores dot product", "apply softmax", "weighted sum of values", "stack transformer blocks"],
        "props": ["parallelizable unlike RNN", "handles long range dependencies well", "state of the art on NLP", "requires large data"],
        "uses": ["GPT language models", "BERT classification", "machine translation", "chatbots", "code generation", "image generation"],
        "synonyms": ["transformer", "attention mechanism", "self attention", "BERT", "GPT", "transformer model"]
    },

    "clustering": {
        "core": ["K-means algorithm", "centroid", "cluster assignment", "inertia within cluster sum", "unsupervised", "Euclidean distance"],
        "ops": ["initialize K centroids", "assign each point to nearest centroid", "update centroid as mean", "repeat until convergence"],
        "props": ["unsupervised no labels needed", "must choose K in advance", "sensitive to outliers and initialization"],
        "uses": ["customer segmentation", "image compression", "anomaly detection", "document topic modeling", "gene expression analysis"],
        "synonyms": ["clustering", "K-means", "K-means clustering", "unsupervised clustering", "cluster analysis"]
    },

    "classification": {
        "core": ["class label", "decision boundary", "logistic regression", "SVM", "random forest", "precision recall F1 accuracy"],
        "ops": ["train classifier on labeled data", "predict class for new sample", "evaluate with confusion matrix"],
        "props": ["supervised learning", "binary or multiclass output", "probability score possible"],
        "uses": ["spam email detection", "disease diagnosis", "sentiment analysis", "fraud detection", "image classification"],
        "synonyms": ["classification", "classifier", "logistic regression", "SVM", "decision tree", "random forest"]
    },

    # ══════════════════════════════════════════
    # CS FUNDAMENTALS
    # ══════════════════════════════════════════

    "time complexity": {
        "core": ["Big O notation", "O(1) constant", "O(log n) logarithmic", "O(n) linear", "O(n log n)", "O(n²) quadratic", "worst best average case"],
        "ops": ["analyze loop iterations", "count basic operations", "simplify by dropping constants", "identify dominant term"],
        "props": ["machine independent measure", "asymptotic analysis", "constants and lower terms dropped"],
        "uses": ["compare algorithm efficiency", "predict scalability", "choose better algorithm", "interview analysis"],
        "synonyms": ["time complexity", "Big O", "complexity analysis", "space complexity", "asymptotic complexity"]
    },

    "bit manipulation": {
        "core": ["AND operation", "OR operation", "XOR operation", "NOT operation", "left shift", "right shift", "bitmask"],
        "ops": ["set a bit", "clear a bit", "toggle a bit", "check if bit is set", "count set bits"],
        "props": ["O(1) bit operations", "memory efficient", "fast low level operations"],
        "uses": ["flag storage", "check power of two", "XOR swap", "subset generation", "competitive programming tricks"],
        "synonyms": ["bit manipulation", "bitwise operations", "bitmasking", "bitwise"]
    },

    "concurrency": {
        "core": ["thread", "process", "mutex lock", "semaphore", "deadlock", "race condition", "atomic operation", "synchronized"],
        "ops": ["create and start thread", "acquire lock", "release lock", "wait and notify", "atomic compare and swap"],
        "props": ["improves CPU utilization", "complex to debug", "non-deterministic execution order"],
        "uses": ["web servers handling requests", "database concurrent transactions", "parallel processing", "UI responsiveness"],
        "synonyms": ["concurrency", "parallelism", "multithreading", "concurrent programming", "parallel programming"]
    },

    "api design": {
        "core": ["REST endpoint", "HTTP methods GET POST PUT DELETE", "status codes 200 404 500", "JSON payload", "authentication JWT", "versioning", "stateless"],
        "ops": ["define resource endpoints", "handle request validation", "return appropriate status codes", "document with OpenAPI"],
        "props": ["stateless requests", "resource based URLs", "scalable", "cacheable responses"],
        "uses": ["mobile backend", "web service integration", "microservice communication", "third party developer APIs"],
        "synonyms": ["REST API", "API design", "RESTful API", "web API", "HTTP API"]
    },

    "git": {
        "core": ["commit snapshot", "branch", "merge", "pull request", "clone", "push pull", "conflict resolution", "staging area"],
        "ops": ["git commit", "git branch", "git merge", "git rebase", "git pull", "git push", "resolve merge conflict"],
        "props": ["distributed version control", "tracks full history", "branching is lightweight", "supports collaboration"],
        "uses": ["code versioning", "team collaboration", "open source contribution", "CI/CD pipelines", "code review"],
        "synonyms": ["git", "version control", "GitHub", "source control", "git flow"]
    },

}

# ─────────────────────────────────────────────
# PRIORITY ORDER for topic detection
# (longer / more specific phrases first to avoid wrong matches)
# ─────────────────────────────────────────────
TOPIC_PRIORITY = [
    "doubly linked list", "linked list",
    "binary search tree", "binary search", "binary tree",
    "avl tree", "union find",
    "hash table",
    "rnn lstm", "neural network",
    "sliding window", "two pointers",
    "divide and conquer", "dynamic programming",
    "sql joins", "message queue",
    "database sharding",
    "cap theorem",
    "gradient descent",
    "machine learning",
    "cpu scheduling", "memory management",
    "time complexity", "bit manipulation",
    "api design",
    "load balancer",
    "osi model",
    "tcp ip", "http https",
    "topological sort",
    "design patterns",
    "system design",
    "microservices",
    "dijkstra",
    "backtracking",
    "concurrency",
    "synchronization",
    "clustering", "classification",
    "normalization",
    "transactions",
    "indexing",
    "acid",
    "dbms",
    "networking",
    "polymorphism", "encapsulation", "inheritance", "abstraction",
    "recursion", "sorting", "greedy",
    "heap", "trie", "deque",
    "stack", "queue", "array",
    "graph", "caching",
    "process", "thread", "deadlock",
    "oop", "os",
    "BFS", "DFS",
    "CDN", "dns", "udp",
    "cnn", "transformers",
    "overfitting",
    "git",
]


def detect_topic(question_text: str, answer_text: str = "") -> str | None:
    combined = (question_text + " " + answer_text).lower()
    for topic in TOPIC_PRIORITY:
        if topic.lower() in combined:
            return topic
    # Fuzzy match via synonyms
    for topic, data in CONCEPT_MAP.items():
        for syn in data.get("synonyms", []):
            if syn.lower() in combined:
                return topic
    return None


def calculate_semantic_similarity(answer: str, ideal_answer: str) -> float:
    if not answer.strip() or not ideal_answer.strip():
        return 0.0
    embeddings = model.encode([answer, ideal_answer])
    similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    return float(max(0.0, min(1.0, similarity)))


def extract_keywords(text: str) -> set:
    words = re.findall(r'\b[a-zA-Z][a-zA-Z0-9\-]*\b', text.lower())
    return {w for w in words if w not in STOP_WORDS and len(w) > 2}


def calculate_keyword_coverage(answer: str, topic: str | None, ideal_answer: str) -> tuple[float, list, list]:
    answer_lower = answer.lower()

    if topic and topic in CONCEPT_MAP:
        concept = CONCEPT_MAP[topic]
        core_terms = concept.get("core", [])
        ops_terms = concept.get("ops", [])
        all_terms = core_terms + ops_terms

        found = [t for t in all_terms if t.lower() in answer_lower]
        missing = [t for t in core_terms if t.lower() not in answer_lower]

        if not all_terms:
            return 0.5, [], []

        score = len(found) / len(all_terms)
        # Bonus for covering ops
        ops_found = [t for t in ops_terms if t.lower() in answer_lower]
        if ops_terms:
            ops_bonus = (len(ops_found) / len(ops_terms)) * 0.15
            score = min(1.0, score + ops_bonus)
        return score, found, missing[:4]

    # Fallback: use ideal answer keywords
    ideal_keywords = extract_keywords(ideal_answer)
    answer_keywords = extract_keywords(answer)
    if not ideal_keywords:
        return 0.5, [], []
    found = list(ideal_keywords & answer_keywords)
    missing = list(ideal_keywords - answer_keywords)
    score = len(found) / len(ideal_keywords)
    return min(1.0, score), found, missing[:4]


def calculate_depth(answer: str, topic: str | None) -> float:
    a = answer.lower()
    checks = {
        "has_definition": any(w in a for w in ["is a", "is an", "means", "defined as", "refers to", "called"]),
        "has_operations": any(w in a for w in ["insert", "delete", "search", "traverse", "add", "remove", "update", "push", "pop", "sort", "compute"]),
        "has_example": any(w in a for w in ["example", "for instance", "such as", "like", "e.g.", "suppose", "consider", "imagine"]),
        "has_complexity": any(w in a for w in ["o(", "O(", "time complexity", "space complexity", "log n", "linear time", "constant time"]),
        "has_use_case": any(w in a for w in ["used in", "useful for", "application", "real world", "helps", "when we need", "commonly used"]),
        "has_comparison": any(w in a for w in ["better than", "unlike", "compared to", "vs", "difference", "whereas", "while", "however"]),
    }
    if topic and topic in CONCEPT_MAP:
        concept = CONCEPT_MAP[topic]
        uses = concept.get("uses", [])
        if uses:
            checks["has_use_case"] = checks["has_use_case"] or any(u.lower() in a for u in uses)
        props = concept.get("props", [])
        if props:
            checks["has_property"] = any(p.lower() in a for p in props)

    return sum(checks.values()) / len(checks)


def calculate_structure_score(answer: str) -> float:
    sentences = [s.strip() for s in re.split(r'[.!?]', answer) if s.strip()]
    words = answer.split()
    score = 0.0
    if len(words) >= 30:
        score += 0.3
    if len(sentences) >= 2:
        score += 0.3
    if len(words) >= 60:
        score += 0.2
    if any(w in answer.lower() for w in ["first", "second", "finally", "also", "additionally", "furthermore", "however", "moreover"]):
        score += 0.2
    return min(1.0, score)


def generate_feedback(
    semantic_score: float,
    keyword_score: float,
    depth_score: float,
    structure_score: float,
    missing_keywords: list,
    topic: str | None,
    answer: str
) -> str:
    overall = (semantic_score * 0.45) + (keyword_score * 0.25) + (depth_score * 0.20) + (structure_score * 0.10)
    feedback_parts = []

    if overall >= 0.80:
        feedback_parts.append("Excellent answer!")
    elif overall >= 0.60:
        feedback_parts.append("Good answer with room to improve.")
    elif overall >= 0.40:
        feedback_parts.append("Partial answer — key concepts missing.")
    else:
        feedback_parts.append("Answer needs significant improvement.")

    if missing_keywords:
        feedback_parts.append(f"Key terms missing: {', '.join(missing_keywords[:4])}.")

    if topic and topic in CONCEPT_MAP:
        concept = CONCEPT_MAP[topic]
        if depth_score < 0.4:
            ops = concept.get("ops", [])[:3]
            if ops:
                feedback_parts.append(f"Try covering operations like: {', '.join(ops)}.")
            uses = concept.get("uses", [])[:2]
            if uses:
                feedback_parts.append(f"Mention use cases such as: {', '.join(uses)}.")

    if structure_score < 0.5:
        feedback_parts.append("Add more explanation — aim for 3+ sentences with examples.")

    # Only suggest complexity for algorithmic topics
    no_complexity_topics = {"oop", "os", "dbms", "system design", "api design", "git", "encapsulation",
                            "inheritance", "polymorphism", "abstraction", "design patterns", "acid",
                            "normalization", "transactions", "networking", "dns", "http https", "osi model"}
    if "O(" not in answer and "time complexity" not in answer.lower() and topic not in no_complexity_topics:
        feedback_parts.append("Mention time or space complexity for a complete answer.")

    return " ".join(feedback_parts)


def evaluate_answer(
    answer: str,
    ideal_answer: str,
    question_text: str = ""
) -> dict:
    if not answer or not answer.strip():
        return {
            "semantic_score": 0, "keyword_score": 0,
            "depth_score": 0, "structure_score": 0,
            "overall_score": 0,
            "feedback": "No answer provided.",
            "missing_keywords": [], "found_keywords": [],
            "detected_topic": None
        }

    topic = detect_topic(question_text, answer)

    semantic = calculate_semantic_similarity(answer, ideal_answer)
    keyword_cov, found_kws, missing_kws = calculate_keyword_coverage(answer, topic, ideal_answer)
    depth = calculate_depth(answer, topic)
    structure = calculate_structure_score(answer)

    overall = (semantic * 0.45) + (keyword_cov * 0.25) + (depth * 0.20) + (structure * 0.10)
    overall = round(min(1.0, max(0.0, overall)) * 100, 2)

    feedback = generate_feedback(semantic, keyword_cov, depth, structure, missing_kws, topic, answer)

    return {
        "semantic_score": round(semantic * 100, 2),
        "keyword_score": round(keyword_cov * 100, 2),
        "depth_score": round(depth * 100, 2),
        "structure_score": round(structure * 100, 2),
        "overall_score": overall,
        "feedback": feedback,
        "missing_keywords": missing_kws,
        "found_keywords": found_kws[:6],
        "detected_topic": topic
    }
