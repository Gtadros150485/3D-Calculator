export default function PriceBreakdown({ calc }) {
  if (!calc || !calc.price_per_unit) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-gray-400 gap-2">
        <p className="text-sm">Configure parameters to see price</p>
      </div>
    );
  }

  const cur = calc.currency || "USD";
  const fmt = (n) => (typeof n === "number" ? n.toFixed(2) : "0.00");
  const pct = (n, total) =>
    total > 0 ? Math.round((n / total) * 100) : 0;

  const costTotal = (calc.cost_after_defect || 0);

  const rows = [
    {
      label: "Material",
      value: calc.material_cost,
      color: "bg-blue-500",
      pct: pct(calc.material_cost, costTotal),
    },
    {
      label: "Labor",
      value: calc.labor_cost,
      color: "bg-indigo-500",
      pct: pct(calc.labor_cost, costTotal),
    },
    {
      label: "Electricity",
      value: calc.electricity_cost,
      color: "bg-yellow-500",
      pct: pct(calc.electricity_cost, costTotal),
    },
    {
      label: "Depreciation",
      value: calc.depreciation_cost,
      color: "bg-orange-500",
      pct: pct(calc.depreciation_cost, costTotal),
    },
    {
      label: "Defect risk",
      value: calc.defect_cost,
      color: "bg-red-400",
      pct: pct(calc.defect_cost, costTotal),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Model info */}
      {calc.weight_g > 0 && (
        <div className="grid grid-cols-2 gap-2 p-3 bg-gray-50 rounded-lg text-xs">
          <div>
            <span className="text-gray-500">Weight</span>
            <div className="font-semibold">{calc.weight_g?.toFixed(1)} g</div>
          </div>
          <div>
            <span className="text-gray-500">Total time</span>
            <div className="font-semibold">{calc.total_time_hours?.toFixed(1)} h</div>
          </div>
          <div>
            <span className="text-gray-500">Material vol.</span>
            <div className="font-semibold">{calc.total_material_volume_cm3?.toFixed(2)} cm³</div>
          </div>
          <div>
            <span className="text-gray-500">Qty</span>
            <div className="font-semibold">{calc.quantity} pcs</div>
          </div>
        </div>
      )}

      {/* Cost breakdown bars */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Cost breakdown</p>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-600">{row.label}</span>
                <span className="font-medium">
                  {fmt(row.value)} {cur}
                  <span className="text-gray-400 ml-1">({row.pct}%)</span>
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className={`${row.color} h-1.5 rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(row.pct, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price summary */}
      <div className="border-t border-gray-200 pt-3 space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Cost per unit</span>
          <span>{fmt(calc.cost_after_defect)} {cur}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Markup ×{calc.markup_coefficient}</span>
          <span>+{fmt(calc.profit)} {cur}</span>
        </div>
        {calc.series_discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Series discount</span>
            <span>−{fmt(calc.series_discount)} {cur}</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Tax ({calc.tax_amount > 0 ? "incl." : "0%"})</span>
          <span>+{fmt(calc.tax_amount)} {cur}</span>
        </div>
      </div>

      {/* Final prices */}
      <div className="bg-blue-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-blue-700 font-medium">Price per unit</span>
          <span className="text-2xl font-bold text-blue-800">
            {fmt(calc.price_per_unit)} {cur}
          </span>
        </div>
        {calc.quantity > 1 && (
          <div className="flex justify-between items-center border-t border-blue-200 pt-2">
            <span className="text-sm text-blue-600">Total ({calc.quantity} pcs)</span>
            <span className="text-xl font-bold text-blue-800">
              {fmt(calc.total_price)} {cur}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
