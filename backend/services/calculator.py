"""
Cost calculation engine for 3D printing.

Input: model analysis data + user parameters
Output: full cost breakdown
"""
from typing import Dict, Any, Optional


DEFAULT_PARAMS = {

    "technology": "FDM",


    "material_density_g_cm3": 1.24,   # g/cm³ (PLA ~1.24)
    "material_price_per_kg": 20.0,    # currency per kg
    "material_waste_factor": 1.05,    # 5% waste on support removal etc.


    "infill_percent": 20.0,           # % infill
    "support_percent": 10.0,          # % of volume that is support material
    "print_time_hours": 1.0,          # hours of machine time
    "postprocess_time_hours": 0.5,    # hours of manual post-processing
    "modeling_time_hours": 0.5,       # hours of CAD/prep work


    "quantity": 1,
    "is_series": False,
    "markup_coefficient": 1.5,        # e.g. 1.5 = 50% margin
    "defect_rate_percent": 2.0,       # % chance of print failing
    "tax_percent": 20.0,              # VAT / sales tax
    "depreciation_per_hour": 0.5,     # machine wear cost per hour
    "electricity_cost_per_kwh": 0.12, # electricity price
    "printer_power_kw": 0.25,         # printer power consumption in kW
    "operator_rate_per_hour": 15.0,   # labor cost per hour


    "currency": "USD",
    "language": "en",
}


def calculate(
    model_data: Optional[Dict[str, Any]],
    user_params: Dict[str, Any],
) -> Dict[str, Any]:

    p = {**DEFAULT_PARAMS, **user_params}


    volume_cm3 = 0.0
    if model_data and model_data.get("volume_cm3"):
        volume_cm3 = float(model_data["volume_cm3"])


    infill = float(p["infill_percent"]) / 100.0

    shell_fraction = 0.20
    core_fraction = 1.0 - shell_fraction
    effective_volume_cm3 = volume_cm3 * (shell_fraction + core_fraction * infill)


    support_volume_cm3 = volume_cm3 * (float(p["support_percent"]) / 100.0)
    total_material_volume_cm3 = (effective_volume_cm3 + support_volume_cm3) * float(p["material_waste_factor"])

    density = float(p["material_density_g_cm3"])
    weight_g = total_material_volume_cm3 * density
    weight_kg = weight_g / 1000.0

    material_cost = weight_kg * float(p["material_price_per_kg"])


    print_time_h = float(p["print_time_hours"])
    postprocess_time_h = float(p["postprocess_time_hours"])
    modeling_time_h = float(p["modeling_time_hours"])
    total_time_h = print_time_h + postprocess_time_h + modeling_time_h


    power_kw = float(p["printer_power_kw"])
    kwh_rate = float(p["electricity_cost_per_kwh"])
    electricity_cost = print_time_h * power_kw * kwh_rate


    depreciation_cost = print_time_h * float(p["depreciation_per_hour"])


    operator_rate = float(p["operator_rate_per_hour"])
    labor_cost = (postprocess_time_h + modeling_time_h) * operator_rate

    labor_cost += print_time_h * operator_rate * 0.30


    base_cost_per_unit = material_cost + electricity_cost + depreciation_cost + labor_cost


    defect_rate = float(p["defect_rate_percent"]) / 100.0

    defect_factor = 1.0 / (1.0 - defect_rate) if defect_rate < 1.0 else 1.0
    cost_after_defect = base_cost_per_unit * defect_factor
    defect_cost = cost_after_defect - base_cost_per_unit


    markup = float(p["markup_coefficient"])
    price_before_tax = cost_after_defect * markup
    profit = price_before_tax - cost_after_defect


    quantity = int(p["quantity"])
    series_discount = 0.0
    if p.get("is_series") and quantity > 10:
        series_discount = price_before_tax * 0.05
        price_before_tax -= series_discount


    tax_rate = float(p["tax_percent"]) / 100.0
    tax_amount = price_before_tax * tax_rate
    price_per_unit = price_before_tax + tax_amount


    total_price = price_per_unit * quantity

    return {
        # Material
        "weight_g": round(weight_g, 2),
        "weight_kg": round(weight_kg, 4),
        "effective_volume_cm3": round(effective_volume_cm3, 4),
        "support_volume_cm3": round(support_volume_cm3, 4),
        "total_material_volume_cm3": round(total_material_volume_cm3, 4),
        "material_cost": round(material_cost, 4),

        # Time
        "print_time_hours": round(print_time_h, 2),
        "postprocess_time_hours": round(postprocess_time_h, 2),
        "modeling_time_hours": round(modeling_time_h, 2),
        "total_time_hours": round(total_time_h, 2),

        # Costs
        "electricity_cost": round(electricity_cost, 4),
        "depreciation_cost": round(depreciation_cost, 4),
        "labor_cost": round(labor_cost, 4),
        "base_cost_per_unit": round(base_cost_per_unit, 4),
        "defect_cost": round(defect_cost, 4),
        "cost_after_defect": round(cost_after_defect, 4),

        # Price
        "markup_coefficient": markup,
        "profit": round(profit, 4),
        "series_discount": round(series_discount, 4),
        "price_before_tax": round(price_before_tax, 4),
        "tax_amount": round(tax_amount, 4),
        "price_per_unit": round(price_per_unit, 4),

        # Batch
        "quantity": quantity,
        "total_price": round(total_price, 4),

        # Meta
        "currency": p.get("currency", "USD"),
    }
