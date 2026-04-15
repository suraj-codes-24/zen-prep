"""
Seed script: 2 levels x 4 companies = 8 sets = 24 LeetCode-style problems.
Run: python seed_coding_v2.py
"""
import json
import models.user, models.subject, models.topic, models.subtopic
import models.question, models.interview_session, models.answer, models.coding
from database import SessionLocal, engine, Base
from models.coding import CodingProblem, CodingSet, CodingSetProblem

Base.metadata.create_all(bind=engine)

# ── Helper ────────────────────────────────────────────────────────────────────
def j(obj):
    return json.dumps(obj)


# ── PROBLEMS ──────────────────────────────────────────────────────────────────
# Each: title, description, difficulty, company, starter_code, function_name,
#        test_cases, hints, examples, constraints, tags

PROBLEMS = {
    # ═══════════════════════════════════════════════════════════════════════════
    # GOOGLE
    # ═══════════════════════════════════════════════════════════════════════════
    "Google": {
        1: [  # Level 1: Arrays
            {
                "title": "Two Sum",
                "difficulty": "easy",
                "tags": "array,hash-map",
                "function_name": "twoSum",
                "description": "Given an array of integers `nums` and an integer `target`, return the indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
                "examples": [
                    {"input": "nums = [2,7,11,15], target = 9", "output": "[0, 1]", "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."},
                    {"input": "nums = [3,2,4], target = 6", "output": "[1, 2]", "explanation": "nums[1] + nums[2] == 6."},
                    {"input": "nums = [3,3], target = 6", "output": "[0, 1]", "explanation": ""},
                ],
                "constraints": ["2 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9", "-10^9 <= target <= 10^9", "Only one valid answer exists."],
                "hints": [
                    "A brute force approach would check every pair — O(n^2). Can you do better?",
                    "Use a hash map to store numbers you've seen and their indices.",
                    "For each number, check if (target - number) exists in the map.",
                ],
                "starter_code": "def twoSum(nums, target):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": "[2,7,11,15], 9", "expected": "[0, 1]"},
                    {"input": "[3,2,4], 6", "expected": "[1, 2]"},
                    {"input": "[3,3], 6", "expected": "[0, 1]"},
                    {"input": "[1,5,3,7], 8", "expected": "[1, 2]"},
                    {"input": "[-1,-2,-3,-4,-5], -8", "expected": "[2, 4]"},
                ],
            },
            {
                "title": "Best Time to Buy and Sell Stock",
                "difficulty": "easy",
                "tags": "array,greedy",
                "function_name": "maxProfit",
                "description": "You are given an array `prices` where `prices[i]` is the price of a given stock on the `i`th day.\n\nYou want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.\n\nReturn the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return `0`.",
                "examples": [
                    {"input": "prices = [7,1,5,3,6,4]", "output": "5", "explanation": "Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6-1 = 5."},
                    {"input": "prices = [7,6,4,3,1]", "output": "0", "explanation": "No profitable transaction is possible."},
                ],
                "constraints": ["1 <= prices.length <= 10^5", "0 <= prices[i] <= 10^4"],
                "hints": [
                    "Think about tracking the minimum price seen so far.",
                    "At each step, the max profit is current price minus the minimum price so far.",
                ],
                "starter_code": "def maxProfit(prices):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": "[7,1,5,3,6,4]", "expected": "5"},
                    {"input": "[7,6,4,3,1]", "expected": "0"},
                    {"input": "[2,4,1]", "expected": "2"},
                    {"input": "[1]", "expected": "0"},
                    {"input": "[3,1,4,8,7,2,5]", "expected": "7"},
                ],
            },
            {
                "title": "Product of Array Except Self",
                "difficulty": "medium",
                "tags": "array,prefix",
                "function_name": "productExceptSelf",
                "description": "Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nThe product of any prefix or suffix of `nums` is guaranteed to fit in a 32-bit integer.\n\nYou must write an algorithm that runs in O(n) time and without using the division operation.",
                "examples": [
                    {"input": "nums = [1,2,3,4]", "output": "[24, 12, 8, 6]", "explanation": "For index 0: 2*3*4=24. For index 1: 1*3*4=12. And so on."},
                    {"input": "nums = [-1,1,0,-3,3]", "output": "[0, 0, 9, 0, 0]", "explanation": ""},
                ],
                "constraints": ["2 <= nums.length <= 10^5", "-30 <= nums[i] <= 30", "Product of any prefix/suffix fits in 32-bit integer."],
                "hints": [
                    "Think about prefix and suffix products.",
                    "First pass: build left products. Second pass: multiply by right products.",
                    "You can do this in-place using the output array for one direction.",
                ],
                "starter_code": "def productExceptSelf(nums):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": "[1,2,3,4]", "expected": "[24, 12, 8, 6]"},
                    {"input": "[-1,1,0,-3,3]", "expected": "[0, 0, 9, 0, 0]"},
                    {"input": "[2,3]", "expected": "[3, 2]"},
                    {"input": "[1,1,1,1]", "expected": "[1, 1, 1, 1]"},
                    {"input": "[5,0,2]", "expected": "[0, 10, 0]"},
                ],
            },
        ],
        2: [  # Level 2: Strings
            {
                "title": "Valid Anagram",
                "difficulty": "easy",
                "tags": "string,hash-map,sorting",
                "function_name": "isAnagram",
                "description": "Given two strings `s` and `t`, return `True` if `t` is an anagram of `s`, and `False` otherwise.\n\nAn anagram is a word or phrase formed by rearranging the letters of a different word or phrase, using all the original letters exactly once.",
                "examples": [
                    {"input": 's = "anagram", t = "nagaram"', "output": "True", "explanation": "Both contain: a(3), n(1), g(1), r(1), m(1)."},
                    {"input": 's = "rat", t = "car"', "output": "False", "explanation": "'rat' and 'car' have different character counts."},
                ],
                "constraints": ["1 <= s.length, t.length <= 5 * 10^4", "s and t consist of lowercase English letters."],
                "hints": [
                    "If the lengths differ, they can't be anagrams.",
                    "Count character frequencies in both strings and compare.",
                    "Alternatively, sort both strings and check equality.",
                ],
                "starter_code": "def isAnagram(s, t):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": '"anagram", "nagaram"', "expected": "true"},
                    {"input": '"rat", "car"', "expected": "false"},
                    {"input": '"listen", "silent"', "expected": "true"},
                    {"input": '"a", "a"', "expected": "true"},
                    {"input": '"ab", "ba"', "expected": "true"},
                ],
            },
            {
                "title": "Longest Substring Without Repeating Characters",
                "difficulty": "medium",
                "tags": "string,sliding-window,hash-map",
                "function_name": "lengthOfLongestSubstring",
                "description": "Given a string `s`, find the length of the longest substring without repeating characters.",
                "examples": [
                    {"input": 's = "abcabcbb"', "output": "3", "explanation": 'The answer is "abc", with length 3.'},
                    {"input": 's = "bbbbb"', "output": "1", "explanation": 'The answer is "b", with length 1.'},
                    {"input": 's = "pwwkew"', "output": "3", "explanation": 'The answer is "wke", with length 3.'},
                ],
                "constraints": ["0 <= s.length <= 5 * 10^4", "s consists of English letters, digits, symbols and spaces."],
                "hints": [
                    "Use a sliding window approach with two pointers.",
                    "Use a set or hashmap to track characters in the current window.",
                    "When you find a duplicate, shrink the window from the left.",
                ],
                "starter_code": "def lengthOfLongestSubstring(s):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": '"abcabcbb"', "expected": "3"},
                    {"input": '"bbbbb"', "expected": "1"},
                    {"input": '"pwwkew"', "expected": "3"},
                    {"input": '""', "expected": "0"},
                    {"input": '"dvdf"', "expected": "3"},
                ],
            },
            {
                "title": "Group Anagrams",
                "difficulty": "medium",
                "tags": "string,hash-map,sorting",
                "function_name": "groupAnagrams",
                "description": "Given an array of strings `strs`, group the anagrams together. You can return the answer in any order.\n\nAn Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
                "examples": [
                    {"input": 'strs = ["eat","tea","tan","ate","nat","bat"]', "output": '[["bat"],["nat","tan"],["ate","eat","tea"]]', "explanation": "Anagram groups: eat/tea/ate, tan/nat, bat."},
                    {"input": 'strs = [""]', "output": '[[""]]', "explanation": ""},
                ],
                "constraints": ["1 <= strs.length <= 10^4", "0 <= strs[i].length <= 100", "strs[i] consists of lowercase English letters."],
                "hints": [
                    "Two strings are anagrams if their sorted versions are equal.",
                    "Use the sorted string as a hash map key.",
                    "Group strings by their sorted key.",
                ],
                "starter_code": "def groupAnagrams(strs):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": '["eat","tea","tan","ate","nat","bat"]', "expected": '[["eat", "tea", "ate"], ["tan", "nat"], ["bat"]]'},
                    {"input": '[""]', "expected": '[[""]]'},
                    {"input": '["a"]', "expected": '[["a"]]'},
                    {"input": '["ab","ba","cd","dc"]', "expected": '[["ab", "ba"], ["cd", "dc"]]'},
                ],
            },
        ],
    },

    # ═══════════════════════════════════════════════════════════════════════════
    # AMAZON
    # ═══════════════════════════════════════════════════════════════════════════
    "Amazon": {
        1: [  # Level 1: Arrays
            {
                "title": "Contains Duplicate",
                "difficulty": "easy",
                "tags": "array,hash-set",
                "function_name": "containsDuplicate",
                "description": "Given an integer array `nums`, return `True` if any value appears at least twice in the array, and return `False` if every element is distinct.",
                "examples": [
                    {"input": "nums = [1,2,3,1]", "output": "True", "explanation": "1 appears at index 0 and 3."},
                    {"input": "nums = [1,2,3,4]", "output": "False", "explanation": "All elements are distinct."},
                    {"input": "nums = [1,1,1,3,3,4,3,2,4,2]", "output": "True", "explanation": ""},
                ],
                "constraints": ["1 <= nums.length <= 10^5", "-10^9 <= nums[i] <= 10^9"],
                "hints": [
                    "A brute-force checks every pair in O(n^2). Can you use extra space?",
                    "Use a hash set and check if an element was already added.",
                ],
                "starter_code": "def containsDuplicate(nums):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": "[1,2,3,1]", "expected": "true"},
                    {"input": "[1,2,3,4]", "expected": "false"},
                    {"input": "[1,1,1,3,3,4,3,2,4,2]", "expected": "true"},
                    {"input": "[0]", "expected": "false"},
                    {"input": "[7,7]", "expected": "true"},
                ],
            },
            {
                "title": "Maximum Subarray",
                "difficulty": "medium",
                "tags": "array,dp,divide-and-conquer",
                "function_name": "maxSubArray",
                "description": "Given an integer array `nums`, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.",
                "examples": [
                    {"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6", "explanation": "The subarray [4,-1,2,1] has the largest sum 6."},
                    {"input": "nums = [1]", "output": "1", "explanation": ""},
                    {"input": "nums = [5,4,-1,7,8]", "output": "23", "explanation": "The entire array is the subarray with max sum."},
                ],
                "constraints": ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
                "hints": [
                    "This is a classic dynamic programming / Kadane's algorithm problem.",
                    "At each index, decide: extend the current subarray or start fresh.",
                    "Track current_sum and max_sum. Reset current_sum to nums[i] if it drops below nums[i].",
                ],
                "starter_code": "def maxSubArray(nums):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6"},
                    {"input": "[1]", "expected": "1"},
                    {"input": "[5,4,-1,7,8]", "expected": "23"},
                    {"input": "[-1]", "expected": "-1"},
                    {"input": "[-2,-1]", "expected": "-1"},
                ],
            },
            {
                "title": "Merge Sorted Array",
                "difficulty": "easy",
                "tags": "array,two-pointers",
                "function_name": "merge",
                "description": "You are given two integer arrays `nums1` and `nums2`, sorted in non-decreasing order, and two integers `m` and `n`, representing the number of elements in `nums1` and `nums2` respectively.\n\nMerge `nums2` into `nums1` as one sorted array. The final sorted array should be stored inside `nums1`.\n\n`nums1` has a length of `m + n`, where the last `n` elements are set to 0 and should be ignored.",
                "examples": [
                    {"input": "nums1 = [1,2,3,0,0,0], m = 3, nums2 = [2,5,6], n = 3", "output": "[1, 2, 2, 3, 5, 6]", "explanation": "Merging [1,2,3] and [2,5,6] gives [1,2,2,3,5,6]."},
                    {"input": "nums1 = [1], m = 1, nums2 = [], n = 0", "output": "[1]", "explanation": ""},
                ],
                "constraints": ["nums1.length == m + n", "nums2.length == n", "0 <= m, n <= 200", "-10^9 <= nums1[i], nums2[j] <= 10^9"],
                "hints": [
                    "Start merging from the end of nums1 to avoid overwriting.",
                    "Use three pointers: one at end of nums1's values, one at end of nums2, one at end of nums1's capacity.",
                ],
                "starter_code": "def merge(nums1, m, nums2, n):\n    # Modify nums1 in-place\n    # Return nums1\n    pass\n",
                "test_cases": [
                    {"input": "[1,2,3,0,0,0], 3, [2,5,6], 3", "expected": "[1, 2, 2, 3, 5, 6]"},
                    {"input": "[1], 1, [], 0", "expected": "[1]"},
                    {"input": "[0], 0, [1], 1", "expected": "[1]"},
                    {"input": "[4,5,6,0,0,0], 3, [1,2,3], 3", "expected": "[1, 2, 3, 4, 5, 6]"},
                ],
            },
        ],
        2: [  # Level 2: Strings
            {
                "title": "Valid Parentheses",
                "difficulty": "easy",
                "tags": "string,stack",
                "function_name": "isValid",
                "description": "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
                "examples": [
                    {"input": 's = "()"', "output": "True", "explanation": ""},
                    {"input": 's = "()[]{}"', "output": "True", "explanation": ""},
                    {"input": 's = "(]"', "output": "False", "explanation": ""},
                ],
                "constraints": ["1 <= s.length <= 10^4", "s consists of parentheses only '()[]{}'."],
                "hints": [
                    "Use a stack. Push opening brackets, pop for closing brackets.",
                    "When you see a closing bracket, check if the top of stack matches.",
                    "At the end, the stack should be empty.",
                ],
                "starter_code": "def isValid(s):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": '"()"', "expected": "true"},
                    {"input": '"()[]{}"', "expected": "true"},
                    {"input": '"(]"', "expected": "false"},
                    {"input": '"([)]"', "expected": "false"},
                    {"input": '"{[]}"', "expected": "true"},
                ],
            },
            {
                "title": "Longest Common Prefix",
                "difficulty": "easy",
                "tags": "string",
                "function_name": "longestCommonPrefix",
                "description": "Write a function to find the longest common prefix string amongst an array of strings.\n\nIf there is no common prefix, return an empty string `\"\"`.",
                "examples": [
                    {"input": 'strs = ["flower","flow","flight"]', "output": '"fl"', "explanation": ""},
                    {"input": 'strs = ["dog","racecar","car"]', "output": '""', "explanation": "There is no common prefix."},
                ],
                "constraints": ["1 <= strs.length <= 200", "0 <= strs[i].length <= 200", "strs[i] consists of only lowercase English letters."],
                "hints": [
                    "Compare characters at each position across all strings.",
                    "Start with the first string as prefix, then shorten it.",
                    "You can also sort the array and compare only the first and last strings.",
                ],
                "starter_code": "def longestCommonPrefix(strs):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": '["flower","flow","flight"]', "expected": '"fl"'},
                    {"input": '["dog","racecar","car"]', "expected": '""'},
                    {"input": '["a"]', "expected": '"a"'},
                    {"input": '["","b"]', "expected": '""'},
                    {"input": '["cir","car"]', "expected": '"c"'},
                ],
            },
            {
                "title": "String to Integer (atoi)",
                "difficulty": "medium",
                "tags": "string,parsing",
                "function_name": "myAtoi",
                "description": "Implement the `myAtoi(string s)` function, which converts a string to a 32-bit signed integer.\n\nThe algorithm:\n1. Read in and ignore any leading whitespace.\n2. Check if the next character is `'-'` or `'+'`. Read this character if present.\n3. Read in the next characters until the next non-digit character or end of input.\n4. Convert these digits into an integer.\n5. Clamp to the 32-bit signed integer range: [-2^31, 2^31 - 1].",
                "examples": [
                    {"input": 's = "42"', "output": "42", "explanation": ""},
                    {"input": 's = "   -42"', "output": "-42", "explanation": "Leading whitespace is ignored, '-' is read."},
                    {"input": 's = "4193 with words"', "output": "4193", "explanation": "Reading stops at the space."},
                ],
                "constraints": ["0 <= s.length <= 200", "s consists of English letters, digits, ' ', '+', '-', '.'."],
                "hints": [
                    "Strip leading whitespace first.",
                    "Handle the sign character, then read digits one by one.",
                    "Don't forget to clamp to [-2^31, 2^31 - 1].",
                ],
                "starter_code": "def myAtoi(s):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": '"42"', "expected": "42"},
                    {"input": '"   -42"', "expected": "-42"},
                    {"input": '"4193 with words"', "expected": "4193"},
                    {"input": '""', "expected": "0"},
                    {"input": '"-91283472332"', "expected": "-2147483648"},
                ],
            },
        ],
    },

    # ═══════════════════════════════════════════════════════════════════════════
    # MICROSOFT
    # ═══════════════════════════════════════════════════════════════════════════
    "Microsoft": {
        1: [  # Level 1: Arrays
            {
                "title": "Move Zeroes",
                "difficulty": "easy",
                "tags": "array,two-pointers",
                "function_name": "moveZeroes",
                "description": "Given an integer array `nums`, move all `0`'s to the end of it while maintaining the relative order of the non-zero elements.\n\nNote that you must do this in-place without making a copy of the array. Return the modified array.",
                "examples": [
                    {"input": "nums = [0,1,0,3,12]", "output": "[1, 3, 12, 0, 0]", "explanation": ""},
                    {"input": "nums = [0]", "output": "[0]", "explanation": ""},
                ],
                "constraints": ["1 <= nums.length <= 10^4", "-2^31 <= nums[i] <= 2^31 - 1"],
                "hints": [
                    "Use a write pointer that tracks the next position for a non-zero element.",
                    "After placing all non-zero elements, fill the rest with zeroes.",
                ],
                "starter_code": "def moveZeroes(nums):\n    # Modify in-place, return nums\n    pass\n",
                "test_cases": [
                    {"input": "[0,1,0,3,12]", "expected": "[1, 3, 12, 0, 0]"},
                    {"input": "[0]", "expected": "[0]"},
                    {"input": "[1,0,1]", "expected": "[1, 1, 0]"},
                    {"input": "[1,2,3]", "expected": "[1, 2, 3]"},
                    {"input": "[0,0,1]", "expected": "[1, 0, 0]"},
                ],
            },
            {
                "title": "Rotate Array",
                "difficulty": "medium",
                "tags": "array,math",
                "function_name": "rotate",
                "description": "Given an integer array `nums`, rotate the array to the right by `k` steps, where `k` is non-negative.\n\nReturn the rotated array.",
                "examples": [
                    {"input": "nums = [1,2,3,4,5,6,7], k = 3", "output": "[5, 6, 7, 1, 2, 3, 4]", "explanation": "Rotate right 3 steps: [7,1,2,3,4,5,6] -> [6,7,1,2,3,4,5] -> [5,6,7,1,2,3,4]."},
                    {"input": "nums = [-1,-100,3,99], k = 2", "output": "[3, 99, -1, -100]", "explanation": ""},
                ],
                "constraints": ["1 <= nums.length <= 10^5", "-2^31 <= nums[i] <= 2^31 - 1", "0 <= k <= 10^5"],
                "hints": [
                    "Use k % len(nums) to handle k larger than array length.",
                    "One approach: reverse the whole array, then reverse first k, then reverse rest.",
                ],
                "starter_code": "def rotate(nums, k):\n    # Modify in-place, return nums\n    pass\n",
                "test_cases": [
                    {"input": "[1,2,3,4,5,6,7], 3", "expected": "[5, 6, 7, 1, 2, 3, 4]"},
                    {"input": "[-1,-100,3,99], 2", "expected": "[3, 99, -1, -100]"},
                    {"input": "[1], 0", "expected": "[1]"},
                    {"input": "[1,2], 3", "expected": "[2, 1]"},
                ],
            },
            {
                "title": "Single Number",
                "difficulty": "easy",
                "tags": "array,bit-manipulation",
                "function_name": "singleNumber",
                "description": "Given a non-empty array of integers `nums`, every element appears twice except for one. Find that single one.\n\nYou must implement a solution with a linear runtime complexity and use only constant extra space.",
                "examples": [
                    {"input": "nums = [2,2,1]", "output": "1", "explanation": ""},
                    {"input": "nums = [4,1,2,1,2]", "output": "4", "explanation": ""},
                    {"input": "nums = [1]", "output": "1", "explanation": ""},
                ],
                "constraints": ["1 <= nums.length <= 3 * 10^4", "-3 * 10^4 <= nums[i] <= 3 * 10^4", "Each element appears twice except one."],
                "hints": [
                    "XOR of a number with itself is 0. XOR of a number with 0 is itself.",
                    "XOR all elements together — pairs cancel out, leaving the single number.",
                ],
                "starter_code": "def singleNumber(nums):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": "[2,2,1]", "expected": "1"},
                    {"input": "[4,1,2,1,2]", "expected": "4"},
                    {"input": "[1]", "expected": "1"},
                    {"input": "[0,1,0]", "expected": "1"},
                    {"input": "[5,3,5]", "expected": "3"},
                ],
            },
        ],
        2: [  # Level 2: Strings
            {
                "title": "Reverse String",
                "difficulty": "easy",
                "tags": "string,two-pointers",
                "function_name": "reverseString",
                "description": "Write a function that reverses a string. The input string is given as an array of characters `s`.\n\nYou must do this by modifying the input array in-place with O(1) extra memory. Return the reversed array.",
                "examples": [
                    {"input": 's = ["h","e","l","l","o"]', "output": '["o","l","l","e","h"]', "explanation": ""},
                    {"input": 's = ["H","a","n","n","a","h"]', "output": '["h","a","n","n","a","H"]', "explanation": ""},
                ],
                "constraints": ["1 <= s.length <= 10^5", "s[i] is a printable ASCII character."],
                "hints": [
                    "Use two pointers: one at start, one at end. Swap and move inward.",
                ],
                "starter_code": "def reverseString(s):\n    # Modify in-place, return s\n    pass\n",
                "test_cases": [
                    {"input": '["h","e","l","l","o"]', "expected": '["o", "l", "l", "e", "h"]'},
                    {"input": '["H","a","n","n","a","h"]', "expected": '["h", "a", "n", "n", "a", "H"]'},
                    {"input": '["a"]', "expected": '["a"]'},
                    {"input": '["a","b"]', "expected": '["b", "a"]'},
                ],
            },
            {
                "title": "First Unique Character in a String",
                "difficulty": "easy",
                "tags": "string,hash-map",
                "function_name": "firstUniqChar",
                "description": "Given a string `s`, find the first non-repeating character in it and return its index. If it does not exist, return `-1`.",
                "examples": [
                    {"input": 's = "leetcode"', "output": "0", "explanation": "'l' is the first character that doesn't repeat."},
                    {"input": 's = "loveleetcode"', "output": "2", "explanation": "'v' at index 2 is the first unique character."},
                    {"input": 's = "aabb"', "output": "-1", "explanation": "No unique character exists."},
                ],
                "constraints": ["1 <= s.length <= 10^5", "s consists of only lowercase English letters."],
                "hints": [
                    "Count the frequency of each character.",
                    "Then iterate the string again and return the first character with count 1.",
                ],
                "starter_code": "def firstUniqChar(s):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": '"leetcode"', "expected": "0"},
                    {"input": '"loveleetcode"', "expected": "2"},
                    {"input": '"aabb"', "expected": "-1"},
                    {"input": '"z"', "expected": "0"},
                    {"input": '"aadadaad"', "expected": "-1"},
                ],
            },
            {
                "title": "Longest Palindromic Substring",
                "difficulty": "medium",
                "tags": "string,dp,two-pointers",
                "function_name": "longestPalindrome",
                "description": "Given a string `s`, return the longest palindromic substring in `s`.",
                "examples": [
                    {"input": 's = "babad"', "output": '"bab"', "explanation": '"aba" is also a valid answer.'},
                    {"input": 's = "cbbd"', "output": '"bb"', "explanation": ""},
                ],
                "constraints": ["1 <= s.length <= 1000", "s consists of only digits and English letters."],
                "hints": [
                    "A brute-force approach checks all substrings — O(n^3). Can you expand around centers?",
                    "Each character (and gap between characters) can be the center of a palindrome.",
                    "Expand outward from each center while characters match.",
                ],
                "starter_code": "def longestPalindrome(s):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": '"babad"', "expected": '"bab"'},
                    {"input": '"cbbd"', "expected": '"bb"'},
                    {"input": '"a"', "expected": '"a"'},
                    {"input": '"ac"', "expected": '"a"'},
                ],
            },
        ],
    },

    # ═══════════════════════════════════════════════════════════════════════════
    # META
    # ═══════════════════════════════════════════════════════════════════════════
    "Meta": {
        1: [  # Level 1: Arrays
            {
                "title": "Remove Duplicates from Sorted Array",
                "difficulty": "easy",
                "tags": "array,two-pointers",
                "function_name": "removeDuplicates",
                "description": "Given an integer array `nums` sorted in non-decreasing order, remove the duplicates in-place such that each unique element appears only once. The relative order of the elements should be kept the same.\n\nReturn the number of unique elements `k`. The first `k` elements of `nums` should hold the unique values.",
                "examples": [
                    {"input": "nums = [1,1,2]", "output": "2", "explanation": "nums becomes [1,2,...]. k = 2."},
                    {"input": "nums = [0,0,1,1,1,2,2,3,3,4]", "output": "5", "explanation": "nums becomes [0,1,2,3,4,...]. k = 5."},
                ],
                "constraints": ["1 <= nums.length <= 3 * 10^4", "-100 <= nums[i] <= 100", "nums is sorted in non-decreasing order."],
                "hints": [
                    "Use a write pointer to track where to place the next unique element.",
                    "Since the array is sorted, duplicates are adjacent.",
                ],
                "starter_code": "def removeDuplicates(nums):\n    # Return k (number of unique elements)\n    pass\n",
                "test_cases": [
                    {"input": "[1,1,2]", "expected": "2"},
                    {"input": "[0,0,1,1,1,2,2,3,3,4]", "expected": "5"},
                    {"input": "[1]", "expected": "1"},
                    {"input": "[1,2,3]", "expected": "3"},
                    {"input": "[1,1,1,1]", "expected": "1"},
                ],
            },
            {
                "title": "3Sum",
                "difficulty": "medium",
                "tags": "array,two-pointers,sorting",
                "function_name": "threeSum",
                "description": "Given an integer array `nums`, return all the triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nNotice that the solution set must not contain duplicate triplets.",
                "examples": [
                    {"input": "nums = [-1,0,1,2,-1,-4]", "output": "[[-1,-1,2],[-1,0,1]]", "explanation": "nums[0]+nums[1]+nums[2] = -1+0+1 = 0. nums[1]+nums[2]+nums[4] = 0+1+-1 = 0. nums[0]+nums[3]+nums[4] = -1+2+-1 = 0."},
                    {"input": "nums = [0,1,1]", "output": "[]", "explanation": "No triplet sums to 0."},
                    {"input": "nums = [0,0,0]", "output": "[[0,0,0]]", "explanation": ""},
                ],
                "constraints": ["3 <= nums.length <= 3000", "-10^5 <= nums[i] <= 10^5"],
                "hints": [
                    "Sort the array first.",
                    "Fix one number and use two pointers for the remaining two.",
                    "Skip duplicate values to avoid duplicate triplets.",
                ],
                "starter_code": "def threeSum(nums):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": "[-1,0,1,2,-1,-4]", "expected": "[[-1, -1, 2], [-1, 0, 1]]"},
                    {"input": "[0,1,1]", "expected": "[]"},
                    {"input": "[0,0,0]", "expected": "[[0, 0, 0]]"},
                    {"input": "[-2,0,1,1,2]", "expected": "[[-2, 0, 2], [-2, 1, 1]]"},
                ],
            },
            {
                "title": "Subarray Sum Equals K",
                "difficulty": "medium",
                "tags": "array,hash-map,prefix-sum",
                "function_name": "subarraySum",
                "description": "Given an array of integers `nums` and an integer `k`, return the total number of subarrays whose sum equals to `k`.\n\nA subarray is a contiguous non-empty sequence of elements within an array.",
                "examples": [
                    {"input": "nums = [1,1,1], k = 2", "output": "2", "explanation": "Subarrays [1,1] starting at index 0 and 1."},
                    {"input": "nums = [1,2,3], k = 3", "output": "2", "explanation": "Subarrays [1,2] and [3]."},
                ],
                "constraints": ["1 <= nums.length <= 2 * 10^4", "-1000 <= nums[i] <= 1000", "-10^7 <= k <= 10^7"],
                "hints": [
                    "Use prefix sums. If prefix[j] - prefix[i] == k, then subarray [i+1..j] sums to k.",
                    "Use a hash map to count prefix sums seen so far.",
                    "For each prefix sum, check how many times (prefix_sum - k) has appeared.",
                ],
                "starter_code": "def subarraySum(nums, k):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": "[1,1,1], 2", "expected": "2"},
                    {"input": "[1,2,3], 3", "expected": "2"},
                    {"input": "[1], 0", "expected": "0"},
                    {"input": "[1,-1,0], 0", "expected": "3"},
                ],
            },
        ],
        2: [  # Level 2: Strings
            {
                "title": "Palindrome Number",
                "difficulty": "easy",
                "tags": "math,string",
                "function_name": "isPalindrome",
                "description": "Given an integer `x`, return `True` if `x` is a palindrome, and `False` otherwise.\n\nAn integer is a palindrome when it reads the same backward as forward.",
                "examples": [
                    {"input": "x = 121", "output": "True", "explanation": "121 reads as 121 from left to right and right to left."},
                    {"input": "x = -121", "output": "False", "explanation": "From left to right it reads -121. From right to left it reads 121-."},
                    {"input": "x = 10", "output": "False", "explanation": ""},
                ],
                "constraints": ["-2^31 <= x <= 2^31 - 1"],
                "hints": [
                    "Negative numbers are never palindromes.",
                    "Convert to string and check, or reverse half the number.",
                ],
                "starter_code": "def isPalindrome(x):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": "121", "expected": "true"},
                    {"input": "-121", "expected": "false"},
                    {"input": "10", "expected": "false"},
                    {"input": "0", "expected": "true"},
                    {"input": "12321", "expected": "true"},
                ],
            },
            {
                "title": "Roman to Integer",
                "difficulty": "easy",
                "tags": "string,hash-map,math",
                "function_name": "romanToInt",
                "description": "Roman numerals are represented by seven different symbols: I, V, X, L, C, D, M.\n\nGiven a roman numeral string `s`, convert it to an integer.\n\nI=1, V=5, X=10, L=50, C=100, D=500, M=1000.\n\nSubtraction rule: I before V/X means 4/9. X before L/C means 40/90. C before D/M means 400/900.",
                "examples": [
                    {"input": 's = "III"', "output": "3", "explanation": "III = 3."},
                    {"input": 's = "LVIII"', "output": "58", "explanation": "L = 50, V = 5, III = 3."},
                    {"input": 's = "MCMXCIV"', "output": "1994", "explanation": "M=1000, CM=900, XC=90, IV=4."},
                ],
                "constraints": ["1 <= s.length <= 15", "s contains only 'I','V','X','L','C','D','M'.", "It is guaranteed that s is a valid roman numeral."],
                "hints": [
                    "If a smaller value appears before a larger value, subtract it.",
                    "Otherwise, add it.",
                    "Iterate from left to right, comparing current value with next.",
                ],
                "starter_code": "def romanToInt(s):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": '"III"', "expected": "3"},
                    {"input": '"LVIII"', "expected": "58"},
                    {"input": '"MCMXCIV"', "expected": "1994"},
                    {"input": '"IV"', "expected": "4"},
                    {"input": '"IX"', "expected": "9"},
                ],
            },
            {
                "title": "Minimum Window Substring",
                "difficulty": "hard",
                "tags": "string,sliding-window,hash-map",
                "function_name": "minWindow",
                "description": "Given two strings `s` and `t` of lengths `m` and `n` respectively, return the minimum window substring of `s` such that every character in `t` (including duplicates) is included in the window.\n\nIf there is no such substring, return the empty string `\"\"`.",
                "examples": [
                    {"input": 's = "ADOBECODEBANC", t = "ABC"', "output": '"BANC"', "explanation": "The minimum window substring 'BANC' includes 'A', 'B', and 'C' from string t."},
                    {"input": 's = "a", t = "a"', "output": '"a"', "explanation": ""},
                    {"input": 's = "a", t = "aa"', "output": '""', "explanation": "Both 'a's from t must be in the window."},
                ],
                "constraints": ["m == s.length, n == t.length", "1 <= m, n <= 10^5", "s and t consist of uppercase and lowercase English letters."],
                "hints": [
                    "Use a sliding window with two pointers.",
                    "Track character counts needed and character counts in the current window.",
                    "Expand the right pointer to include needed characters, shrink the left to find the minimum.",
                ],
                "starter_code": "def minWindow(s, t):\n    # Your code here\n    pass\n",
                "test_cases": [
                    {"input": '"ADOBECODEBANC", "ABC"', "expected": '"BANC"'},
                    {"input": '"a", "a"', "expected": '"a"'},
                    {"input": '"a", "aa"', "expected": '""'},
                    {"input": '"ab", "b"', "expected": '"b"'},
                ],
            },
        ],
    },
}


