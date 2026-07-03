import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Book,
  BriefcaseBusiness,
  Bus,
  Car,
  Coffee,
  Dumbbell,
  Film,
  Fuel,
  Gift,
  GraduationCap,
  Heart,
  Home,
  Landmark,
  Music,
  Plane,
  Shirt,
  ShoppingBag,
  Smartphone,
  Stethoscope,
  Utensils,
  Zap
} from 'lucide-react'

export type CategoryIconOption = {
  key: string
  label: string
  Icon: LucideIcon
}

export const categoryIconOptions: CategoryIconOption[] = [
  { key: 'shopping', label: 'Shopping', Icon: ShoppingBag },
  { key: 'groceries', label: 'Groceries', Icon: ShoppingBag },
  { key: 'coffee', label: 'Coffee', Icon: Coffee },
  { key: 'food', label: 'Food', Icon: Utensils },
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'utilities', label: 'Utilities', Icon: Zap },
  { key: 'car', label: 'Car', Icon: Car },
  { key: 'transport', label: 'Transit', Icon: Bus },
  { key: 'fuel', label: 'Fuel', Icon: Fuel },
  { key: 'health', label: 'Health', Icon: Activity },
  { key: 'medical', label: 'Medical', Icon: Stethoscope },
  { key: 'gift', label: 'Gifts', Icon: Gift },
  { key: 'travel', label: 'Travel', Icon: Plane },
  { key: 'education', label: 'School', Icon: GraduationCap },
  { key: 'books', label: 'Books', Icon: Book },
  { key: 'music', label: 'Music', Icon: Music },
  { key: 'entertainment', label: 'Movies', Icon: Film },
  { key: 'fitness', label: 'Fitness', Icon: Dumbbell },
  { key: 'clothing', label: 'Clothing', Icon: Shirt },
  { key: 'work', label: 'Work', Icon: BriefcaseBusiness },
  { key: 'bank', label: 'Banking', Icon: Landmark },
  { key: 'phone', label: 'Phone', Icon: Smartphone },
  { key: 'heart', label: 'Care', Icon: Heart }
]

export const categoryIconMap = categoryIconOptions.reduce<Record<string, LucideIcon>>(
  (map, option) => {
    map[option.key] = option.Icon
    return map
  },
  {}
)

export const categoryColorOptions = [
  'oklch(0.55 0.24 265)',
  'oklch(0.65 0.22 200)',
  'oklch(0.7 0.18 150)',
  'oklch(0.65 0.22 30)',
  'oklch(0.65 0.22 0)',
  'oklch(0.65 0.22 320)',
  'oklch(0.75 0.15 80)',
  'oklch(0.58 0.2 230)',
  'oklch(0.62 0.18 120)',
  'oklch(0.6 0.2 300)',
  'oklch(0.52 0.16 20)',
  'oklch(0.48 0.13 250)'
]
