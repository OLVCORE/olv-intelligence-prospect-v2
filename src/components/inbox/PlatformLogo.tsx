import { cn } from '@/lib/utils';

interface PlatformLogoProps {
  platform: string;
  provider?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PlatformLogo({ platform, provider, size = 'md', className }: PlatformLogoProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-10 h-10',
  };

  const sizeClass = sizeClasses[size];

  // Gmail
  if (platform === 'email' && provider === 'gmail') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L12 9.545l8.073-6.052C21.69 2.28 24 3.434 24 5.457z" fill="#EA4335"/>
      </svg>
    );
  }

  // Outlook
  if (platform === 'email' && (provider === 'outlook' || provider === 'imap_smtp')) {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M24 7.386v9.228c0 .662-.536 1.198-1.198 1.198h-8.25v-11h8.25c.662 0 1.198.536 1.198 1.198v-.624z" fill="#0364B8"/>
        <path d="M14.552 17.812h8.25c.662 0 1.198-.536 1.198-1.198V7.386c0-.662-.536-1.198-1.198-1.198h-8.25v11.624z" fill="#0078D4"/>
        <path d="M14.552 6.188V4.99c0-.662-.536-1.198-1.198-1.198H1.198C.536 3.792 0 4.328 0 4.99v14.02c0 .662.536 1.198 1.198 1.198h12.156c.662 0 1.198-.536 1.198-1.198v-1.198" fill="#28A8EA"/>
        <path d="M7.677 8.385c-2.07 0-3.75 1.68-3.75 3.75s1.68 3.75 3.75 3.75 3.75-1.68 3.75-3.75-1.68-3.75-3.75-3.75zm0 6.042c-1.266 0-2.292-1.026-2.292-2.292s1.026-2.292 2.292-2.292 2.292 1.026 2.292 2.292-1.026 2.292-2.292 2.292z" fill="#0078D4"/>
      </svg>
    );
  }

  // Generic Email
  if (platform === 'email') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#5F6368"/>
      </svg>
    );
  }

  // WhatsApp
  if (platform === 'social' && provider === 'whatsapp') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="#25D366"/>
      </svg>
    );
  }

  // Instagram
  if (platform === 'social' && provider === 'instagram') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <defs>
          <radialGradient id="instagram-gradient" cx="30%" cy="107%" r="150%">
            <stop offset="0%" stopColor="#FDF497"/>
            <stop offset="5%" stopColor="#FDF497"/>
            <stop offset="45%" stopColor="#FD5949"/>
            <stop offset="60%" stopColor="#D6249F"/>
            <stop offset="90%" stopColor="#285AEB"/>
          </radialGradient>
        </defs>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" fill="url(#instagram-gradient)"/>
      </svg>
    );
  }

  // Facebook
  if (platform === 'social' && provider === 'facebook') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
      </svg>
    );
  }

  // LinkedIn
  if (platform === 'social' && provider === 'linkedin') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" fill="#0A66C2"/>
      </svg>
    );
  }

  // Twitter/X
  if (platform === 'social' && (provider === 'twitter' || provider === 'x')) {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="#000000"/>
      </svg>
    );
  }

  // SMS
  if (platform === 'communication' && provider === 'sms') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" fill="#9C27B0"/>
      </svg>
    );
  }

  // Telegram
  if (platform === 'social' && provider === 'telegram') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" fill="#26A5E4"/>
      </svg>
    );
  }

  // Yahoo Mail
  if (platform === 'email' && provider === 'yahoo') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M12.004 0C5.377 0 0 5.377 0 12.004 0 18.628 5.377 24 12.004 24 18.628 24 24 18.628 24 12.004 24 5.377 18.628 0 12.004 0zm-1.907 6.798h3.073l-3.92 7.856v4.652H6.868v-4.652L2.95 6.798h3.073l2.537 5.335 2.537-5.335z" fill="#6001D2"/>
      </svg>
    );
  }

  // Zoho Mail
  if (platform === 'email' && provider === 'zoho') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 17.341H6.106V6.659h11.788v10.682z" fill="#C8202F"/>
      </svg>
    );
  }

  // iCloud Mail
  if (platform === 'email' && provider === 'icloud') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M13.762 4.29a6.51 6.51 0 0 0-5.669 3.332 3.571 3.571 0 0 0-1.558-.36 3.571 3.571 0 0 0-3.516 3A4.918 4.918 0 0 0 0 14.796a4.918 4.918 0 0 0 4.92 4.914 4.93 4.93 0 0 0 .617-.045h14.42c2.305-.272 4.041-2.258 4.043-4.589v-1.924a4.543 4.543 0 0 0-3.67-4.465 6.514 6.514 0 0 0-6.568-4.392z" fill="#3693F3"/>
      </svg>
    );
  }

  // Custom Email
  if (platform === 'email' && provider === 'custom') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#5F6368"/>
        <circle cx="18" cy="6" r="3" fill="#4CAF50"/>
        <path d="M18 4.5v3M16.5 6h3" stroke="white" strokeWidth="0.8" strokeLinecap="round"/>
      </svg>
    );
  }

  // CRM - HubSpot
  if (platform === 'crm' && provider === 'hubspot') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M18.164 7.93V5.084a2.198 2.198 0 10-1.02 0v2.845A4.102 4.102 0 0014.332 12l-4.328-3.382a2.198 2.198 0 10-.844.654L13.488 12.7a4.102 4.102 0 105.51-4.273l-.834-.497zm-.666 8.18a2.58 2.58 0 110-5.16 2.58 2.58 0 010 5.16z" fill="#FF7A59"/>
      </svg>
    );
  }

  // CRM - Salesforce
  if (platform === 'crm' && provider === 'salesforce') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M10.006 5.415a3.807 3.807 0 013.223-1.82c1.567 0 2.939.961 3.519 2.327a4.2 4.2 0 011.608-.32c2.218 0 4.016 1.797 4.016 4.016 0 .344-.043.678-.124.998a3.465 3.465 0 011.857 3.063c0 1.92-1.558 3.478-3.478 3.478h-1.043v.124c0 1.92-1.558 3.478-3.478 3.478a3.484 3.484 0 01-2.668-1.247 4.015 4.015 0 01-2.954 1.302c-1.814 0-3.338-1.202-3.831-2.852a3.465 3.465 0 01-2.06-3.169c0-1.488.94-2.755 2.259-3.256a4.015 4.015 0 01-.196-1.23c0-2.218 1.797-4.015 4.015-4.015.589 0 1.147.128 1.651.356.215-.092.443-.16.684-.212z" fill="#00A1E0"/>
      </svg>
    );
  }

  // CRM - Pipedrive
  if (platform === 'crm' && provider === 'pipedrive') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M17.429 0c-1.68 0-3.22.797-4.191 2.044a5.488 5.488 0 00-1.81-.305c-3.037 0-5.5 2.463-5.5 5.5 0 .478.061.942.176 1.383A4.73 4.73 0 002.857 13.5 4.73 4.73 0 007.714 18h9.715c2.618 0 4.714-2.096 4.714-4.714 0-2.172-1.467-3.993-3.476-4.548a5.488 5.488 0 00-1.238-8.738z" fill="#1B1B1B"/>
      </svg>
    );
  }

  // CRM - Bitrix24
  if (platform === 'crm' && provider === 'bitrix24') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M14.901 5.613l-3.81 3.81-3.811-3.81L0 12.896l7.28 7.281 3.811-3.81 3.81 3.81L24 12.896l-9.099-7.283zM7.28 15.705l-3.81-3.81 3.81-3.81 3.81 3.81-3.81 3.81zm9.62 0l-3.81-3.81 3.81-3.81 3.81 3.81-3.81 3.81z" fill="#2FC7F7"/>
      </svg>
    );
  }

  // Automation - Zapier
  if (platform === 'automation' && provider === 'zapier') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.515 14.47l-2.018 2.019-3.497-3.497-3.497 3.497-2.018-2.018 3.497-3.498L6.485 7.476l2.018-2.018 3.497 3.497 3.497-3.497 2.018 2.018-3.497 3.497 3.497 3.498z" fill="#FF4A00"/>
      </svg>
    );
  }

  // Automation - Make (Integromat)
  if (platform === 'automation' && provider === 'make') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M8.042 5.308a1.635 1.635 0 100-3.27 1.635 1.635 0 000 3.27zM15.958 5.308a1.635 1.635 0 100-3.27 1.635 1.635 0 000 3.27zM8.042 13.5a1.635 1.635 0 100-3.27 1.635 1.635 0 000 3.27zM12 13.5a1.635 1.635 0 100-3.27 1.635 1.635 0 000 3.27zM15.958 13.5a1.635 1.635 0 100-3.27 1.635 1.635 0 000 3.27zM8.042 21.962a1.635 1.635 0 100-3.27 1.635 1.635 0 000 3.27zM15.958 21.962a1.635 1.635 0 100-3.27 1.635 1.635 0 000 3.27z" fill="#6D00CC"/>
      </svg>
    );
  }

  // Support - Intercom
  if (platform === 'support' && provider === 'intercom') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M4.5 0A4.5 4.5 0 000 4.5v15A4.5 4.5 0 004.5 24h15a4.5 4.5 0 004.5-4.5v-15A4.5 4.5 0 0019.5 0h-15zM6 8.25A.75.75 0 016.75 7.5h1.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-7.5zm4.5 0a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-7.5zm4.5 0a.75.75 0 01.75-.75h1.5a.75.75 0 01.75.75v7.5a.75.75 0 01-.75.75h-1.5a.75.75 0 01-.75-.75v-7.5z" fill="#0062FF"/>
      </svg>
    );
  }

  // Support - Zendesk
  if (platform === 'support' && provider === 'zendesk') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M12.914 2.904V16.29L24 2.904H12.914zM0 16.29h11.086V2.904L0 16.29zm13.096 2.002c0 .996-.807 1.804-1.803 1.804H1.804A1.804 1.804 0 010 18.292V7.805L13.096 21.1v-2.808z" fill="#03363D"/>
      </svg>
    );
  }

  // CRM - Kommo
  if (platform === 'crm' && provider === 'kommo') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#29CC6A"/>
        <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" fill="white"/>
      </svg>
    );
  }

  // CRM - RD Station
  if (platform === 'crm' && provider === 'rd_station') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#1B1464"/>
        <path d="M8 7h4c2.21 0 4 1.79 4 4s-1.79 4-4 4h-1v2H8V7zm3 6h1c1.1 0 2-.9 2-2s-.9-2-2-2h-1v4z" fill="#00D563"/>
      </svg>
    );
  }

  // CRM - Agendor
  if (platform === 'crm' && provider === 'agendor') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#1AA3FF"/>
        <path d="M12 6l6 4.5v7.5H6v-7.5L12 6z" fill="white"/>
        <circle cx="12" cy="14" r="2" fill="#1AA3FF"/>
      </svg>
    );
  }

  // CRM - ActiveCampaign
  if (platform === 'crm' && provider === 'activecampaign') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#356AE6"/>
        <path d="M16 8l-4 8-4-8h2l2 4 2-4z" fill="white" stroke="white" strokeWidth="1.5"/>
      </svg>
    );
  }

  // Communication - Slack
  if (platform === 'communication' && provider === 'slack') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M5.042 15.165a2.528 2.528 0 01-2.52 2.523A2.528 2.528 0 010 15.165a2.527 2.527 0 012.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 012.521-2.52 2.527 2.527 0 012.521 2.52v6.313A2.528 2.528 0 018.834 24a2.528 2.528 0 01-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 01-2.521-2.52A2.528 2.528 0 018.834 0a2.528 2.528 0 012.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 012.521 2.521 2.528 2.528 0 01-2.521 2.521H2.522A2.528 2.528 0 010 8.834a2.528 2.528 0 012.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 012.522-2.521A2.528 2.528 0 0124 8.834a2.528 2.528 0 01-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 01-2.523 2.521 2.527 2.527 0 01-2.52-2.521V2.522A2.527 2.527 0 0115.165 0a2.528 2.528 0 012.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 012.523 2.522A2.528 2.528 0 0115.165 24a2.527 2.527 0 01-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 01-2.52-2.523 2.526 2.526 0 012.52-2.52h6.313A2.527 2.527 0 0124 15.165a2.528 2.528 0 01-2.522 2.523h-6.313z" fill="#E01E5A"/>
      </svg>
    );
  }

  // Communication - Microsoft Teams
  if (platform === 'communication' && provider === 'teams') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <rect x="0" y="0" width="24" height="24" rx="2" fill="#5059C9"/>
        <path d="M15.186 10.53h3.6v8.26h-3.6v-8.26z" fill="white"/>
        <path d="M12.12 7.565V6.306A2.053 2.053 0 0114.174 4.252h0a2.053 2.053 0 012.054 2.054v1.259a2.053 2.053 0 01-2.054 2.054h0a2.053 2.053 0 01-2.054-2.054z" fill="white"/>
        <path d="M5.36 7.565h6.76v11.223H5.36V7.565z" fill="white" fillOpacity=".7"/>
        <text x="8.5" y="15" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="#5059C9" textAnchor="middle">T</text>
      </svg>
    );
  }

  // Communication - VoIP/Voice
  if (platform === 'communication' && provider === 'voice') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="#4CAF50"/>
      </svg>
    );
  }

  // Support - Drift
  if (platform === 'support' && provider === 'drift') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="11" fill="#2D2E6E"/>
        <path d="M17 10c0-2.76-2.24-5-5-5S7 7.24 7 10v7h10v-7zm-5 9c-1.1 0-2-.9-2-2h4c0 1.1-.9 2-2 2z" fill="#01D5C3"/>
      </svg>
    );
  }

  // Support - Freshdesk
  if (platform === 'support' && provider === 'freshdesk') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#28BB87"/>
        <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="white"/>
        <circle cx="12" cy="12" r="2" fill="white"/>
      </svg>
    );
  }

  // Automation - n8n
  if (platform === 'automation' && provider === 'n8n') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#FF6D5A"/>
        <path d="M8 8h3v8H8V8zm5 0h3v8h-3V8z" fill="white"/>
      </svg>
    );
  }

  // CRM - Zoho CRM (specific icon)
  if (platform === 'crm' && provider === 'zoho_crm') {
    return (
      <svg className={cn(sizeClass, className)} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="4" fill="#E42527"/>
        <path d="M6 8h12v2H6V8zm0 4h12v2H6v-2zm0 4h8v2H6v-2z" fill="white"/>
      </svg>
    );
  }

  // Default fallback
  return (
    <div className={cn(sizeClass, 'bg-muted rounded flex items-center justify-center', className)}>
      <span className="text-xs font-medium">{platform[0]?.toUpperCase() || '?'}</span>
    </div>
  );
}
