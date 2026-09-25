import { RotateCcw } from 'lucide-react'
import { FORMATS, FORMAT_IDS } from '#/config/dimensions'
import { Button } from '#/components/ui/button'
import { Label } from '#/components/ui/label'
import { RadioGroup, RadioGroupItem } from '#/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Slider } from '#/components/ui/slider'
import { Switch } from '#/components/ui/switch'
import type { Settings } from '#/state/types'

interface Props {
  settings: Settings
  perSheet: number
  onChange: (patch: Partial<Settings>) => void
  onReset: () => void
}

function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => {
          const match = options.find((o) => o.value === v)
          if (match) onChange(match.value)
        }}
        className="flex flex-wrap gap-4"
      >
        {options.map((o) => (
          <Label key={o.value} className="flex items-center gap-2 font-normal">
            <RadioGroupItem value={o.value} /> {o.label}
          </Label>
        ))}
      </RadioGroup>
    </div>
  )
}

function MmSlider({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <Label>{label}</Label>
        <span className="text-muted-foreground text-sm tabular-nums">
          {value.toFixed(1)} mm
        </span>
      </div>
      <Slider
        min={0}
        max={10}
        step={0.5}
        value={[value]}
        onValueChange={([v]) => v !== undefined && onChange(v)}
      />
    </div>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <Label className="flex items-center justify-between font-normal">
      {label}
      <Switch checked={checked} onCheckedChange={onChange} />
    </Label>
  )
}

function fmt(mm: number): string {
  return Number.isInteger(mm) ? String(mm) : mm.toFixed(1)
}

export function SettingsPanel({
  settings,
  perSheet,
  onChange,
  onReset,
}: Props) {
  const format = FORMATS[settings.format]
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Settings</h2>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw /> Reset
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="format">Film format</Label>
        <Select
          value={settings.format}
          onValueChange={(v) => {
            const id = FORMAT_IDS.find((f) => f === v)
            if (id) onChange({ format: id })
          }}
        >
          <SelectTrigger id="format" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FORMAT_IDS.map((id) => (
              <SelectItem key={id} value={id}>
                {FORMATS[id].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p
          className={`text-xs ${perSheet === 0 ? 'text-destructive' : 'text-muted-foreground'}`}
        >
          Card {fmt(format.card.w)}×{fmt(format.card.h)} mm · photo{' '}
          {fmt(format.image.w)}×{fmt(format.image.h)} mm ·{' '}
          {perSheet === 0
            ? 'nothing fits — reduce the gap or safe margin'
            : `${perSheet} per sheet`}
        </p>
      </div>
      <Choice
        label="Sheet orientation"
        value={settings.orientation}
        options={[
          { value: 'landscape', label: 'Landscape' },
          { value: 'portrait', label: 'Portrait' },
        ]}
        onChange={(orientation) => onChange({ orientation })}
      />
      <Choice
        label="Border colour"
        value={settings.borderColor}
        options={[
          { value: 'white', label: 'White' },
          { value: 'black', label: 'Black' },
        ]}
        onChange={(borderColor) => onChange({ borderColor })}
      />
      <MmSlider
        label="Gap"
        value={settings.gapMm}
        onChange={(gapMm) => onChange({ gapMm })}
      />
      <MmSlider
        label="Safe margin"
        value={settings.safeMarginMm}
        onChange={(safeMarginMm) => onChange({ safeMarginMm })}
      />
      <Toggle
        label="Cut marks in export"
        checked={settings.cutMarks}
        onChange={(cutMarks) => onChange({ cutMarks })}
      />
      <Toggle
        label="Show safe margin"
        checked={settings.showSafeMargin}
        onChange={(showSafeMargin) => onChange({ showSafeMargin })}
      />
      <Toggle
        label="Show cut layout"
        checked={settings.showCutLayout}
        onChange={(showCutLayout) => onChange({ showCutLayout })}
      />
    </div>
  )
}
