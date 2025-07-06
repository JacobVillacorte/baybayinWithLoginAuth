from .normalization_pipeline import text_transliteration_normalization
from .utils import is_latin_alphabet
from common.regex_utils import is_baybayin_character

def text_transliteration_normalization_pipeline(text, transliteration_direction):
    result = {}
    warnings = []
    
    normalized_text, norm_warnings = text_transliteration_normalization(text, transliteration_direction)
    warnings.extend(norm_warnings)
    result['normalized_text'] = normalized_text
    
    if transliteration_direction == "to_baybayin":
        contains_baybayin = any(is_baybayin_character(c) for c in normalized_text)
        result['contains_baybayin'] = contains_baybayin
    else:
        contains_latin = any(is_latin_alphabet(c) for c in normalized_text)
        result['contains_latin'] = contains_latin
    
    result['warnings'] = warnings
    
    return result 


