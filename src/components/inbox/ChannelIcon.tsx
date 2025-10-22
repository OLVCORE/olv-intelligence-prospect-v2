import { Mail, MessageSquare, Instagram, Facebook, Linkedin, Twitter, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelIconProps {
  channel: string;
  provider?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ChannelIcon({ channel, provider, size = 'md', className }: ChannelIconProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const iconSize = sizeClasses[size];

  // Email providers
  if (channel === 'email') {
    if (provider === 'gmail') {
      return (
        <div className={cn('relative', className)}>
          <Mail className={cn(iconSize, 'text-red-600')} />
        </div>
      );
    }
    if (provider === 'outlook' || provider === 'imap_smtp') {
      return (
        <div className={cn('relative', className)}>
          <Mail className={cn(iconSize, 'text-blue-600')} />
        </div>
      );
    }
    return <Mail className={cn(iconSize, 'text-blue-600', className)} />;
  }

  // WhatsApp
  if (channel === 'whatsapp') {
    return (
      <div className={cn('relative', className)}>
        <MessageSquare className={cn(iconSize, 'text-green-600')} />
      </div>
    );
  }

  // Instagram
  if (channel === 'instagram') {
    return (
      <div className={cn('relative', className)}>
        <Instagram className={cn(iconSize, 'text-pink-600')} />
      </div>
    );
  }

  // Facebook
  if (channel === 'facebook') {
    return (
      <div className={cn('relative', className)}>
        <Facebook className={cn(iconSize, 'text-blue-700')} />
      </div>
    );
  }

  // LinkedIn
  if (channel === 'linkedin') {
    return (
      <div className={cn('relative', className)}>
        <Linkedin className={cn(iconSize, 'text-blue-800')} />
      </div>
    );
  }

  // Twitter/X
  if (channel === 'twitter' || channel === 'x') {
    return (
      <div className={cn('relative', className)}>
        <Twitter className={cn(iconSize, 'text-sky-500')} />
      </div>
    );
  }

  // SMS
  if (channel === 'sms') {
    return (
      <div className={cn('relative', className)}>
        <Phone className={cn(iconSize, 'text-purple-600')} />
      </div>
    );
  }

  // Default
  return <Mail className={cn(iconSize, 'text-muted-foreground', className)} />;
}
