import Image from 'next/image'
import { cn } from '@/lib/utils'

interface Props {
  className?: string
  size?: number
}

export default function MLBLogo({ className, size = 24 }: Props) {
  return (
    <Image
      src="/brand/mlb-logo.png"
      alt="MLB"
      width={size}
      height={Math.round(size * 0.55)}
      className={cn('object-contain', className)}
    />
  )
}