def main():
    db = SessionLocal()

    # Clean old coding data (order matters for FK constraints)
    from models.coding import CodingSubmission, CodingSession
    db.query(CodingSubmission).delete()
    db.query(CodingSession).delete()
    db.query(CodingSetProblem).delete()
    db.query(CodingSet).delete()
    db.query(CodingProblem).delete()
    db.commit()
    print("Cleared old coding data.")

    total_problems = 0
    total_sets = 0

    for company, levels in PROBLEMS.items():
        for level_num, problems in levels.items():
            topic = "Arrays" if level_num == 1 else "Strings"
            # Create set
            coding_set = CodingSet(
                company=company,
                round_name=f"Level {level_num} — {topic}",
                problem_count=len(problems),
                duration_minutes=90,
                level_number=level_num,
                topic=topic,
            )
            db.add(coding_set)
            db.flush()
            total_sets += 1

            for idx, p in enumerate(problems):
                prob = CodingProblem(
                    title=p["title"],
                    description=p["description"],
                    difficulty=p["difficulty"],
                    company=company,
                    starter_code=p["starter_code"],
                    test_cases=p["test_cases"],
                    function_name=p["function_name"],
                    time_limit=5,
                    tags=p["tags"],
                    hints=p["hints"],
                    examples=p["examples"],
                    constraints=p["constraints"],
                )
                db.add(prob)
                db.flush()

                link = CodingSetProblem(
                    set_id=coding_set.id,
                    problem_id=prob.id,
                    order_index=idx,
                )
                db.add(link)
                total_problems += 1

    db.commit()
    print(f"Seeded {total_problems} problems in {total_sets} sets across {len(PROBLEMS)} companies.")
    db.close()


if __name__ == "__main__":
    main()
