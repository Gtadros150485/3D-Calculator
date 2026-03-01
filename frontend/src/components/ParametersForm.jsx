import { useState, useEffect, useCallback } from "react";

const TECHNOLOGIES = ["FDM", "SLA", "SLS", "Metal (SLM)", "PolyJet", "MJF"];
const MATERIALS = {
  FDM: ["PLA", "PETG", "ABS", "TPU", "Nylon", "ASA"],
  SLA: ["Standard Resin", "Tough Resin", "Flexible Resin", "Castable Resin"],
  SLS: ["Nylon PA12", "Nylon PA11", "TPU Powder", "Glass-filled PA"],
  "Metal (SLM)": ["316L Steel", "AlSi10Mg", "Ti6Al4V", "Inconel 625"],
  PolyJet: ["VeroWhite", "Rubber-like", "Transparent"],
  MJF: ["PA12", "PA11", "PP"],
};

const MATERIAL_PRESETS = {
  PLA: { density: 1.24, price: 20.0 },
  PETG: { density: 1.27, price: 22.0 },
  ABS: { density: 1.04, price: 20.0 },
  TPU: { density: 1.21, price: 35.0 },
  Nylon: { density: 1.14, price: 30.0 },
  ASA: { density: 1.07, price: 28.0 },
  "Standard Resin": { density: 1.18, price: 45.0 },
  "Tough Resin": { density: 1.17, price: 65.0 },
  "Nylon PA12": { density: 1.01, price: 80.0 },
  "316L Steel": { density: 7.95, price: 400.0 },
  AlSi10Mg: { density: 2.67, price: 350.0 },
  Ti6Al4V: { density: 4.43, price: 600.0 },
};

const CURRENCIES = ["USD", "EUR", "GBP", "RUB", "CNY", "JPY"];

const defaultParams = {
  technology: "FDM",
  material_name: "PLA",
  material_density_g_cm3: 1.24,
  material_price_per_kg: 20.0,
  material_waste_factor: 1.05,
  infill_percent: 20,
  support_percent: 10,
  print_time_hours: 1.0,
  postprocess_time_hours: 0.5,
  modeling_time_hours: 0.5,
  quantity: 1,
  is_series: false,
  markup_coefficient: 1.5,
  defect_rate_percent: 2.0,
  tax_percent: 20.0,
  depreciation_per_hour: 0.5,
  electricity_cost_per_kwh: 0.12,
  printer_power_kw: 0.25,
  operator_rate_per_hour: 15.0,
  currency: "USD",
};

