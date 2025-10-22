import { PlatformLogo } from './PlatformLogo';

interface ChannelIconProps {
  channel: string;
  provider?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ChannelIcon({ channel, provider, size = 'md', className }: ChannelIconProps) {
  return <PlatformLogo platform={channel} provider={provider} size={size} className={className} />;
}
