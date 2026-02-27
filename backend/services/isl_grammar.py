"""ISL Grammar Converter — converts English text to ISL gloss notation.
ISL uses Topic-Comment structure (Time → Topic → Comment), not English SVO.
"""
import re
from typing import List

try:
    import spacy
    _nlp = spacy.load("en_core_web_sm")
except (ImportError, OSError):
    _nlp = None
    print("⚠ spaCy model not found. Run: python -m spacy download en_core_web_sm")


class ISLGrammarConverter:
    # ISL gloss dictionary — English → ISL gloss
    GLOSS_MAP = {
        # Greetings
        "hello": "HELLO", "hi": "HELLO", "goodbye": "BYE", "bye": "BYE",
        "thank": "THANK-YOU", "thanks": "THANK-YOU", "please": "PLEASE",
        "sorry": "SORRY", "excuse": "SORRY",
        # Common verbs
        "go": "GO", "going": "GO", "went": "GO",
        "come": "COME", "coming": "COME", "came": "COME",
        "eat": "EAT", "eating": "EAT", "ate": "EAT",
        "drink": "DRINK", "drinking": "DRINK",
        "see": "SEE", "seeing": "SEE", "saw": "SEE",
        "know": "KNOW", "knowing": "KNOW", "knew": "KNOW",
        "want": "WANT", "wanting": "WANT", "wanted": "WANT",
        "help": "HELP", "helping": "HELP",
        "need": "NEED", "needs": "NEED",
        "have": "HAVE", "has": "HAVE",
        "say": "SAY", "said": "SAY",
        "think": "THINK", "thought": "THINK",
        "feel": "FEEL", "felt": "FEEL",
        "work": "WORK", "working": "WORK",
        "play": "PLAY", "playing": "PLAY",
        "learn": "LEARN", "learning": "LEARN",
        "teach": "TEACH", "teaching": "TEACH",
        "buy": "BUY", "buying": "BUY", "bought": "BUY",
        "give": "GIVE", "giving": "GIVE", "gave": "GIVE",
        "take": "TAKE", "taking": "TAKE", "took": "TAKE",
        "make": "MAKE", "making": "MAKE", "made": "MAKE",
        "like": "LIKE", "love": "LOVE",
        "wait": "WAIT", "waiting": "WAIT",
        "sit": "SIT", "sitting": "SIT",
        "stand": "STAND", "standing": "STAND",
        "run": "RUN", "running": "RUN",
        "walk": "WALK", "walking": "WALK",
        "stop": "STOP",
        # Common nouns
        "india": "INDIA", "indian": "INDIA",
        "government": "GOVERNMENT",
        "news": "NEWS",
        "cricket": "CRICKET",
        "school": "SCHOOL",
        "hospital": "HOSPITAL", "doctor": "DOCTOR",
        "home": "HOME", "house": "HOME",
        "water": "WATER",
        "food": "FOOD",
        "money": "MONEY",
        "market": "MARKET",
        "vegetables": "VEGETABLES",
        "station": "STATION",
        "bus": "BUS", "train": "TRAIN",
        "family": "FAMILY",
        "friend": "FRIEND",
        "child": "CHILD", "children": "CHILD",
        "mother": "MOTHER", "father": "FATHER",
        "brother": "BROTHER", "sister": "SISTER",
        "teacher": "TEACHER", "student": "STUDENT",
        "book": "BOOK",
        "rain": "RAIN", "hot": "HOT", "cold": "COLD",
        "good": "GOOD", "bad": "BAD",
        "big": "BIG", "small": "SMALL",
        "happy": "HAPPY", "sad": "SAD",
        # Time words
        "today": "TODAY", "tomorrow": "TOMORROW", "yesterday": "YESTERDAY",
        "now": "NOW", "later": "LATER",
        "morning": "MORNING", "evening": "EVENING", "night": "NIGHT",
        # Numbers
        "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
        "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
        # Question words
        "what": "WHAT?", "who": "WHO?", "where": "WHERE?",
        "when": "WHEN?", "why": "WHY?", "how": "HOW?",
        # Pronouns
        "i": "I", "me": "ME", "my": "MY",
        "you": "YOU", "your": "YOUR",
        "he": "HE", "she": "SHE", "they": "THEY", "we": "WE",
        # Articles/aux verbs/conjunctions/prepositions (DROP in ISL)
        "a": "", "an": "", "the": "", "and": "", "or": "", "but": "",
        "is": "", "are": "", "was": "", "were": "", "be": "", "been": "",
        "am": "", "being": "", "do": "", "does": "", "did": "",
        "will": "", "would": "", "could": "", "should": "", "can": "",
        "to": "", "of": "", "in": "", "on": "", "at": "", "for": "",
        "with": "", "from": "", "by": "", "about": "", "into": "",
        "very": "", "much": "", "so": "", "too": "", "also": "",
        "not": "NOT", "no": "NO", "yes": "YES",
    }

    # Time markers come FIRST in ISL
    TIME_WORDS = {
        "today", "tomorrow", "yesterday", "now", "later", "soon",
        "morning", "evening", "night", "monday", "tuesday", "wednesday",
        "thursday", "friday", "saturday", "sunday", "week", "month", "year",
        "already", "before", "after", "always", "never", "sometimes"
    }

    def convert(self, text: str) -> str:
        """Convert English text to ISL gloss notation"""
        if not text:
            return ""

        words = text.lower().split()

        # Step 1: Separate time words to front
        time_words_found = []
        other_words = []
        for word in words:
            clean = re.sub(r'[^\w]', '', word)
            if clean in self.TIME_WORDS:
                time_words_found.append(clean)
            else:
                other_words.append(clean)

        # Step 2: Map to ISL glosses
        reordered = time_words_found + other_words
        glosses = []
        for word in reordered:
            if word in self.GLOSS_MAP:
                gloss = self.GLOSS_MAP[word]
                if gloss:  # Skip empty (dropped words)
                    glosses.append(gloss)
            elif word and len(word) > 1:
                # Unknown word: uppercase it (fingerspell)
                glosses.append(word.upper())

        # Step 3: Detect question (ends with ?)
        is_question = text.strip().endswith("?")
        result = " ".join(glosses)
        if is_question and "?" not in result:
            result = result + " ?"

        return result if result else text.upper()

    def convert_with_spacy(self, text: str) -> str:
        """More accurate conversion using spaCy dependency parsing"""
        if not _nlp:
            return self.convert(text)  # Fallback to simple version

        doc = _nlp(text)

        # Extract time expressions
        time_tokens = [tok for tok in doc if tok.dep_ in ("npadvmod", "advmod")
                       and tok.lower_ in self.TIME_WORDS]

        # Extract main content tokens (skip stopwords that ISL doesn't need)
        isl_skip_pos = {"DET", "AUX", "CCONJ", "SCONJ", "PART"}
        content_tokens = [tok for tok in doc if tok.pos_ not in isl_skip_pos
                          and tok not in time_tokens]

        ordered = time_tokens + content_tokens
        glosses = [self.GLOSS_MAP.get(tok.lower_, tok.text.upper()) for tok in ordered]
        glosses = [g for g in glosses if g]  # Remove empty strings

        return " ".join(glosses)
