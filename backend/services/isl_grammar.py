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
    2. Remove articles, linking verbs, prepositions, conjunctions
    3. Move time words to front
    4. Uppercase all tokens
    Returns ordered list of ISL gloss tokens.
    """
    # Lowercase and expand contractions
    text = text.lower().strip()
    for contraction, expansion in CONTRACTION_MAP.items():
        text = text.replace(contraction, expansion)

    # Tokenize — remove punctuation
    text = re.sub(r"[^\w\s]", " ", text)
    words = text.split()

    time_tokens = []
    other_tokens = []

    for word in words:
        if not word:
            continue
        if word in DROP_WORDS:
            continue
        if word in TIME_WORDS:
            time_tokens.append(word.upper())
        else:
            other_tokens.append(word.upper())

    return time_tokens + other_tokens
