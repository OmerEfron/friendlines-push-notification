export function timeAgo(timestamp: number): string {
  const diff = Math.floor((Date.now() - timestamp) / 1000);
  
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export const avatarEmojis = [
  '🦉', '🦁', '🦊', '🐼', '🐨', '🐸', '🦋', '🐙', 
  '🦜', '🦚', '🦒', '🦓', '🦘', '🦥', '🦦', '🦨'
];

export function getRandomAvatar(): string {
  return avatarEmojis[Math.floor(Math.random() * avatarEmojis.length)];
} 