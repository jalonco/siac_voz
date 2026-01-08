import json
import os
from typing import Dict, Any

SETTINGS_FILE = "agent_settings.json"

DEFAULT_SETTINGS = {
    "voice_id": "Charon",
    "system_prompt": """
    Eres un agente de cobranzas profesional y amable que llama de parte de SIAC.
    Tu objetivo es contactar al cliente, verificar su identidad y llegar a un acuerdo de pago para su deuda pendiente.

    DIRECTRICES:
    1.  **Idioma**: Habla estrictamente en Español.
    2.  **Tono**: Profesional, respetuoso, firme pero empático. Nunca seas agresivo.
    3.  **Flujo**:
        *   Saluda y preséntate como agente de SIAC.
        *   Pregunta si estás hablando con el titular de la deuda.
        *   Explica brevemente el motivo de la llamada (gestión de cobro).
        *   Pregunta por la situación que ha impedido el pago.
        *   Propón llegar a un acuerdo de pago (fecha y monto).
        *   Confirma los detalles del acuerdo.
        *   Despídete cordialmente.
    4.  **Manejo de Objeciones**: Si no tiene dinero, negocia una fecha próxima o un pago parcial.
    
    IMPORTANTE: Mantén las respuestas concisas.
    IMPORTANTE: Mantén las respuestas concisas.
    """,
    "variables": [] # List of {key: str, description: str, example: str}
}

class SettingsManager:
    @staticmethod
    def load_settings() -> Dict[str, Any]:
        """Load settings from JSON file, or return defaults if file doesn't exist."""
        if not os.path.exists(SETTINGS_FILE):
            return DEFAULT_SETTINGS.copy()
        
        try:
            with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading settings: {e}, using defaults.")
            return DEFAULT_SETTINGS.copy()

    @staticmethod
    def save_settings(settings: Dict[str, Any]) -> None:
        """Save settings to JSON file."""
        try:
            with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
                json.dump(settings, f, indent=4, ensure_ascii=False)
        except Exception as e:
            print(f"Error saving settings: {e}")

    @staticmethod
    def get_available_voices():
        voices = [
            {"id": "Zephyr", "name": "Zephyr", "gender": "Male", "description": "Brillante"},
            {"id": "Kore", "name": "Kore", "gender": "Female", "description": "Firme"},
            {"id": "Orus", "name": "Orus", "gender": "Male", "description": "Firme"},
            {"id": "Autonoe", "name": "Autonoe", "gender": "Female", "description": "Brillante"},
            {"id": "Umbriel", "name": "Umbriel", "gender": "Male", "description": "Tranquila"},
            {"id": "Erinome", "name": "Erinome", "gender": "Female", "description": "Clara"},
            {"id": "Laomedeia", "name": "Laomedeia", "gender": "Female", "description": "Optimista"},
            {"id": "Schedar", "name": "Schedar", "gender": "Male", "description": "Uniforme"},
            {"id": "Achird", "name": "Achird", "gender": "Female", "description": "Amigable"},
            {"id": "Sadachbia", "name": "Sadachbia", "gender": "Female", "description": "Animada"},
            {"id": "Puck", "name": "Puck", "gender": "Male", "description": "Alegre"},
            {"id": "Fenrir", "name": "Fenrir", "gender": "Male", "description": "Excitante"},
            {"id": "Aoede", "name": "Aoede", "gender": "Female", "description": "Ligera"},
            {"id": "Enceladus", "name": "Enceladus", "gender": "Male", "description": "Suave"},
            {"id": "Algieba", "name": "Algieba", "gender": "Female", "description": "Suave"},
            {"id": "Algenib", "name": "Algenib", "gender": "Male", "description": "Grave"},
            {"id": "Achernar", "name": "Achernar", "gender": "Male", "description": "Suave"},
            {"id": "Gacrux", "name": "Gacrux", "gender": "Female", "description": "Madura"},
            {"id": "Zubenelgenubi", "name": "Zubenelgenubi", "gender": "Male", "description": "Informal"},
            {"id": "Sadaltager", "name": "Sadaltager", "gender": "Female", "description": "Informativa"},
            {"id": "Charon", "name": "Charon", "gender": "Male", "description": "Informativo"},
            {"id": "Leda", "name": "Leda", "gender": "Female", "description": "Juvenil"},
            {"id": "Callirrhoe", "name": "Callirrhoe", "gender": "Female", "description": "Tranquilo"},
            {"id": "Iapetus", "name": "Iapetus", "gender": "Male", "description": "Claro"},
            {"id": "Despina", "name": "Despina", "gender": "Female", "description": "Suave"},
            {"id": "Rasalgethi", "name": "Rasalgethi", "gender": "Male", "description": "Informativo"},
            {"id": "Alnilam", "name": "Alnilam", "gender": "Male", "description": "Firme"},
            {"id": "Pulcherrima", "name": "Pulcherrima", "gender": "Female", "description": "Directo"},
            {"id": "Vindemiatrix", "name": "Vindemiatrix", "gender": "Female", "description": "Suave"},
            {"id": "Sulafat", "name": "Sulafat", "gender": "Male", "description": "Cálido"},
        ]
        
        # Add dynamic preview URL
        for v in voices:
            # We assume the frontend and backend are on same domain, or frontend will prefix API_URL
            v["preview_url"] = f"/voices/preview/{v['id']}"
            
        return voices

    @staticmethod
    def get_available_languages():
        return [
            {"code": "es-US", "name": "Español (EE.UU.)"},
            {"code": "en-US", "name": "English (US)"},
            {"code": "ar-EG", "name": "Árabe (Egipto)"},
            {"code": "de-DE", "name": "Alemán (Alemania)"},
            {"code": "fr-FR", "name": "Francés (Francia)"},
            {"code": "hi-IN", "name": "Hindi (India)"},
            {"code": "id-ID", "name": "Indonesio (Indonesia)"},
            {"code": "it-IT", "name": "Italiano (Italia)"},
            {"code": "ja-JP", "name": "Japonés (Japón)"},
            {"code": "ko-KR", "name": "Coreano (Corea)"},
            {"code": "pt-BR", "name": "Portugués (Brasil)"},
            {"code": "ru-RU", "name": "Ruso (Rusia)"},
            {"code": "nl-NL", "name": "Holandés (Países Bajos)"},
            {"code": "pl-PL", "name": "Polaco (Polonia)"},
            {"code": "th-TH", "name": "Tailandés (Tailandia)"},
            {"code": "tr-TR", "name": "Turco (Türkiye)"},
            {"code": "vi-VN", "name": "Vietnamita (Vietnam)"},
            {"code": "ro-RO", "name": "Rumano (Rumania)"},
            {"code": "uk-UA", "name": "Ucraniano (Ucrania)"},
            {"code": "bn-BD", "name": "Bengalí (Bangladés)"},
            {"code": "mr-IN", "name": "Maratí (India)"},
            {"code": "ta-IN", "name": "Tamil (India)"},
            {"code": "te-IN", "name": "Telugu (India)"},
        ]
