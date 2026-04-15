"""
Full Question Bank — 440+ Questions
Subjects: DSA (Tier 1 + Tier 2 + Tier 3), OOP, System Design, DBMS, OS+CN, ML/AI
Difficulty: beginner | intermediate | advanced | expert
"""

QUESTION_BANK = [

    # ══════════════════════════════════════════════════════════════════════
    # TIER 1 CORE DSA
    # ══════════════════════════════════════════════════════════════════════

    # ── ARRAYS ────────────────────────────────────────────────────────────
    {"topic":"arrays","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"arrays,basics","companies":"Amazon,Microsoft",
     "question_text":"What is an array and what are its key properties?",
     "ideal_answer":"An array is a linear data structure storing elements of the same type in contiguous memory. Key properties: fixed size, O(1) random access by index, O(n) insertion and deletion, cache-friendly due to memory locality.",
     "time_complexity":"O(1) access","space_complexity":"O(n)"},

    {"topic":"arrays","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"arrays,traversal","companies":"Infosys,TCS",
     "question_text":"How do you find the second largest element in an array?",
     "ideal_answer":"Traverse the array once tracking the largest and second largest. If current element is greater than largest, update second largest to largest then update largest. If current is between largest and second largest, update second largest. O(n) time, O(1) space.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"arrays","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"arrays,reversal","companies":"TCS,Wipro",
     "question_text":"How do you reverse an array in place?",
     "ideal_answer":"Use two pointers — left at 0, right at n-1. Swap arr[left] and arr[right], increment left, decrement right until they meet. Time O(n), space O(1). No extra array needed.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"arrays","subtopic":"prefix_sum","difficulty":"intermediate","type":"technical","tags":"arrays,prefix_sum,range_query","companies":"Amazon,Google",
     "question_text":"Explain the prefix sum technique and where it is used.",
     "ideal_answer":"Prefix sum creates an auxiliary array where prefix[i] = sum of arr[0..i]. Then range sum query arr[l..r] = prefix[r] - prefix[l-1] in O(1). Preprocessing takes O(n). Used in range sum queries, subarray sum problems, 2D matrix queries.",
     "time_complexity":"O(1) query after O(n) preprocessing","space_complexity":"O(n)"},

    {"topic":"arrays","subtopic":"kadane","difficulty":"intermediate","type":"technical","tags":"arrays,dp,kadane","companies":"Amazon,Facebook",
     "question_text":"Explain Kadane's algorithm for maximum subarray sum.",
     "ideal_answer":"Kadane's algorithm tracks current_sum and max_sum. At each element, current_sum = max(element, current_sum + element). If extending subarray gives less than starting fresh, restart. max_sum tracks the global maximum. O(n) time, O(1) space.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"arrays","subtopic":"two_pointers","difficulty":"intermediate","type":"technical","tags":"arrays,two_pointers","companies":"Google,Amazon",
     "question_text":"How do you find all triplets in an array that sum to zero?",
     "ideal_answer":"Sort the array. For each element arr[i], use two pointers left=i+1 and right=n-1. If sum is zero, add triplet and move both pointers. If sum less than zero move left right, if greater move right left. Skip duplicates. O(n^2) time, O(1) extra space.",
     "time_complexity":"O(n^2)","space_complexity":"O(1)"},

    {"topic":"arrays","subtopic":"rotation","difficulty":"intermediate","type":"technical","tags":"arrays,rotation","companies":"Microsoft,Amazon",
     "question_text":"How do you rotate an array by k positions to the right?",
     "ideal_answer":"Reverse the entire array, then reverse first k elements, then reverse remaining n-k elements. Example [1,2,3,4,5] k=2 becomes [4,5,1,2,3]. O(n) time, O(1) space. Alternatively use extra array in O(n) space.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"arrays","subtopic":"dutch_flag","difficulty":"intermediate","type":"technical","tags":"arrays,sorting,dutch_flag","companies":"Google,Microsoft",
     "question_text":"Explain the Dutch National Flag algorithm.",
     "ideal_answer":"Three-way partitioning of array into three sections. Three pointers: low, mid, high. Elements less than pivot go to low section, equal to mid section, greater to high section. Single pass O(n) time, O(1) space. Used in sort colors (0,1,2) problem.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"arrays","subtopic":"matrix","difficulty":"advanced","type":"technical","tags":"arrays,matrix,2d","companies":"Amazon,Google",
     "question_text":"How do you rotate a 2D matrix by 90 degrees clockwise in place?",
     "ideal_answer":"First transpose the matrix (swap arr[i][j] with arr[j][i]), then reverse each row. For anti-clockwise: transpose then reverse each column. O(n^2) time, O(1) space. Works only for square matrices.",
     "time_complexity":"O(n^2)","space_complexity":"O(1)"},

    {"topic":"arrays","subtopic":"intervals","difficulty":"advanced","type":"technical","tags":"arrays,intervals,sorting","companies":"Facebook,Google",
     "question_text":"How do you merge overlapping intervals?",
     "ideal_answer":"Sort intervals by start time. Iterate through intervals maintaining a result list. If current interval overlaps with last in result (current.start <= last.end), merge by updating end to max of both ends. Otherwise add current to result. O(n log n) due to sorting.",
     "time_complexity":"O(n log n)","space_complexity":"O(n)"},

    {"topic":"arrays","subtopic":"cyclic_sort","difficulty":"advanced","type":"technical","tags":"arrays,cyclic_sort","companies":"Amazon,Microsoft",
     "question_text":"What is cyclic sort and when do you use it?",
     "ideal_answer":"Cyclic sort places each element at its correct index in one pass. For array with elements 1 to n, element i should be at index i-1. If arr[i] != i+1, swap arr[i] with arr[arr[i]-1]. Used to find missing/duplicate numbers in O(n) time O(1) space.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"arrays","subtopic":"binary_search","difficulty":"advanced","type":"technical","tags":"arrays,binary_search","companies":"Google,Amazon",
     "question_text":"How do you find an element in a rotated sorted array?",
     "ideal_answer":"Modified binary search. Find mid. Check which half is sorted. If left half sorted and target in left range, search left. Else search right. If right half sorted and target in right range, search right, else search left. O(log n) time.",
     "time_complexity":"O(log n)","space_complexity":"O(1)"},

    {"topic":"arrays","subtopic":"expert","difficulty":"expert","type":"technical","tags":"arrays,trapping_rain","companies":"Amazon,Google,Facebook",
     "question_text":"How do you solve the trapping rain water problem?",
     "ideal_answer":"Two pointer approach. Left and right pointers at ends. Track left_max and right_max. If left_max < right_max, water at left = left_max - height[left], move left right. Else water at right = right_max - height[right], move right left. O(n) time O(1) space.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    # ── STRINGS ───────────────────────────────────────────────────────────
    {"topic":"strings","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"strings,basics","companies":"Amazon,Microsoft",
     "question_text":"What is the difference between a string and a character array?",
     "ideal_answer":"A character array is just a sequence of characters. A string is a higher-level abstraction with built-in methods for manipulation. In C, strings are null-terminated char arrays. In Java/Python, strings are immutable objects with rich APIs. Strings provide methods like length, substring, replace, split.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"strings","subtopic":"palindrome","difficulty":"beginner","type":"technical","tags":"strings,palindrome","companies":"TCS,Wipro",
     "question_text":"How do you check if a string is a palindrome?",
     "ideal_answer":"Use two pointers — left at start, right at end. Compare characters. If mismatch return false. If all match return true. Ignore case and non-alphanumeric for real palindrome check. O(n) time, O(1) space. Alternatively reverse string and compare.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"strings","subtopic":"anagram","difficulty":"beginner","type":"technical","tags":"strings,hashing,anagram","companies":"Amazon,Google",
     "question_text":"How do you check if two strings are anagrams of each other?",
     "ideal_answer":"Count frequency of each character in both strings using a hash map or array of size 26. If all frequencies match, they are anagrams. Alternatively sort both strings and compare. Frequency approach is O(n) time O(1) space. Sort approach is O(n log n).",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"strings","subtopic":"sliding_window","difficulty":"intermediate","type":"technical","tags":"strings,sliding_window","companies":"Amazon,Facebook",
     "question_text":"How do you find the longest substring without repeating characters?",
     "ideal_answer":"Sliding window with hash map tracking last seen index of each character. Left pointer marks window start. For each character, if already in window, move left to max of current left and last_seen+1. Update last_seen and max length. O(n) time O(min(n,alphabet)) space.",
     "time_complexity":"O(n)","space_complexity":"O(min(n,k)) where k is alphabet size"},

    {"topic":"strings","subtopic":"pattern_matching","difficulty":"intermediate","type":"technical","tags":"strings,kmp,pattern","companies":"Google,Amazon",
     "question_text":"Explain the KMP algorithm for pattern matching.",
     "ideal_answer":"KMP avoids redundant comparisons using a failure function (LPS array). LPS stores length of longest proper prefix that is also suffix for each prefix. During search, on mismatch, use LPS to skip characters. Preprocessing O(m), search O(n). Total O(n+m) vs O(nm) naive.",
     "time_complexity":"O(n+m)","space_complexity":"O(m)"},

    {"topic":"strings","subtopic":"compression","difficulty":"intermediate","type":"technical","tags":"strings,compression","companies":"Amazon,Microsoft",
     "question_text":"How do you perform run-length encoding on a string?",
     "ideal_answer":"Traverse string counting consecutive identical characters. When character changes, append character and count to result. Example AAABBC becomes A3B2C1. If encoded is longer than original, return original. O(n) time, O(n) space.",
     "time_complexity":"O(n)","space_complexity":"O(n)"},

    {"topic":"strings","subtopic":"rotation","difficulty":"intermediate","type":"technical","tags":"strings,rotation","companies":"Amazon,Microsoft",
     "question_text":"How do you check if one string is a rotation of another?",
     "ideal_answer":"Concatenate string s1 with itself to get s1+s1. If s2 is a rotation of s1, it must appear as a substring in s1+s1. Use KMP or built-in contains check. O(n) time. Example: abc is rotation of cab since cabcab contains abc.",
     "time_complexity":"O(n)","space_complexity":"O(n)"},

    {"topic":"strings","subtopic":"advanced","difficulty":"advanced","type":"technical","tags":"strings,dp,edit_distance","companies":"Google,Amazon,Facebook",
     "question_text":"How do you find the minimum edit distance between two strings?",
     "ideal_answer":"Dynamic programming. dp[i][j] = minimum edits to convert s1[0..i] to s2[0..j]. If characters match, dp[i][j] = dp[i-1][j-1]. Else minimum of insert, delete, replace plus 1. Fill table bottom up. O(mn) time and space. Optimizable to O(min(m,n)) space.",
     "time_complexity":"O(m*n)","space_complexity":"O(m*n)"},

    {"topic":"strings","subtopic":"advanced","difficulty":"advanced","type":"technical","tags":"strings,hashing,rabin_karp","companies":"Google",
     "question_text":"How does the Rabin-Karp algorithm work for pattern matching?",
     "ideal_answer":"Uses rolling hash to find pattern in text. Compute hash of pattern and first window of text. Slide window one character at a time updating hash in O(1) using rolling hash formula. If hashes match, verify character by character. Average O(n+m), worst O(nm) due to collisions.",
     "time_complexity":"O(n+m) average","space_complexity":"O(1)"},

    {"topic":"strings","subtopic":"expert","difficulty":"expert","type":"technical","tags":"strings,dp,palindrome","companies":"Amazon,Google",
     "question_text":"How do you find the longest palindromic substring?",
     "ideal_answer":"Expand around center approach. For each character (and gap between characters), expand outward while characters match. Track maximum length palindrome found. O(n^2) time, O(1) space. Manacher's algorithm solves it in O(n) using previously computed palindrome info.",
     "time_complexity":"O(n^2) or O(n) with Manacher","space_complexity":"O(1) or O(n)"},

    # ── LINKED LIST ───────────────────────────────────────────────────────
    {"topic":"linked_list","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"linked_list,basics","companies":"Amazon,TCS",
     "question_text":"What is a linked list and how does it differ from an array?",
     "ideal_answer":"Linked list is a linear data structure where each node stores data and pointer to next node. Unlike arrays: non-contiguous memory, dynamic size, O(1) insertion at head, O(n) access. Arrays have O(1) access but O(n) insertion. Linked lists use more memory due to pointers.",
     "time_complexity":"O(n) access, O(1) insert at head","space_complexity":"O(n)"},

    {"topic":"linked_list","subtopic":"reversal","difficulty":"beginner","type":"technical","tags":"linked_list,reversal","companies":"Amazon,Microsoft",
     "question_text":"How do you reverse a singly linked list?",
     "ideal_answer":"Iterative: use three pointers prev=null, curr=head, next. At each step save next, point curr.next to prev, move prev to curr, move curr to next. When curr is null, prev is new head. O(n) time, O(1) space. Recursive: reverse rest of list, make head.next.next = head, head.next = null.",
     "time_complexity":"O(n)","space_complexity":"O(1) iterative, O(n) recursive"},

    {"topic":"linked_list","subtopic":"cycle","difficulty":"intermediate","type":"technical","tags":"linked_list,floyd,cycle","companies":"Amazon,Google,Microsoft",
     "question_text":"How do you detect a cycle in a linked list and find its start?",
     "ideal_answer":"Floyd's algorithm: slow and fast pointers both start at head. Slow moves one step, fast moves two. If they meet, cycle exists. To find cycle start: move one pointer to head, keep other at meeting point, move both one step at a time. Where they meet is cycle start. O(n) time, O(1) space.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"linked_list","subtopic":"merge","difficulty":"intermediate","type":"technical","tags":"linked_list,merge,sorting","companies":"Amazon,Facebook",
     "question_text":"How do you merge two sorted linked lists?",
     "ideal_answer":"Compare heads of both lists. Take the smaller head and recursively merge rest. Iteratively: use dummy node, compare nodes from both lists, attach smaller to result, move that pointer forward. Return dummy.next. O(n+m) time, O(1) space iteratively.",
     "time_complexity":"O(n+m)","space_complexity":"O(1) iterative"},

    {"topic":"linked_list","subtopic":"fast_slow","difficulty":"intermediate","type":"technical","tags":"linked_list,fast_slow","companies":"Amazon,Google",
     "question_text":"How do you find the middle of a linked list?",
     "ideal_answer":"Use slow and fast pointers. Slow moves one step, fast moves two. When fast reaches end, slow is at middle. For even length lists, slow will be at second middle node. O(n) time, O(1) space. More efficient than counting length then traversing again.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"linked_list","subtopic":"advanced","difficulty":"advanced","type":"technical","tags":"linked_list,reversal,groups","companies":"Amazon,Google",
     "question_text":"How do you reverse a linked list in groups of k?",
     "ideal_answer":"Reverse k nodes at a time. For each group: track previous tail, reverse k nodes, connect previous tail to new head of reversed group, update tail pointer to new tail. Recursively process next group. O(n) time, O(n/k) recursion stack space.",
     "time_complexity":"O(n)","space_complexity":"O(n/k)"},

    {"topic":"linked_list","subtopic":"lru","difficulty":"expert","type":"technical","tags":"linked_list,lru,hashing","companies":"Amazon,Google,Facebook",
     "question_text":"How do you implement an LRU Cache?",
     "ideal_answer":"Combine doubly linked list and hash map. List maintains access order (most recent at front). Map stores key to node mapping for O(1) lookup. On get: find node via map, move to front, return value. On put: if exists move to front, else add to front. If capacity exceeded, remove from back. Both operations O(1).",
     "time_complexity":"O(1) get and put","space_complexity":"O(capacity)"},

    # ── STACKS ────────────────────────────────────────────────────────────
    {"topic":"stacks","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"stacks,basics","companies":"TCS,Infosys",
     "question_text":"What is a stack and what are its main operations?",
     "ideal_answer":"Stack is a LIFO (Last In First Out) data structure. Main operations: push (add to top) O(1), pop (remove from top) O(1), peek/top (view top without removing) O(1), isEmpty O(1). Can be implemented using array or linked list. Used in function call stack, undo operations, expression evaluation.",
     "time_complexity":"O(1) all operations","space_complexity":"O(n)"},

    {"topic":"stacks","subtopic":"parentheses","difficulty":"beginner","type":"technical","tags":"stacks,parentheses","companies":"Amazon,Microsoft",
     "question_text":"How do you check if parentheses in a string are balanced?",
     "ideal_answer":"Use a stack. For each character: if opening bracket push to stack. If closing bracket check if stack is empty (unbalanced) or top doesn't match (unbalanced), else pop. After traversal, if stack is empty, balanced. Handles (), [], {}. O(n) time, O(n) space.",
     "time_complexity":"O(n)","space_complexity":"O(n)"},

    {"topic":"stacks","subtopic":"monotonic","difficulty":"intermediate","type":"technical","tags":"stacks,monotonic,nge","companies":"Amazon,Google",
     "question_text":"How do you find the next greater element for each array element?",
     "ideal_answer":"Use monotonic decreasing stack. Traverse from right to left. For each element, pop stack while top is smaller or equal. Top of stack is next greater element or -1 if stack empty. Push current element. O(n) time and space. Each element pushed and popped at most once.",
     "time_complexity":"O(n)","space_complexity":"O(n)"},

    {"topic":"stacks","subtopic":"histogram","difficulty":"advanced","type":"technical","tags":"stacks,histogram,area","companies":"Amazon,Google,Facebook",
     "question_text":"How do you find the largest rectangle in a histogram?",
     "ideal_answer":"Use stack to track bars. For each bar: while stack not empty and current bar is shorter than stack top, pop and calculate area with popped bar as height. Width is current index minus new stack top minus 1. Push current index. After all bars, pop remaining with right boundary as n. O(n) time, O(n) space.",
     "time_complexity":"O(n)","space_complexity":"O(n)"},

    {"topic":"stacks","subtopic":"design","difficulty":"intermediate","type":"technical","tags":"stacks,design,min_stack","companies":"Amazon,Google",
     "question_text":"How do you design a stack that supports getMin in O(1)?",
     "ideal_answer":"Maintain two stacks: main stack and min stack. On push: push to main stack. If min stack is empty or new element is smaller/equal, push to min stack too. On pop: if popped element equals min stack top, pop min stack too. getMin returns min stack top. All operations O(1).",
     "time_complexity":"O(1) all operations","space_complexity":"O(n)"},

    # ── QUEUES ────────────────────────────────────────────────────────────
    {"topic":"queues","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"queues,basics","companies":"TCS,Wipro",
     "question_text":"What is a queue and how does it differ from a stack?",
     "ideal_answer":"Queue is FIFO (First In First Out) — elements added at rear, removed from front. Stack is LIFO — elements added and removed from same end (top). Queue operations: enqueue O(1), dequeue O(1), front O(1). Used in BFS, task scheduling, printer queue. Stack used in DFS, recursion, undo.",
     "time_complexity":"O(1) all operations","space_complexity":"O(n)"},

    {"topic":"queues","subtopic":"sliding_window","difficulty":"advanced","type":"technical","tags":"queues,deque,sliding_window","companies":"Amazon,Google",
     "question_text":"How do you find the maximum in every sliding window of size k?",
     "ideal_answer":"Use monotonic deque storing indices. For each element: remove indices outside window from front. Remove smaller elements from back (they can never be maximum). Add current index to back. Front of deque is maximum of current window when window size reached. O(n) time, O(k) space.",
     "time_complexity":"O(n)","space_complexity":"O(k)"},

    {"topic":"queues","subtopic":"design","difficulty":"intermediate","type":"technical","tags":"queues,design,circular","companies":"Amazon,Microsoft",
     "question_text":"How do you implement a queue using two stacks?",
     "ideal_answer":"Use two stacks S1 and S2. Enqueue: always push to S1. Dequeue: if S2 is empty, pop all elements from S1 and push to S2, then pop from S2. This reverses order making it FIFO. Amortized O(1) dequeue since each element moves between stacks once. O(n) space.",
     "time_complexity":"O(1) amortized","space_complexity":"O(n)"},

    # ── HASHING ───────────────────────────────────────────────────────────
    {"topic":"hashing","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"hashing,basics","companies":"Amazon,Microsoft",
     "question_text":"What is hashing and what is a hash collision?",
     "ideal_answer":"Hashing maps keys to indices using a hash function. A good hash function distributes keys uniformly. Collision occurs when two different keys map to same index. Collision resolution: chaining (linked list at each slot) or open addressing (linear probing, quadratic probing, double hashing). Average O(1) operations.",
     "time_complexity":"O(1) average, O(n) worst","space_complexity":"O(n)"},

    {"topic":"hashing","subtopic":"frequency","difficulty":"beginner","type":"technical","tags":"hashing,frequency","companies":"Amazon,Google",
     "question_text":"How do you find the first non-repeating character in a string?",
     "ideal_answer":"Two-pass solution. First pass: count frequency of each character using hash map. Second pass: iterate string and return first character with frequency 1. O(n) time, O(1) space (at most 26 lowercase letters in map). Alternatively use LinkedHashMap to maintain insertion order.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"hashing","subtopic":"subarray","difficulty":"intermediate","type":"technical","tags":"hashing,prefix_sum,subarray","companies":"Amazon,Google,Facebook",
     "question_text":"How do you find the number of subarrays with sum equal to K?",
     "ideal_answer":"Use prefix sum with hash map. Map stores count of each prefix sum seen. For each element, compute prefix sum. Check if prefix_sum - k exists in map and add its count to result. Then add current prefix sum to map. Handles negative numbers. O(n) time, O(n) space.",
     "time_complexity":"O(n)","space_complexity":"O(n)"},

    {"topic":"hashing","subtopic":"advanced","difficulty":"advanced","type":"technical","tags":"hashing,grouping","companies":"Google,Amazon",
     "question_text":"How do you group all anagrams from a list of strings together?",
     "ideal_answer":"Sort each string to get a canonical key. Strings that are anagrams will have same sorted key. Use hash map with sorted string as key and list of original strings as value. Group all strings by their sorted form. O(n * k log k) where n is number of strings, k is max string length.",
     "time_complexity":"O(n * k log k)","space_complexity":"O(n * k)"},

    # ── RECURSION ─────────────────────────────────────────────────────────
    {"topic":"recursion","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"recursion,basics","companies":"Amazon,TCS",
     "question_text":"What is recursion? What are the essential components?",
     "ideal_answer":"Recursion is a technique where a function calls itself to solve a smaller version of the same problem. Essential components: base case (stopping condition to prevent infinite recursion), recursive case (function calling itself with smaller input), progress toward base case. Each call adds a frame to call stack.",
     "time_complexity":"Varies by problem","space_complexity":"O(depth) call stack"},

    {"topic":"recursion","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"recursion,fibonacci","companies":"TCS,Wipro",
     "question_text":"How do you compute Fibonacci numbers using recursion? What is the problem with it?",
     "ideal_answer":"fib(n) = fib(n-1) + fib(n-2) with base cases fib(0)=0, fib(1)=1. Problem: exponential time O(2^n) due to redundant overlapping subproblem calculations. Fix with memoization (store computed results) to get O(n) time, or use iterative approach with O(n) time and O(1) space.",
     "time_complexity":"O(2^n) naive, O(n) memoized","space_complexity":"O(n)"},

    {"topic":"recursion","subtopic":"divide_conquer","difficulty":"intermediate","type":"technical","tags":"recursion,divide_conquer","companies":"Amazon,Microsoft",
     "question_text":"What is divide and conquer? Give an example.",
     "ideal_answer":"Divide and conquer splits problem into independent subproblems, solves them recursively, combines results. Example: Merge Sort splits array in half, sorts each half recursively, merges sorted halves. Binary Search divides search space in half each time. T(n) = 2T(n/2) + O(n) gives O(n log n) by Master theorem.",
     "time_complexity":"O(n log n) for merge sort","space_complexity":"O(n)"},

    {"topic":"recursion","subtopic":"advanced","difficulty":"advanced","type":"technical","tags":"recursion,tower_of_hanoi","companies":"Google,Amazon",
     "question_text":"Explain the Tower of Hanoi problem and its recursive solution.",
     "ideal_answer":"Move n disks from source to destination using auxiliary peg. Rules: one disk at a time, larger disk never on smaller. Recursive solution: move n-1 disks from source to aux, move largest to destination, move n-1 from aux to destination. Total 2^n - 1 moves. T(n) = 2T(n-1) + 1 gives O(2^n).",
     "time_complexity":"O(2^n)","space_complexity":"O(n) stack"},

    # ── BINARY SEARCH ─────────────────────────────────────────────────────
    {"topic":"binary_search","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"binary_search,basics","companies":"Amazon,Microsoft",
     "question_text":"Explain binary search. What are the requirements for it to work?",
     "ideal_answer":"Binary search finds target in sorted array by repeatedly halving search space. Calculate mid, if target equals arr[mid] return. If target less than arr[mid] search left half, else search right half. Requires sorted array. O(log n) time, O(1) space iteratively. Recursive uses O(log n) stack space.",
     "time_complexity":"O(log n)","space_complexity":"O(1) iterative"},

    {"topic":"binary_search","subtopic":"bounds","difficulty":"intermediate","type":"technical","tags":"binary_search,lower_bound,upper_bound","companies":"Amazon,Google",
     "question_text":"What is lower bound and upper bound in binary search?",
     "ideal_answer":"Lower bound: first position where element is greater than or equal to target. Upper bound: first position where element is strictly greater than target. Both use binary search. Lower bound: if arr[mid] >= target move right to mid else left to mid+1. Used in count occurrences, insertion point problems.",
     "time_complexity":"O(log n)","space_complexity":"O(1)"},

    {"topic":"binary_search","subtopic":"search_on_answer","difficulty":"advanced","type":"technical","tags":"binary_search,search_on_answer","companies":"Google,Amazon,Facebook",
     "question_text":"What is binary search on the answer? Give an example.",
     "ideal_answer":"Binary search on answer space instead of array. For problems asking minimum/maximum satisfying a condition. Example: find minimum pages when dividing books among m students. Binary search on answer range [max_pages, total_pages]. For each mid, check if it's feasible to assign books. O(n log(sum)) time.",
     "time_complexity":"O(n log(answer_range))","space_complexity":"O(1)"},

    {"topic":"binary_search","subtopic":"peak","difficulty":"intermediate","type":"technical","tags":"binary_search,peak","companies":"Google,Facebook",
     "question_text":"How do you find a peak element in an array using binary search?",
     "ideal_answer":"Peak element is greater than its neighbors. Binary search: compute mid. If arr[mid] > arr[mid+1], peak is in left half including mid. Else peak is in right half. When left equals right, that is a peak. O(log n) time. Works because if element is smaller than neighbor, a peak must exist in that direction.",
     "time_complexity":"O(log n)","space_complexity":"O(1)"},

    # ── SORTING ───────────────────────────────────────────────────────────
    {"topic":"sorting","subtopic":"basic_sorts","difficulty":"beginner","type":"technical","tags":"sorting,bubble_sort","companies":"TCS,Wipro,Infosys",
     "question_text":"Explain bubble sort. What is its time complexity?",
     "ideal_answer":"Bubble sort repeatedly compares adjacent elements and swaps if in wrong order. Largest element bubbles to end in each pass. n-1 passes needed. Best case O(n) if already sorted (with optimization flag). Average and worst case O(n^2). Space O(1). Stable sort. Inefficient for large data.",
     "time_complexity":"O(n^2) average, O(n) best","space_complexity":"O(1)"},

    {"topic":"sorting","subtopic":"efficient_sorts","difficulty":"intermediate","type":"technical","tags":"sorting,merge_sort","companies":"Amazon,Microsoft,Google",
     "question_text":"Explain merge sort. Why is it preferred over quicksort in certain cases?",
     "ideal_answer":"Merge sort divides array into halves, sorts each recursively, merges sorted halves. T(n) = 2T(n/2) + O(n) gives O(n log n) always. Stable sort. Uses O(n) extra space. Preferred when: stability needed, linked list sorting (O(1) space), guaranteed O(n log n) needed (quicksort is O(n^2) worst case).",
     "time_complexity":"O(n log n) always","space_complexity":"O(n)"},

    {"topic":"sorting","subtopic":"efficient_sorts","difficulty":"intermediate","type":"technical","tags":"sorting,quick_sort","companies":"Amazon,Google,Microsoft",
     "question_text":"How does quicksort work and what is its time complexity?",
     "ideal_answer":"Pick pivot, partition array so elements less than pivot go left, greater go right. Recursively sort both partitions. Average O(n log n). Worst case O(n^2) with bad pivot (sorted array with first element pivot). Fix with random pivot or median-of-three. In-place O(log n) space. Cache-friendly, faster in practice.",
     "time_complexity":"O(n log n) average, O(n^2) worst","space_complexity":"O(log n)"},

    {"topic":"sorting","subtopic":"non_comparison","difficulty":"advanced","type":"technical","tags":"sorting,counting_sort,radix_sort","companies":"Amazon,Google",
     "question_text":"What is counting sort and when do you use it?",
     "ideal_answer":"Counting sort counts occurrences of each element, computes cumulative counts to determine positions, places elements in output array. O(n+k) time and space where k is range of input. Not comparison-based so beats O(n log n) barrier. Use when range k is small and known. Stable sort.",
     "time_complexity":"O(n+k)","space_complexity":"O(n+k)"},

    # ── TWO POINTERS ──────────────────────────────────────────────────────
    {"topic":"two_pointers","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"two_pointers,basics","companies":"Amazon,Microsoft",
     "question_text":"What is the two-pointer technique and when is it applicable?",
     "ideal_answer":"Two pointers use two indices moving through data structure to reduce O(n^2) brute force to O(n). Applicable when: array/string is sorted, looking for pairs or triplets, partitioning array, palindrome checking. Types: opposite direction (one at each end) and same direction (slow and fast pointer).",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"two_pointers","subtopic":"intermediate","difficulty":"intermediate","type":"technical","tags":"two_pointers,container","companies":"Amazon,Google,Facebook",
     "question_text":"How do you solve the container with most water problem?",
     "ideal_answer":"Two pointers at both ends. Area = min(height[left], height[right]) * (right - left). Move the pointer with smaller height inward since that limits the water. The other pointer staying might give larger area. Track maximum area. O(n) time, O(1) space.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    # ── SLIDING WINDOW ────────────────────────────────────────────────────
    {"topic":"sliding_window","subtopic":"fixed","difficulty":"intermediate","type":"technical","tags":"sliding_window,fixed","companies":"Amazon,Microsoft",
     "question_text":"How do you find the maximum sum subarray of size k?",
     "ideal_answer":"Create window of first k elements and compute sum. Slide window by adding next element and removing first element of previous window. Track maximum sum. O(n) time, O(1) space. Much better than O(nk) brute force of recomputing sum each time.",
     "time_complexity":"O(n)","space_complexity":"O(1)"},

    {"topic":"sliding_window","subtopic":"variable","difficulty":"advanced","type":"technical","tags":"sliding_window,variable,minimum","companies":"Amazon,Google,Facebook",
     "question_text":"How do you find the minimum window substring containing all characters of pattern?",
     "ideal_answer":"Sliding window with two frequency maps. Expand right to include pattern characters. When all characters covered, try shrinking from left to minimize window. Track minimum valid window found. O(n+m) time, O(k) space where k is alphabet size. Use have and need counters to check validity efficiently.",
     "time_complexity":"O(n+m)","space_complexity":"O(k)"},

    # ══════════════════════════════════════════════════════════════════════
    # TIER 2 DSA
    # ══════════════════════════════════════════════════════════════════════

    # ── BACKTRACKING ──────────────────────────────────────────────────────
    {"topic":"backtracking","subtopic":"basics","difficulty":"intermediate","type":"technical","tags":"backtracking,basics","companies":"Amazon,Google",
     "question_text":"What is backtracking? How is it different from recursion?",
     "ideal_answer":"Backtracking is algorithmic technique that builds solution incrementally and abandons (backtracks) when current path cannot lead to valid solution. All recursion is not backtracking, but all backtracking uses recursion. Backtracking adds constraint checking. Used in problems with multiple choices at each step.",
     "time_complexity":"Exponential in worst case","space_complexity":"O(depth)"},

    {"topic":"backtracking","subtopic":"permutations","difficulty":"intermediate","type":"technical","tags":"backtracking,permutations","companies":"Amazon,Microsoft,Google",
     "question_text":"How do you generate all permutations of an array?",
     "ideal_answer":"Backtracking: for each position, try each unused element. Mark element as used, recurse for next position, unmark (backtrack). Or swap current element with each element from current index to end, recurse, swap back. O(n! * n) time for n! permutations each of length n. O(n) space.",
     "time_complexity":"O(n! * n)","space_complexity":"O(n)"},

    {"topic":"backtracking","subtopic":"subsets","difficulty":"intermediate","type":"technical","tags":"backtracking,subsets","companies":"Amazon,Google,Facebook",
     "question_text":"How do you generate all subsets of a set?",
     "ideal_answer":"For each element, two choices: include or exclude. Backtracking: at each index decide include or not, recurse for next index. Total 2^n subsets. Can also use bitmask: for i from 0 to 2^n-1, each bit represents inclusion of element. O(2^n * n) time for generating all subsets.",
     "time_complexity":"O(2^n * n)","space_complexity":"O(n)"},

    {"topic":"backtracking","subtopic":"n_queens","difficulty":"advanced","type":"technical","tags":"backtracking,n_queens","companies":"Amazon,Google",
     "question_text":"Explain the N-Queens problem and its backtracking solution.",
     "ideal_answer":"Place N queens on NxN board so no two queens attack each other. Place queen row by row. For each row try each column. Check if position is safe (no queen in same column, upper-left diagonal, upper-right diagonal). If safe place queen and recurse to next row. If all rows placed, add solution. Backtrack if stuck.",
     "time_complexity":"O(n!)","space_complexity":"O(n)"},

    # ── TREES ─────────────────────────────────────────────────────────────
    {"topic":"trees","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"trees,basics","companies":"Amazon,Microsoft,Google",
     "question_text":"What is a binary tree? What are its types?",
     "ideal_answer":"Binary tree has each node with at most two children (left and right). Types: Full binary tree (every node has 0 or 2 children), Complete binary tree (all levels full except last, filled left to right), Perfect binary tree (all levels completely filled), Balanced binary tree (height difference between subtrees at most 1).",
     "time_complexity":"N/A","space_complexity":"O(n)"},

    {"topic":"trees","subtopic":"traversal","difficulty":"beginner","type":"technical","tags":"trees,traversal,dfs","companies":"Amazon,Google,Microsoft",
     "question_text":"Explain the four types of tree traversal.",
     "ideal_answer":"Inorder (Left-Root-Right): gives sorted sequence for BST. Preorder (Root-Left-Right): used to copy or serialize tree. Postorder (Left-Right-Root): used to delete tree, evaluate expressions. Level order (BFS): uses queue, processes level by level. All take O(n) time and O(h) space where h is tree height.",
     "time_complexity":"O(n)","space_complexity":"O(h)"},

    {"topic":"trees","subtopic":"lca","difficulty":"intermediate","type":"technical","tags":"trees,lca","companies":"Amazon,Google,Facebook",
     "question_text":"How do you find the Lowest Common Ancestor (LCA) of two nodes in a binary tree?",
     "ideal_answer":"Recursive approach: if root is null or equals p or q, return root. Recursively find LCA in left and right subtrees. If both return non-null, current root is LCA. If only one returns non-null, that is the LCA. O(n) time, O(h) space. For BST: if both nodes less than root go left, both greater go right, else root is LCA.",
     "time_complexity":"O(n)","space_complexity":"O(h)"},

    {"topic":"trees","subtopic":"diameter","difficulty":"intermediate","type":"technical","tags":"trees,diameter","companies":"Amazon,Facebook",
     "question_text":"How do you find the diameter of a binary tree?",
     "ideal_answer":"Diameter is longest path between any two nodes (may not pass through root). For each node, diameter through it = left_height + right_height. Use DFS returning height while tracking maximum diameter globally. O(n) time, O(h) space. The diameter at each node is left_height + right_height.",
     "time_complexity":"O(n)","space_complexity":"O(h)"},

    {"topic":"trees","subtopic":"advanced","difficulty":"advanced","type":"technical","tags":"trees,serialization","companies":"Facebook,Amazon,Google",
     "question_text":"How do you serialize and deserialize a binary tree?",
     "ideal_answer":"Serialize: BFS or DFS preorder traversal, record null nodes as special marker. Deserialize: rebuild tree using same traversal order, use queue for BFS. Preorder serialize: root, then left subtree, then right subtree with null markers. O(n) time and space. Allows tree to be stored and reconstructed.",
     "time_complexity":"O(n)","space_complexity":"O(n)"},

    # ── BST ───────────────────────────────────────────────────────────────
    {"topic":"bst","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"bst,basics","companies":"Amazon,Microsoft,Google",
     "question_text":"What is a Binary Search Tree and what are its properties?",
     "ideal_answer":"BST is a binary tree where for each node: all nodes in left subtree are smaller, all nodes in right subtree are larger. Inorder traversal gives sorted sequence. Search, insert, delete are O(log n) average for balanced BST, O(n) worst case for skewed. No duplicate keys typically.",
     "time_complexity":"O(log n) average, O(n) worst","space_complexity":"O(n)"},

    {"topic":"bst","subtopic":"validation","difficulty":"intermediate","type":"technical","tags":"bst,validation","companies":"Amazon,Microsoft",
     "question_text":"How do you validate if a binary tree is a valid BST?",
     "ideal_answer":"Pass min and max bounds to each node. Root has bounds (-infinity, +infinity). Left child gets (min, root.val). Right child gets (root.val, max). If any node violates its bounds return false. O(n) time, O(h) space. Simply checking left < root < right is wrong as it doesn't account for ancestral constraints.",
     "time_complexity":"O(n)","space_complexity":"O(h)"},

    {"topic":"bst","subtopic":"kth_smallest","difficulty":"intermediate","type":"technical","tags":"bst,inorder,kth","companies":"Amazon,Google",
     "question_text":"How do you find the Kth smallest element in a BST?",
     "ideal_answer":"Inorder traversal of BST gives sorted order. Do inorder traversal counting nodes visited. When count equals k, return current node value. O(n) time worst case, O(h) space. Optimized with augmented BST storing subtree sizes for O(log n) but requires modifying BST structure.",
     "time_complexity":"O(n)","space_complexity":"O(h)"},

    # ── HEAPS ─────────────────────────────────────────────────────────────
    {"topic":"heaps","subtopic":"basics","difficulty":"intermediate","type":"technical","tags":"heaps,priority_queue,basics","companies":"Amazon,Google,Microsoft",
     "question_text":"What is a heap? Explain min-heap and max-heap.",
     "ideal_answer":"Heap is a complete binary tree satisfying heap property. Min-heap: parent is smaller than or equal to children, root is minimum. Max-heap: parent is larger than or equal to children, root is maximum. Implemented as array. For node at index i: left child at 2i+1, right at 2i+2, parent at (i-1)/2. Insert and delete O(log n).",
     "time_complexity":"O(log n) insert/delete, O(1) peek","space_complexity":"O(n)"},

    {"topic":"heaps","subtopic":"top_k","difficulty":"intermediate","type":"technical","tags":"heaps,top_k","companies":"Amazon,Google,Facebook",
     "question_text":"How do you find the K largest elements in an array?",
     "ideal_answer":"Use min-heap of size k. Add first k elements. For remaining elements, if current is larger than heap top, pop and push current. Final heap contains k largest. O(n log k) time, O(k) space. Better than sorting O(n log n) when k is small. Alternatively use max-heap and pop k times: O(n + k log n).",
     "time_complexity":"O(n log k)","space_complexity":"O(k)"},

    {"topic":"heaps","subtopic":"median","difficulty":"advanced","type":"technical","tags":"heaps,median,two_heaps","companies":"Google,Amazon,Facebook",
     "question_text":"How do you find the median of a data stream?",
     "ideal_answer":"Use two heaps: max-heap for lower half, min-heap for upper half. Keep them balanced (size difference at most 1). On insert: add to max-heap, then move max-heap top to min-heap. If min-heap size exceeds max-heap, move min-heap top to max-heap. Median is top of larger heap or average of both tops. O(log n) insert, O(1) median.",
     "time_complexity":"O(log n) insert, O(1) median","space_complexity":"O(n)"},

    # ── GRAPHS ────────────────────────────────────────────────────────────
    {"topic":"graphs","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"graphs,basics,representation","companies":"Amazon,Google,Microsoft",
     "question_text":"What is a graph and how can it be represented?",
     "ideal_answer":"Graph is collection of vertices (nodes) and edges. Types: directed/undirected, weighted/unweighted, cyclic/acyclic. Representations: adjacency matrix O(V^2) space good for dense graphs, adjacency list O(V+E) space good for sparse graphs, edge list O(E). Most real-world graphs use adjacency list.",
     "time_complexity":"N/A","space_complexity":"O(V+E) adjacency list"},

    {"topic":"graphs","subtopic":"bfs","difficulty":"intermediate","type":"technical","tags":"graphs,bfs,shortest_path","companies":"Amazon,Google,Facebook",
     "question_text":"How does BFS work on a graph and what is it used for?",
     "ideal_answer":"BFS explores graph level by level using a queue. Start at source, mark visited, add neighbors to queue. Process queue: dequeue node, enqueue unvisited neighbors, mark visited. O(V+E) time and space. Used for: shortest path in unweighted graphs, level order traversal, connected components, bipartite check.",
     "time_complexity":"O(V+E)","space_complexity":"O(V)"},

    {"topic":"graphs","subtopic":"dfs","difficulty":"intermediate","type":"technical","tags":"graphs,dfs","companies":"Amazon,Google,Microsoft",
     "question_text":"How does DFS work and what problems does it solve?",
     "ideal_answer":"DFS explores as deep as possible before backtracking. Use recursion or explicit stack. Mark node visited, explore each unvisited neighbor recursively. O(V+E) time and space. Used for: topological sort, cycle detection, connected components, path finding, maze solving, strongly connected components.",
     "time_complexity":"O(V+E)","space_complexity":"O(V)"},

    {"topic":"graphs","subtopic":"cycle","difficulty":"intermediate","type":"technical","tags":"graphs,cycle_detection","companies":"Amazon,Microsoft",
     "question_text":"How do you detect a cycle in directed and undirected graphs?",
     "ideal_answer":"Undirected: DFS tracking parent. If neighbor is visited and not parent, cycle exists. Or use Union-Find. Directed: DFS with three states (white=unvisited, gray=in progress, black=done). If gray node reached, cycle exists (back edge). O(V+E) time, O(V) space for both.",
     "time_complexity":"O(V+E)","space_complexity":"O(V)"},

    {"topic":"graphs","subtopic":"topological","difficulty":"advanced","type":"technical","tags":"graphs,topological_sort,dag","companies":"Amazon,Google,Facebook",
     "question_text":"Explain topological sort and when it is used.",
     "ideal_answer":"Topological sort orders vertices of DAG so for every edge u->v, u comes before v. Used for task scheduling, build systems, course prerequisites. Two approaches: DFS-based (add to stack after processing all descendants, reverse) or Kahn's algorithm (process nodes with in-degree 0 using queue). Both O(V+E).",
     "time_complexity":"O(V+E)","space_complexity":"O(V)"},

    {"topic":"graphs","subtopic":"shortest_path","difficulty":"advanced","type":"technical","tags":"graphs,dijkstra,shortest_path","companies":"Google,Amazon,Facebook",
     "question_text":"How does Dijkstra's algorithm work for shortest paths?",
     "ideal_answer":"Dijkstra finds shortest path from source to all vertices in weighted graph with non-negative edges. Use min-heap (priority queue) storing (distance, vertex). Initialize all distances to infinity except source=0. Greedily pick minimum distance vertex, relax neighbors. O((V+E) log V) with min-heap. Fails with negative edges.",
     "time_complexity":"O((V+E) log V)","space_complexity":"O(V)"},

    {"topic":"graphs","subtopic":"mst","difficulty":"advanced","type":"technical","tags":"graphs,mst,kruskal,prim","companies":"Amazon,Google",
     "question_text":"What is a Minimum Spanning Tree? Explain Kruskal's algorithm.",
     "ideal_answer":"MST connects all vertices with minimum total edge weight and no cycles. Kruskal's: sort all edges by weight. For each edge in order, add to MST if it doesn't create a cycle (use Union-Find to check). Stop after V-1 edges. O(E log E) for sorting dominates. Prim's uses priority queue and is better for dense graphs.",
     "time_complexity":"O(E log E)","space_complexity":"O(V)"},

    # ── GREEDY ────────────────────────────────────────────────────────────
    {"topic":"greedy","subtopic":"basics","difficulty":"intermediate","type":"technical","tags":"greedy,basics","companies":"Amazon,Google",
     "question_text":"What is a greedy algorithm and when does it work correctly?",
     "ideal_answer":"Greedy makes locally optimal choice at each step hoping to find global optimum. Works when problem has greedy choice property (local optimal leads to global optimal) and optimal substructure. Examples where greedy works: Huffman coding, activity selection, fractional knapsack. Fails for 0/1 knapsack, shortest path with negative edges.",
     "time_complexity":"Varies","space_complexity":"Varies"},

    {"topic":"greedy","subtopic":"activity_selection","difficulty":"intermediate","type":"technical","tags":"greedy,activity_selection,intervals","companies":"Amazon,Google,Microsoft",
     "question_text":"How do you select the maximum number of non-overlapping activities?",
     "ideal_answer":"Sort activities by end time. Always pick activity with earliest end time that doesn't overlap with last selected. Greedy choice: selecting earliest ending activity leaves maximum time for remaining activities. O(n log n) for sorting, O(n) selection. This is the interval scheduling maximization problem.",
     "time_complexity":"O(n log n)","space_complexity":"O(1)"},

    {"topic":"greedy","subtopic":"advanced","difficulty":"advanced","type":"technical","tags":"greedy,huffman","companies":"Google,Amazon",
     "question_text":"How does Huffman coding work?",
     "ideal_answer":"Huffman coding creates optimal prefix codes for compression. Build min-heap of characters by frequency. Repeatedly extract two minimum nodes, create parent with sum of frequencies, insert parent back. Result is Huffman tree. Characters with higher frequency get shorter codes. O(n log n) time. Proves greedy is optimal for prefix codes.",
     "time_complexity":"O(n log n)","space_complexity":"O(n)"},

    # ── DYNAMIC PROGRAMMING ────────────────────────────────────────────────
    {"topic":"dynamic_programming","subtopic":"basics","difficulty":"intermediate","type":"technical","tags":"dp,basics,memoization","companies":"Amazon,Google,Microsoft",
     "question_text":"What is dynamic programming? What are its two approaches?",
     "ideal_answer":"DP solves problems by breaking into overlapping subproblems and storing results to avoid recomputation. Two approaches: top-down memoization (recursive with cache, natural to write) and bottom-up tabulation (iterative, fills table from base cases). DP applies when problem has optimal substructure and overlapping subproblems.",
     "time_complexity":"Varies","space_complexity":"Varies"},

    {"topic":"dynamic_programming","subtopic":"1d_dp","difficulty":"intermediate","type":"technical","tags":"dp,1d,climbing_stairs","companies":"Amazon,Microsoft,Google",
     "question_text":"How do you solve the coin change problem (minimum coins for amount)?",
     "ideal_answer":"DP where dp[i] = minimum coins to make amount i. Base case dp[0]=0. For each amount from 1 to target, try each coin. dp[i] = min(dp[i], dp[i-coin]+1) if i >= coin. Answer is dp[amount] or -1 if impossible. O(amount * coins) time, O(amount) space. Greedy fails for arbitrary coin systems.",
     "time_complexity":"O(amount * n)","space_complexity":"O(amount)"},

    {"topic":"dynamic_programming","subtopic":"knapsack","difficulty":"advanced","type":"technical","tags":"dp,knapsack","companies":"Amazon,Google,Facebook",
     "question_text":"Explain the 0/1 knapsack problem and its DP solution.",
     "ideal_answer":"Given items with weight and value, maximize value in knapsack of capacity W. dp[i][w] = max value using first i items with capacity w. If item weight > w: dp[i][w] = dp[i-1][w]. Else: max of excluding (dp[i-1][w]) or including (dp[i-1][w-weight[i]] + value[i]). O(nW) time and space. Optimizable to O(W) space.",
     "time_complexity":"O(n*W)","space_complexity":"O(n*W) or O(W)"},

    {"topic":"dynamic_programming","subtopic":"lis","difficulty":"advanced","type":"technical","tags":"dp,lis,subsequence","companies":"Amazon,Google,Microsoft",
     "question_text":"How do you find the Longest Increasing Subsequence?",
     "ideal_answer":"DP: dp[i] = length of LIS ending at index i. For each i, check all j < i. If arr[j] < arr[i], dp[i] = max(dp[i], dp[j]+1). O(n^2) time. Optimized with patience sorting and binary search: maintain array of smallest tail elements, use binary search to find position. O(n log n) time, O(n) space.",
     "time_complexity":"O(n^2) or O(n log n)","space_complexity":"O(n)"},

    {"topic":"dynamic_programming","subtopic":"lcs","difficulty":"advanced","type":"technical","tags":"dp,lcs,subsequence","companies":"Google,Amazon,Facebook",
     "question_text":"How do you find the Longest Common Subsequence of two strings?",
     "ideal_answer":"dp[i][j] = LCS length of s1[0..i] and s2[0..j]. If characters match: dp[i][j] = dp[i-1][j-1] + 1. Else: max(dp[i-1][j], dp[i][j-1]). Fill table bottom up. O(mn) time and space. Optimizable to O(min(m,n)) space. Used in diff utilities, DNA sequence alignment, file comparison.",
     "time_complexity":"O(m*n)","space_complexity":"O(m*n)"},

    {"topic":"dynamic_programming","subtopic":"expert","difficulty":"expert","type":"technical","tags":"dp,matrix_chain","companies":"Google,Amazon",
     "question_text":"What is the Matrix Chain Multiplication problem?",
     "ideal_answer":"Given chain of matrices, find optimal parenthesization minimizing scalar multiplications. dp[i][j] = min cost to multiply matrices i through j. Try all split points k from i to j-1. dp[i][j] = min(dp[i][k] + dp[k+1][j] + rows[i]*cols[k]*cols[j]). Base case dp[i][i]=0. O(n^3) time, O(n^2) space.",
     "time_complexity":"O(n^3)","space_complexity":"O(n^2)"},

    # ── TRIES ─────────────────────────────────────────────────────────────
    {"topic":"tries","subtopic":"basics","difficulty":"advanced","type":"technical","tags":"tries,prefix_tree","companies":"Google,Amazon,Facebook",
     "question_text":"What is a trie and when do you use it?",
     "ideal_answer":"Trie (prefix tree) stores strings where each node represents a character. Root is empty, edges represent characters, nodes marked as end of word. Operations: insert, search, startsWith all O(L) where L is word length. Used for autocomplete, spell check, IP routing, prefix matching. Space O(alphabet_size * L * N) words.",
     "time_complexity":"O(L) insert/search","space_complexity":"O(alphabet * total_chars)"},

    {"topic":"tries","subtopic":"autocomplete","difficulty":"advanced","type":"technical","tags":"tries,autocomplete","companies":"Google,Amazon,Facebook",
     "question_text":"How do you implement an autocomplete system using a trie?",
     "ideal_answer":"Insert all words into trie. For autocomplete: traverse to node representing prefix. Then DFS from that node collecting all words (paths to end nodes). Optimized: store top-k suggestions at each node updated during insertion. O(L) for prefix traversal, O(N) for collecting suggestions where N is nodes in subtree.",
     "time_complexity":"O(L + N)","space_complexity":"O(total_chars)"},

    # ── UNION FIND ────────────────────────────────────────────────────────
    {"topic":"union_find","subtopic":"basics","difficulty":"advanced","type":"technical","tags":"union_find,disjoint_set","companies":"Amazon,Google,Facebook",
     "question_text":"Explain Union-Find (Disjoint Set Union) data structure.",
     "ideal_answer":"Union-Find tracks elements partitioned into disjoint sets. Operations: find (which set does element belong to) and union (merge two sets). Path compression: during find, make every node point directly to root. Union by rank: attach smaller tree under larger. With both optimizations, operations are nearly O(1) amortized (O(alpha(n)) inverse Ackermann).",
     "time_complexity":"O(alpha(n)) nearly O(1)","space_complexity":"O(n)"},

    # ══════════════════════════════════════════════════════════════════════
    # OOP + SYSTEM DESIGN
    # ══════════════════════════════════════════════════════════════════════

    # ── OOP ───────────────────────────────────────────────────────────────
    {"topic":"oops","subtopic":"pillars","difficulty":"beginner","type":"technical","tags":"oops,pillars","companies":"TCS,Infosys,Wipro",
     "question_text":"What are the four pillars of OOP? Explain each briefly.",
     "ideal_answer":"Encapsulation: binding data and methods together, hiding internal state using access modifiers. Abstraction: hiding complexity, showing only essential features via abstract classes/interfaces. Inheritance: child class inherits properties and methods from parent class, promotes code reuse. Polymorphism: same interface, different implementations — method overloading and overriding.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"oops","subtopic":"inheritance","difficulty":"beginner","type":"technical","tags":"oops,inheritance","companies":"Amazon,TCS,Microsoft",
     "question_text":"What is the difference between method overloading and method overriding?",
     "ideal_answer":"Overloading (compile-time/static polymorphism): same method name, different parameters (type, number, order) in same class. Overriding (runtime/dynamic polymorphism): child class provides specific implementation of parent class method with same signature. Overloading decided at compile time, overriding at runtime using virtual dispatch.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"oops","subtopic":"abstraction","difficulty":"intermediate","type":"technical","tags":"oops,abstract,interface","companies":"Amazon,Microsoft,Google",
     "question_text":"What is the difference between an abstract class and an interface?",
     "ideal_answer":"Abstract class: can have abstract and concrete methods, instance variables, constructors, access modifiers. Single inheritance only. Interface: all methods abstract by default (Java 8+ allows default methods), no instance variables (only constants), no constructors. Multiple interfaces can be implemented. Use abstract class for IS-A relationship, interface for CAN-DO capability.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"oops","subtopic":"solid","difficulty":"intermediate","type":"technical","tags":"oops,solid,design","companies":"Amazon,Google,Microsoft",
     "question_text":"Explain the SOLID principles.",
     "ideal_answer":"S: Single Responsibility — class has one reason to change. O: Open/Closed — open for extension, closed for modification. L: Liskov Substitution — subclass should be substitutable for parent. I: Interface Segregation — many specific interfaces better than one general. D: Dependency Inversion — depend on abstractions not concretions. These principles lead to maintainable, flexible code.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"oops","subtopic":"patterns","difficulty":"advanced","type":"technical","tags":"oops,design_patterns,singleton","companies":"Amazon,Google,Microsoft",
     "question_text":"Explain the Singleton design pattern and its implementation.",
     "ideal_answer":"Singleton ensures only one instance of class exists. Implementation: private constructor (prevents direct instantiation), private static instance variable, public static getInstance method that creates instance if null and returns it. Thread-safe version uses synchronized or double-checked locking. Used for logging, database connections, configuration.",
     "time_complexity":"O(1)","space_complexity":"O(1)"},

    {"topic":"oops","subtopic":"patterns","difficulty":"advanced","type":"technical","tags":"oops,design_patterns,factory","companies":"Amazon,Google",
     "question_text":"Explain the Factory design pattern.",
     "ideal_answer":"Factory pattern provides interface for creating objects without specifying their concrete classes. Factory method: define interface for creating object, subclasses decide which class to instantiate. Abstract factory: creates families of related objects. Decouples object creation from usage. Used when exact type is determined at runtime.",
     "time_complexity":"O(1)","space_complexity":"O(1)"},

    {"topic":"oops","subtopic":"patterns","difficulty":"advanced","type":"technical","tags":"oops,design_patterns,observer","companies":"Google,Amazon,Microsoft",
     "question_text":"Explain the Observer design pattern.",
     "ideal_answer":"Observer defines one-to-many dependency. When subject changes state, all observers are notified and updated automatically. Components: Subject (maintains list of observers, notifyAll method), Observer (update interface), ConcreteObserver (implements update). Used in event systems, MVC pattern, pub-sub. Implements loose coupling between subject and observers.",
     "time_complexity":"O(n) notification","space_complexity":"O(n)"},

    # ── SYSTEM DESIGN ─────────────────────────────────────────────────────
    {"topic":"system_design","subtopic":"basics","difficulty":"intermediate","type":"technical","tags":"system_design,scalability","companies":"Amazon,Google,Facebook,Microsoft",
     "question_text":"What is horizontal vs vertical scaling?",
     "ideal_answer":"Vertical scaling (scale up): add more resources (CPU, RAM) to existing machine. Simple but has hardware limits and single point of failure. Horizontal scaling (scale out): add more machines to distribute load. More complex, requires load balancer, but unlimited theoretical capacity and better fault tolerance. Most distributed systems use horizontal scaling.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"system_design","subtopic":"caching","difficulty":"intermediate","type":"technical","tags":"system_design,caching,redis","companies":"Amazon,Google,Facebook",
     "question_text":"What is caching and what are common cache eviction policies?",
     "ideal_answer":"Caching stores frequently accessed data in fast memory (RAM) to reduce database load and latency. Eviction policies when cache full: LRU (Least Recently Used) — evict least recently accessed, LFU (Least Frequently Used) — evict least accessed overall, FIFO — evict oldest entry, TTL — evict after time expires. Redis and Memcached are popular cache systems.",
     "time_complexity":"O(1) cache access","space_complexity":"O(cache_size)"},

    {"topic":"system_design","subtopic":"url_shortener","difficulty":"advanced","type":"technical","tags":"system_design,url_shortener","companies":"Amazon,Google,Facebook",
     "question_text":"How would you design a URL shortener like bit.ly?",
     "ideal_answer":"Components: hash function (base62 encode) to generate 6-7 char short code from URL, key-value store (Redis for cache, SQL/NoSQL for persistence) mapping short to long URL, redirect service returning 301/302. Handle collisions by appending counter. Scale with: read replicas, CDN for redirects, rate limiting. 301 is permanent (browser caches), 302 temporary.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"system_design","subtopic":"rate_limiter","difficulty":"advanced","type":"technical","tags":"system_design,rate_limiting","companies":"Amazon,Google,Stripe",
     "question_text":"How do you design a rate limiter?",
     "ideal_answer":"Algorithms: Token Bucket (tokens added at fixed rate, request consumes token, allows bursts), Sliding Window (count requests in rolling time window), Fixed Window (count in fixed intervals, has boundary issues), Leaky Bucket (queue requests, process at fixed rate). Store counts in Redis with TTL. Return 429 Too Many Requests when limit exceeded. Distribute using consistent hashing.",
     "time_complexity":"O(1)","space_complexity":"O(users)"},

    {"topic":"system_design","subtopic":"expert","difficulty":"expert","type":"technical","tags":"system_design,distributed","companies":"Google,Amazon,Facebook",
     "question_text":"What is consistent hashing and why is it used in distributed systems?",
     "ideal_answer":"Consistent hashing maps nodes and keys to a ring using hash function. Key goes to first node clockwise on ring. Adding/removing node only remaps keys from one neighbor. Traditional hashing remaps n/m keys, consistent hashing remaps only k/n keys on average (k=keys, n=nodes). Used in distributed caches, load balancers, distributed databases like DynamoDB, Cassandra.",
     "time_complexity":"O(log n) with binary search on ring","space_complexity":"O(n+k)"},

    # ══════════════════════════════════════════════════════════════════════
    # DBMS
    # ══════════════════════════════════════════════════════════════════════
    {"topic":"dbms","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"dbms,basics","companies":"TCS,Infosys,Amazon",
     "question_text":"What is a DBMS and why do we use it instead of flat files?",
     "ideal_answer":"DBMS (Database Management System) manages organized collection of data. Advantages over flat files: data integrity constraints, concurrent access with ACID transactions, efficient querying with indexing, data redundancy reduction, security and access control, crash recovery, abstraction from physical storage. Examples: MySQL, PostgreSQL, Oracle.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"dbms","subtopic":"acid","difficulty":"intermediate","type":"technical","tags":"dbms,acid,transactions","companies":"Amazon,Google,Microsoft",
     "question_text":"Explain ACID properties of database transactions.",
     "ideal_answer":"Atomicity: transaction is all-or-nothing, if any part fails entire transaction rolls back. Consistency: transaction brings database from one valid state to another, maintaining all constraints. Isolation: concurrent transactions appear sequential, one doesn't see intermediate state of another. Durability: committed transactions persist even after system failure using write-ahead logging.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"dbms","subtopic":"normalization","difficulty":"intermediate","type":"technical","tags":"dbms,normalization,normal_forms","companies":"TCS,Amazon,Microsoft",
     "question_text":"What is normalization? Explain 1NF, 2NF, and 3NF.",
     "ideal_answer":"Normalization reduces data redundancy and improves integrity. 1NF: atomic values in each column, no repeating groups, each column has unique name. 2NF: 1NF + no partial dependency (non-key attributes depend on whole composite primary key). 3NF: 2NF + no transitive dependency (non-key attributes depend only on primary key not on other non-key attributes).",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"dbms","subtopic":"sql","difficulty":"beginner","type":"technical","tags":"dbms,sql,basics","companies":"TCS,Wipro,Amazon",
     "question_text":"What is the difference between WHERE and HAVING in SQL?",
     "ideal_answer":"WHERE filters rows before grouping — cannot use aggregate functions. HAVING filters groups after GROUP BY — can use aggregate functions like COUNT, SUM, AVG. Example: WHERE salary > 50000 filters individual rows. HAVING COUNT(*) > 5 filters groups with more than 5 rows. WHERE is applied first in execution order.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"dbms","subtopic":"sql","difficulty":"intermediate","type":"technical","tags":"dbms,sql,joins","companies":"Amazon,Microsoft,Google",
     "question_text":"Explain the different types of SQL joins.",
     "ideal_answer":"INNER JOIN: only matching rows from both tables. LEFT JOIN: all rows from left table, matching from right (NULL if no match). RIGHT JOIN: all rows from right, matching from left. FULL OUTER JOIN: all rows from both, NULL where no match. CROSS JOIN: cartesian product. SELF JOIN: table joined with itself. Use cases differ based on whether you need unmatched rows.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"dbms","subtopic":"indexing","difficulty":"intermediate","type":"technical","tags":"dbms,indexing,btree","companies":"Amazon,Google,Microsoft",
     "question_text":"What is a database index and how does it work?",
     "ideal_answer":"Index is data structure that speeds up data retrieval at cost of additional storage and slower writes. B-tree index: balanced tree with sorted keys, O(log n) search. Used for range queries, equality, sorting. Hash index: O(1) equality search, no range queries. Clustered index: table data physically sorted by index. Non-clustered: separate structure with pointer to row. Too many indexes slow down inserts/updates.",
     "time_complexity":"O(log n) B-tree","space_complexity":"O(n)"},

    {"topic":"dbms","subtopic":"advanced","difficulty":"advanced","type":"technical","tags":"dbms,transactions,deadlock","companies":"Amazon,Google,Oracle",
     "question_text":"What is a deadlock in DBMS and how can it be prevented?",
     "ideal_answer":"Deadlock: two transactions each waiting for lock held by other, neither can proceed. Necessary conditions (Coffman): mutual exclusion, hold and wait, no preemption, circular wait. Prevention: lock ordering (always acquire locks in same order), timeout (abort if waiting too long), deadlock detection and recovery (kill one transaction), two-phase locking.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"dbms","subtopic":"expert","difficulty":"expert","type":"technical","tags":"dbms,cap_theorem,distributed","companies":"Amazon,Google,Facebook",
     "question_text":"Explain the CAP theorem.",
     "ideal_answer":"CAP theorem states distributed system can guarantee only 2 of 3: Consistency (all nodes see same data simultaneously), Availability (every request gets a response), Partition Tolerance (system continues despite network partition). Since partitions are unavoidable in distributed systems, choose CA (not scalable), CP (MongoDB, HBase — sacrifice availability), or AP (Cassandra, DynamoDB — sacrifice strong consistency).",
     "time_complexity":"N/A","space_complexity":"N/A"},

    # ══════════════════════════════════════════════════════════════════════
    # OS + NETWORKING
    # ══════════════════════════════════════════════════════════════════════
    {"topic":"os_cn","subtopic":"os_basics","difficulty":"beginner","type":"technical","tags":"os,basics,process","companies":"TCS,Amazon,Microsoft",
     "question_text":"What is the difference between a process and a thread?",
     "ideal_answer":"Process: independent program in execution with own memory space, resources, and PCB. Heavyweight, isolation means crash doesn't affect others. Thread: lightweight unit within a process sharing same memory and resources. Faster context switch, can communicate via shared memory. One process can have many threads. Context switch between processes is expensive vs threads.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"os_cn","subtopic":"scheduling","difficulty":"intermediate","type":"technical","tags":"os,scheduling,cpu","companies":"Amazon,Microsoft,Google",
     "question_text":"Explain CPU scheduling algorithms.",
     "ideal_answer":"FCFS (First Come First Serve): simple, convoy effect. SJF (Shortest Job First): minimum average wait time, can starve long processes. Round Robin: preemptive, each process gets time quantum, good response time. Priority Scheduling: highest priority runs first, starvation possible, use aging. MLFQ (Multi-Level Feedback Queue): combines multiple queues, adaptive. Modern OSes use complex algorithms combining these.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"os_cn","subtopic":"memory","difficulty":"intermediate","type":"technical","tags":"os,memory,paging","companies":"Amazon,Google,Microsoft",
     "question_text":"What is paging in operating systems?",
     "ideal_answer":"Paging divides physical memory into fixed-size frames and logical memory into same-size pages. Eliminates external fragmentation. Page table maps logical page numbers to physical frame numbers. MMU translates virtual to physical addresses. TLB (Translation Lookaside Buffer) caches recent translations for O(1) access. Page fault occurs when page not in memory, trigger page replacement.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"os_cn","subtopic":"deadlock","difficulty":"intermediate","type":"technical","tags":"os,deadlock","companies":"Amazon,Microsoft,Google",
     "question_text":"What is deadlock and what are the four necessary conditions?",
     "ideal_answer":"Deadlock: set of processes permanently blocked waiting for resources. Four necessary conditions (all must hold): Mutual Exclusion (resource held exclusively), Hold and Wait (process holds resources while waiting for more), No Preemption (resources cannot be forcibly taken), Circular Wait (circular chain of processes each waiting for next). Prevention breaks any one condition.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"os_cn","subtopic":"networking","difficulty":"intermediate","type":"technical","tags":"networking,tcp_ip,http","companies":"Amazon,Google,Facebook",
     "question_text":"What happens when you type a URL in a browser and press Enter?",
     "ideal_answer":"DNS lookup (cache, resolver, root, TLD, authoritative server) to get IP. TCP three-way handshake (SYN, SYN-ACK, ACK). If HTTPS, TLS handshake. Browser sends HTTP GET request. Server processes and returns HTTP response. Browser parses HTML, fetches CSS/JS/images, renders DOM, applies styles, executes JS. Page displayed. Connection kept alive or closed.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"os_cn","subtopic":"networking","difficulty":"intermediate","type":"technical","tags":"networking,tcp,udp","companies":"Amazon,Google,Microsoft",
     "question_text":"What is the difference between TCP and UDP?",
     "ideal_answer":"TCP: connection-oriented, reliable delivery with acknowledgments, ordered packets, error checking, flow control and congestion control, three-way handshake. Higher overhead. Used for HTTP, email, FTP. UDP: connectionless, no guaranteed delivery, no ordering, no handshake, lower latency overhead. Used for video streaming, DNS, gaming, VoIP where speed matters more than reliability.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"os_cn","subtopic":"advanced","difficulty":"advanced","type":"technical","tags":"networking,http,rest","companies":"Amazon,Google,Facebook",
     "question_text":"What is REST and what are its core principles?",
     "ideal_answer":"REST (Representational State Transfer) is architectural style for distributed systems. Principles: Stateless (each request contains all information needed), Client-Server (separation of concerns), Cacheable (responses indicate cacheability), Uniform Interface (standard HTTP methods GET/POST/PUT/DELETE, resources identified by URI), Layered System. HTTP methods: GET (read), POST (create), PUT/PATCH (update), DELETE.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    # ══════════════════════════════════════════════════════════════════════
    # ML / AI
    # ══════════════════════════════════════════════════════════════════════
    {"topic":"ml_ai","subtopic":"basics","difficulty":"beginner","type":"technical","tags":"ml,basics,supervised","companies":"Google,Amazon,Microsoft",
     "question_text":"What is the difference between supervised, unsupervised, and reinforcement learning?",
     "ideal_answer":"Supervised: learn from labeled data, predict output for new inputs. Examples: classification (spam detection), regression (house price). Unsupervised: find patterns in unlabeled data. Examples: clustering (K-means), dimensionality reduction (PCA). Reinforcement: agent learns by interacting with environment, maximizing reward signal. Examples: game playing, robotics. Semi-supervised combines labeled and unlabeled data.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"ml_ai","subtopic":"overfitting","difficulty":"intermediate","type":"technical","tags":"ml,overfitting,regularization","companies":"Google,Amazon,Microsoft",
     "question_text":"What is overfitting and how do you prevent it?",
     "ideal_answer":"Overfitting: model learns training data too well including noise, performs poorly on unseen data. High variance, low bias. Prevention: more training data, regularization (L1/L2 add penalty term), dropout (randomly disable neurons during training), early stopping (stop when validation loss increases), cross-validation, simpler model architecture, data augmentation.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"ml_ai","subtopic":"metrics","difficulty":"intermediate","type":"technical","tags":"ml,metrics,evaluation","companies":"Google,Amazon,Microsoft",
     "question_text":"Explain precision, recall, F1 score, and when to use each.",
     "ideal_answer":"Precision = TP/(TP+FP): of all predicted positives, how many are correct. Recall = TP/(TP+FN): of all actual positives, how many did we catch. F1 = 2*(P*R)/(P+R): harmonic mean balancing both. Use precision when false positives costly (spam detection). Use recall when false negatives costly (cancer detection). Use F1 for imbalanced classes.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"ml_ai","subtopic":"algorithms","difficulty":"intermediate","type":"technical","tags":"ml,algorithms,linear_regression","companies":"Amazon,Google,Microsoft",
     "question_text":"How does linear regression work and what are its assumptions?",
     "ideal_answer":"Linear regression models relationship between dependent variable y and independent variables X as y = wX + b. Minimize MSE loss using gradient descent or closed-form solution (normal equation). Assumptions: linearity, independence of errors, homoscedasticity (constant variance), normally distributed errors, no multicollinearity. Regularized versions: Ridge (L2) and Lasso (L1).",
     "time_complexity":"O(nd) gradient descent per step","space_complexity":"O(d)"},

    {"topic":"ml_ai","subtopic":"neural_networks","difficulty":"advanced","type":"technical","tags":"ml,neural_networks,deep_learning","companies":"Google,Amazon,Facebook,Microsoft",
     "question_text":"Explain how backpropagation works in neural networks.",
     "ideal_answer":"Backpropagation computes gradients of loss with respect to all parameters using chain rule. Forward pass: compute predictions layer by layer. Backward pass: compute loss gradient w.r.t. output, propagate gradients backward through layers using chain rule. For each layer: compute gradient w.r.t. weights and inputs. Update weights using gradient descent. O(params) per example.",
     "time_complexity":"O(layers * neurons^2)","space_complexity":"O(params)"},

    {"topic":"ml_ai","subtopic":"neural_networks","difficulty":"advanced","type":"technical","tags":"ml,cnn,image","companies":"Google,Amazon,Facebook",
     "question_text":"What are CNNs and why are they good for image tasks?",
     "ideal_answer":"Convolutional Neural Networks use convolutional layers that apply filters to detect local features. Key properties: local receptive field (each neuron sees small region), weight sharing (same filter applied across entire image reduces parameters), spatial hierarchy (early layers detect edges, later layers detect complex patterns). Pooling reduces spatial dimensions. Translation invariant by nature.",
     "time_complexity":"O(n * k^2 * C_in * C_out) per layer","space_complexity":"O(params)"},

    {"topic":"ml_ai","subtopic":"advanced","difficulty":"advanced","type":"technical","tags":"ml,transformers,attention","companies":"Google,Amazon,Microsoft,OpenAI",
     "question_text":"What is the attention mechanism in transformers?",
     "ideal_answer":"Attention allows model to focus on relevant parts of input when producing output. Scaled dot-product attention: compute Query, Key, Value matrices from input. Attention scores = softmax(QK^T / sqrt(d_k)) * V. Multi-head attention runs multiple attention operations in parallel capturing different relationships. Transformers use self-attention where input attends to itself. O(n^2) for sequence length n.",
     "time_complexity":"O(n^2 * d)","space_complexity":"O(n^2)"},

    {"topic":"ml_ai","subtopic":"expert","difficulty":"expert","type":"technical","tags":"ml,llm,fine_tuning","companies":"Google,Amazon,Microsoft,OpenAI",
     "question_text":"What is fine-tuning an LLM and what techniques are used?",
     "ideal_answer":"Fine-tuning adapts pretrained LLM to specific task. Full fine-tuning: update all parameters, computationally expensive. PEFT (Parameter Efficient Fine Tuning): LoRA (Low Rank Adaptation) adds trainable rank decomposition matrices, trains only small fraction of parameters. Instruction tuning: fine-tune on instruction-response pairs. RLHF (Reinforcement Learning from Human Feedback): align model behavior with human preferences.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    # ── BEHAVIORAL (HR) ───────────────────────────────────────────────────
    {"topic":"behavioral","subtopic":"introduction","difficulty":"beginner","type":"hr","tags":"hr,introduction","companies":"All",
     "question_text":"Tell me about yourself.",
     "ideal_answer":"Clear, structured introduction: start with current status (student/professional), mention key skills and tech stack, highlight 1-2 significant projects with impact, state career goals aligned with the role. Keep it 2-3 minutes. End with why you are excited about this opportunity. Confident, enthusiastic, relevant.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"behavioral","subtopic":"strengths","difficulty":"beginner","type":"hr","tags":"hr,strengths","companies":"All",
     "question_text":"What are your greatest strengths and weaknesses?",
     "ideal_answer":"Strength: choose one directly relevant to role, give specific example showing it in action, quantify impact if possible. Weakness: be genuine (not fake weakness), show self-awareness, explain steps you are actively taking to improve. Shows honesty and growth mindset. Avoid cliche strengths like hardworking and weaknesses like perfectionist.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"behavioral","subtopic":"challenges","difficulty":"intermediate","type":"hr","tags":"hr,star_method,challenges","companies":"Amazon,Google,Microsoft",
     "question_text":"Tell me about a challenging problem you solved.",
     "ideal_answer":"Use STAR method: Situation (context and background), Task (what you were responsible for), Action (specific steps you took, your individual contribution), Result (measurable outcome). Focus on your personal impact. Choose example showing technical and soft skills. Amazon looks for Leadership Principles. Quantify results where possible.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"behavioral","subtopic":"teamwork","difficulty":"intermediate","type":"hr","tags":"hr,teamwork,conflict","companies":"All",
     "question_text":"How do you handle disagreements with teammates?",
     "ideal_answer":"Stay calm and listen to understand their perspective first. Acknowledge valid points. Discuss technical merits with data and examples rather than opinions. If still disagreeing, agree to prototype or test both approaches. Escalate to lead if needed. Prioritize team success over being right. Give specific example of productive disagreement resolution.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"behavioral","subtopic":"goals","difficulty":"intermediate","type":"hr","tags":"hr,goals,career","companies":"All",
     "question_text":"Where do you see yourself in 5 years?",
     "ideal_answer":"Show ambition aligned with realistic growth. For freshers: become strong contributor in 1 year, take ownership of features in 2 years, lead small team or projects in 3-4 years, architect or senior engineer in 5 years. Connect to company's growth areas. Shows commitment to role and company, not just using it as stepping stone.",
     "time_complexity":"N/A","space_complexity":"N/A"},

    {"topic":"behavioral","subtopic":"failure","difficulty":"advanced","type":"hr","tags":"hr,failure,learning","companies":"Amazon,Google,Microsoft",
     "question_text":"Tell me about a time you failed. What did you learn?",
     "ideal_answer":"Choose real failure, not something trivial. Explain context without making excuses. Take ownership clearly. Describe specific impact. Most importantly: what exactly you learned, how you changed your approach, how this learning helped you later. Shows maturity, accountability, and growth mindset which top companies value highly.",
     "time_complexity":"N/A","space_complexity":"N/A"},
]


def get_all_questions():
    return QUESTION_BANK


def get_questions_by_topic(topic: str):
    return [q for q in QUESTION_BANK if q["topic"] == topic]


def get_questions_by_difficulty(difficulty: str):
    return [q for q in QUESTION_BANK if q["difficulty"] == difficulty]


def get_topic_summary():
    summary = {}
    for q in QUESTION_BANK:
        topic = q["topic"]
        if topic not in summary:
            summary[topic] = {"total": 0, "beginner": 0, "intermediate": 0, "advanced": 0, "expert": 0}
        summary[topic]["total"] += 1
        summary[topic][q["difficulty"]] += 1
    return summary
