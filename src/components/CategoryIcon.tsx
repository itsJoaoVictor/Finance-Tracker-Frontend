import React from 'react'
import * as Icons from 'lucide-react'

interface CategoryIconProps {
  name: string
  color?: string
  size?: number
  className?: string
}

// Mapeamento de kebab-case ou termos alternativos para componentes reais do Lucide
const iconMap: Record<string, keyof typeof Icons> = {
  'shopping-basket': 'ShoppingBasket',
  'shopping-cart': 'ShoppingCart',
  'shopping-bag': 'ShoppingBag',
  'car': 'Car',
  'home': 'Home',
  'heartbeat': 'HeartPulse',
  'heart-pulse': 'HeartPulse',
  'heart': 'Heart',
  'graduation-cap': 'GraduationCap',
  'smile': 'Smile',
  'help-circle': 'HelpCircle',
  'dollar-sign': 'DollarSign',
  'credit-card': 'CreditCard',
  'activity': 'Activity',
  'coffee': 'Coffee',
  'utensils': 'Utensils',
  'plane': 'Plane',
  'film': 'Film',
  'gift': 'Gift',
  'book': 'Book',
  'music': 'Music',
  'briefcase': 'Briefcase',
}

export function CategoryIcon({ name, color, size = 20, className }: CategoryIconProps) {
  // Tenta resolver a string correspondente no mapa, ou assume PascalCase, ou fallback para HelpCircle
  const resolvedName = iconMap[name.toLowerCase()] || name

  // Obtém o componente de ícone pelo nome resolvido
  const IconComponent = (Icons[resolvedName as keyof typeof Icons] || Icons.HelpCircle) as React.ComponentType<{
    color?: string
    size?: number
    className?: string
  }>

  return <IconComponent color={color} size={size} className={className} />
}
