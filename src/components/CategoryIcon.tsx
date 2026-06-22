import * as LucideIcons from 'lucide-react'

interface CategoryIconProps {
  name: string
  color: string
  size?: number
}

const ICON_MAPPING: Record<string, string> = {
  'heartbeat': 'Activity', // Lucide doesn't have heartbeat, map to Activity
}

function toPascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('')
}

export function CategoryIcon({ name, color, size = 20 }: CategoryIconProps) {
  // Translate icons if needed
  const targetName = ICON_MAPPING[name.toLowerCase()] || name

  const pascalName = toPascalCase(targetName)
  
  // Find matching Lucide icon
  const IconComponent =
    (LucideIcons as any)[pascalName] ||
    (LucideIcons as any)[targetName] ||
    LucideIcons.HelpCircle

  return <IconComponent color={color} size={size} />
}
