import os
from uuid import uuid4

def generate_unique_filename(original_filename: str) -> str:
    """ Генерирует случайное имя, сохраняя расширение оригинала """
    extension = os.path.splitext(original_filename)[1]
    
    random_name = uuid4().hex
    
    return f"{random_name}{extension}"