export default function ParametersForm({ initialParams, onParamsChange }) {
  const [params, setParams] = useState({ ...defaultParams, ...initialParams });
  const [collapsed, setCollapsed] = useState({
    material: false,
    print: false,
    economy: false,
  });

  // Debounce emit
  useEffect(() => {
    const t = setTimeout(() => onParamsChange(params), 300);
    return () => clearTimeout(t);
  }, [params]);

  const set = (key, value) => setParams((p) => ({ ...p, [key]: value }));

  const handleTechChange = (tech) => {
    const materials = MATERIALS[tech] || [];
    const mat = materials[0] || "PLA";
    const preset = MATERIAL_PRESETS[mat] || {};
    setParams((p) => ({
      ...p,
      technology: tech,
      material_name: mat,
      material_density_g_cm3: preset.density ?? p.material_density_g_cm3,
      material_price_per_kg: preset.price ?? p.material_price_per_kg,
    }));
  };

  const handleMaterialChange = (mat) => {
    const preset = MATERIAL_PRESETS[mat] || {};
    setParams((p) => ({
      ...p,
      material_name: mat,
      material_density_g_cm3: preset.density ?? p.material_density_g_cm3,
      material_price_per_kg: preset.price ?? p.material_price_per_kg,
    }));
  };

  const toggle = (section) => setCollapsed((c) => ({ ...c, [section]: !c[section] }));

  const Section = ({ id, title, children }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium text-gray-700"
      >
        {title}
        <span className="text-gray-400">{collapsed[id] ? "▶" : "▼"}</span>
      </button>
      {!collapsed[id] && <div className="p-4 grid grid-cols-2 gap-3">{children}</div>}
    </div>
  );

  const Field = ({ label, children, full }) => (
    <div className={full ? "col-span-2" : ""}>
      <label className="label">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="text-sm">
      {/* Technology */}
      <div className="mb-3">
        <label className="label">Technology</label>
        <div className="flex flex-wrap gap-2">
          {TECHNOLOGIES.map((t) => (
            <button
              key={t}
              onClick={() => handleTechChange(t)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                params.technology === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <Section id="material" title="🧱 Material">
        <Field label="Material" full>
          <select
            className="input"
            value={params.material_name}
            onChange={(e) => handleMaterialChange(e.target.value)}
          >
            {(MATERIALS[params.technology] || []).map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Density (g/cm³)">
          <input
            className="input"
            type="number"
            step="0.01"
            value={params.material_density_g_cm3}
            onChange={(e) => set("material_density_g_cm3", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Price (per kg)">
          <input
            className="input"
            type="number"
            step="0.1"
            value={params.material_price_per_kg}
            onChange={(e) => set("material_price_per_kg", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Waste factor" full>
          <input
            className="input"
            type="number"
            step="0.01"
            min="1"
            value={params.material_waste_factor}
            onChange={(e) => set("material_waste_factor", parseFloat(e.target.value) || 1)}
          />
        </Field>
      </Section>

      <Section id="print" title="⚙️ Print Settings">
        <Field label="Infill (%)">
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            value={params.infill_percent}
            onChange={(e) => set("infill_percent", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Supports (%)">
          <input
            className="input"
            type="number"
            min="0"
            max="100"
            value={params.support_percent}
            onChange={(e) => set("support_percent", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Print time (h)">
          <input
            className="input"
            type="number"
            step="0.1"
            min="0"
            value={params.print_time_hours}
            onChange={(e) => set("print_time_hours", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Post-process (h)">
          <input
            className="input"
            type="number"
            step="0.1"
            min="0"
            value={params.postprocess_time_hours}
            onChange={(e) => set("postprocess_time_hours", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Modeling time (h)" full>
          <input
            className="input"
            type="number"
            step="0.1"
            min="0"
            value={params.modeling_time_hours}
            onChange={(e) => set("modeling_time_hours", parseFloat(e.target.value) || 0)}
          />
        </Field>
      </Section>

      <Section id="economy" title="💰 Economics">
        <Field label="Quantity">
          <input
            className="input"
            type="number"
            min="1"
            value={params.quantity}
            onChange={(e) => set("quantity", parseInt(e.target.value) || 1)}
          />
        </Field>
        <Field label="Markup ×">
          <input
            className="input"
            type="number"
            step="0.1"
            min="1"
            value={params.markup_coefficient}
            onChange={(e) => set("markup_coefficient", parseFloat(e.target.value) || 1)}
          />
        </Field>
        <Field label="Defect rate (%)">
          <input
            className="input"
            type="number"
            step="0.1"
            min="0"
            max="99"
            value={params.defect_rate_percent}
            onChange={(e) => set("defect_rate_percent", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Tax (%)">
          <input
            className="input"
            type="number"
            step="0.1"
            min="0"
            value={params.tax_percent}
            onChange={(e) => set("tax_percent", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Depreciation (per h)">
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={params.depreciation_per_hour}
            onChange={(e) => set("depreciation_per_hour", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Electricity (per kWh)">
          <input
            className="input"
            type="number"
            step="0.01"
            min="0"
            value={params.electricity_cost_per_kwh}
            onChange={(e) => set("electricity_cost_per_kwh", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Printer power (kW)">
          <input
            className="input"
            type="number"
            step="0.05"
            min="0"
            value={params.printer_power_kw}
            onChange={(e) => set("printer_power_kw", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Operator rate (per h)">
          <input
            className="input"
            type="number"
            step="0.5"
            min="0"
            value={params.operator_rate_per_hour}
            onChange={(e) => set("operator_rate_per_hour", parseFloat(e.target.value) || 0)}
          />
        </Field>
        <Field label="Series production" full>
          <label className="flex items-center gap-2 cursor-pointer mt-1">
            <input
              type="checkbox"
              checked={params.is_series}
              onChange={(e) => set("is_series", e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600"
            />
            <span className="text-sm text-gray-600">Apply series discount (5% for qty &gt; 10)</span>
          </label>
        </Field>
        <Field label="Currency">
          <select
            className="input"
            value={params.currency}
            onChange={(e) => set("currency", e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
      </Section>
    </div>
  );
}
