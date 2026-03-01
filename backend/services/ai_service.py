
import logging
from typing import Dict, Any, Tuple
from config import settings

logger = logging.getLogger(__name__)


def generate_descriptions(
    project_name: str,
    client: str,
    model_data: Dict[str, Any],
    parameters: Dict[str, Any],
    calculation: Dict[str, Any],
) -> Tuple[str, str]:
    """
    Returns (technical_description, commercial_text)
    """
    if not settings.anthropic_api_key:
        return _mock_descriptions(project_name, model_data, calculation)

    try:
        import anthropic

        client_api = anthropic.Anthropic(api_key=settings.anthropic_api_key)

        prompt = _build_prompt(project_name, client, model_data, parameters, calculation)

        message = client_api.messages.create(
            model="claude-opus-4-6",
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )

        full_text = message.content[0].text
        return _parse_response(full_text)

    except Exception as e:
        logger.error(f"AI generation failed: {e}")
        return _mock_descriptions(project_name, model_data, calculation)


def _build_prompt(project_name, client, model_data, parameters, calculation) -> str:
    dim_str = "unknown dimensions"
    if model_data:
        x = model_data.get("dim_x", 0)
        y = model_data.get("dim_y", 0)
        z = model_data.get("dim_z", 0)
        vol = model_data.get("volume_cm3", 0)
        polys = model_data.get("polygon_count", 0)
        dim_str = f"{x:.1f} x {y:.1f} x {z:.1f} mm, volume {vol:.2f} cm³, {polys:,} polygons"

    tech = parameters.get("technology", "FDM")
    material_name = parameters.get("material_name", "PLA")
    qty = calculation.get("quantity", 1)
    price = calculation.get("price_per_unit", 0)
    currency = calculation.get("currency", "USD")
    weight = calculation.get("weight_g", 0)

    return f"""You are a technical writer for a 3D printing service bureau.

Generate two pieces of text for a 3D printed part order:

Project: {project_name}
Client: {client or "N/A"}
Dimensions: {dim_str}
Technology: {tech}
Material: {material_name}
Quantity: {qty} pcs
Weight per part: {weight:.1f} g
Unit price: {price:.2f} {currency}

Please write:

<description>
A technical description of the part (2-3 sentences). Describe the physical characteristics, manufacturing method, and likely use case based on the dimensions and parameters.
</description>

<commercial>
A short, friendly commercial message for the client (2-3 sentences). Highlight value, quality, and delivery. Make it professional and reassuring.
</commercial>

Only output the two XML blocks, nothing else."""


def _parse_response(text: str) -> Tuple[str, str]:
    import re
    desc_match = re.search(r"<description>(.*?)</description>", text, re.DOTALL)
    comm_match = re.search(r"<commercial>(.*?)</commercial>", text, re.DOTALL)

    description = desc_match.group(1).strip() if desc_match else text[:300]
    commercial = comm_match.group(1).strip() if comm_match else ""
    return description, commercial


def _mock_descriptions(project_name, model_data, calculation) -> Tuple[str, str]:

    vol = model_data.get("volume_cm3", 0) if model_data else 0
    price = calculation.get("price_per_unit", 0)
    currency = calculation.get("currency", "USD")

    description = (
        f"The part '{project_name}' is a 3D printed component with a volume of {vol:.2f} cm³. "
    )
    commercial = (
        f"Thank you for your order!"
        f"Estimated unit price: {price:.2f} {currency}. "
    )
    return description, commercial
