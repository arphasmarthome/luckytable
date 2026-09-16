/* Screen brightness (30–100%). */
import { RangeSlider } from "./RangeSlider";

export function BrightnessSlider({ value, onChange, accessibilityLabel }: { value: number; onChange: (value: number) => void; accessibilityLabel: string }) {
  return <RangeSlider value={value} onChange={onChange} min={30} max={100} step={5} accessibilityLabel={accessibilityLabel} format={(v) => `${v}%`} />;
}
