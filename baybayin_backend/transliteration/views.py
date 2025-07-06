from django.shortcuts import render
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

from .services import text_transliteration_pipeline

# Create your views here.
@csrf_exempt
def transliterate_text_view(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Transliteration method not allowed. Use POST.'},status=405)
    
    try: 
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON format.'}, status=400)
     
    text = data.get('text')
    transliteration_direction = data.get('transliteration_direction')
    
    if not text:
        return JsonResponse({'error': 'No text provided.'}, status=400)
    
    if not transliteration_direction:
        return JsonResponse({'error': 'No transliteration direction provided.'}, status=400)
    
    try:
        result, warnings = text_transliteration_pipeline(
            text, transliteration_direction)

        return JsonResponse({
            'input_text': text,
            'transliteration_direction': transliteration_direction,
            'normalized_text': result['normalized_text'],
            'text_length': len(result['normalized_text']),
            'transliterated_text': result['transliterated_text'],
            'warnings': warnings
        }, status=200)

    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)   
