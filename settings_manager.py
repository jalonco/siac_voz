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
    """
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
        return ["Puck", "Charon", "Kore", "Fenrir", "Aoede"]
