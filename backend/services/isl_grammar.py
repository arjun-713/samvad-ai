import spacy
import re

nlp = spacy.load("en_core_web_sm")

# Words to remove — ISL has no articles or linking verbs
DROP_WORDS = {
    "a", "an", "the",
    "is", "am", "are", "was", "were", "be", "been", "being",
    "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "shall",
    "have", "has", "had",
    "it", "its", "this", "that", "these", "those",
    "of", "in", "on", "at", "to", "for", "with", "by", "from",
    "and", "or", "but", "so", "yet",
}

TIME_WORDS = {
    "today", "tomorrow", "yesterday", "now", "later", "soon",
    "morning", "evening", "night", "always", "never", "sometimes",
    "daily", "weekly", "yearly",
}

CONTRACTION_MAP = {
    "don't": "not",
    "doesn't": "not",
    "didn't": "not",
    "can't": "cannot",
    "cannot": "can not",
    "won't": "will not",
    "wouldn't": "would not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "i'm": "i",
    "i've": "i",
    "i'll": "i",
    "i'd": "i",
    "he's": "he",
    "she's": "she",
    "it's": "it",
    "we're": "we",
    "they're": "they",
    "you're": "you",
    "what's": "what",
    "that's": "that",
    "there's": "there",
}


def convert_to_isl_gloss(text: str) -> list[str]:
    """
    Converts English text to ISL gloss token list.
    Rules:
    1. Expand contractions
    2. Check for multi-word phrases from dictionary
    3. Remove articles, linking verbs, prepositions, conjunctions
    4. Move time words to front
    5. Uppercase all tokens
    Returns ordered list of ISL gloss tokens.
    """
    # Lowercase and expand contractions
    text = text.lower().strip()
    for contraction, expansion in CONTRACTION_MAP.items():
        text = text.replace(contraction, expansion)

    # Load dictionary for phrase matching
    import json
    from pathlib import Path
    dict_path = Path(__file__).parent.parent / "isl_dictionary.json"
    try:
        with open(dict_path) as f:
            dictionary = json.load(f)
    except:
        dictionary = {}

    # Sort phrases by length (longest first) to match greedily
    phrases = sorted([k for k in dictionary.keys() if " " in k], key=len, reverse=True)
    
    # Placeholder for matched phrases
    gloss_tokens = []
    
    for phrase in phrases:
        if phrase in text:
            # We found a phrase! Replace it with a single token-like string
            # to prevent it from being split later
            text = text.replace(phrase, phrase.replace(" ", "_").upper())
            # Note: This is a hacky way to find phrases, but for 200 words it's okay.
            # Real production would use a proper phrase matcher or trie.

    # Tokenize — remove punctuation but keep our underscores
    text = re.sub(r"[^A-Z_a-z\s]", " ", text)
    words = text.split()

    time_tokens = []
    other_tokens = []

    for word in words:
        if not word:
            continue
        
        # If it was a phrase, it will be all uppercase and have an underscore
        if "_" in word and word.isupper():
            other_tokens.append(word.replace("_", " "))
            continue

        if word in DROP_WORDS:
            continue
        if word in TIME_WORDS:
            time_tokens.append(word.upper())
        else:
            other_tokens.append(word.upper())

    return time_tokens + other_tokens
