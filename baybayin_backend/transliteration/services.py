from preprocessing.normalization_pipeline import text_transliteration_normalization
from .transliterator import transliterate_latin_to_baybayin, transliterate_baybayin_to_latin

def text_transliteration_pipeline(text, transliteration_direction):
    result = {}
    
    normalized_text, warnings = text_transliteration_normalization(text, transliteration_direction)
    result['normalized_text'] = normalized_text
    
    if transliteration_direction == "to_baybayin":
        transliterated_text = transliterate_latin_to_baybayin(normalized_text)
    elif transliteration_direction == "to_latin":
        transliterated_text = transliterate_baybayin_to_latin(normalized_text)
    result['transliterated_text'] = transliterated_text
    
    return result, warnings
