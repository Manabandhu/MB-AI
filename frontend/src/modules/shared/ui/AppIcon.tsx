import { color as colors } from '@manabandhu/design-system';
import {
  Bed,
  Bell,
  Book,
  Calendar,
  Car,
  Cart,
  Community,
  Compass,
  DeliveryTruck,
  HelpCircle,
  Home,
  Map as MapIcon,
  MessageText,
  NavArrowRight,
  Package,
  Plus,
  Search,
  ShieldCheck,
  Suitcase,
  User,
  UserBadgeCheck,
  Wallet,
  Wrench,
} from 'iconoir-react-native';
import type { ColorValue } from 'react-native';

export type AppIconName =
  | 'bed'
  | 'bell'
  | 'book'
  | 'briefcase'
  | 'calendar'
  | 'car'
  | 'chevron-right'
  | 'community'
  | 'compass'
  | 'delivery'
  | 'help'
  | 'home'
  | 'map'
  | 'marketplace'
  | 'message'
  | 'package'
  | 'plus'
  | 'search'
  | 'shield'
  | 'user'
  | 'verified-user'
  | 'wallet'
  | 'wrench';

const iconMap = {
  bed: Bed,
  bell: Bell,
  book: Book,
  briefcase: Suitcase,
  calendar: Calendar,
  car: Car,
  'chevron-right': NavArrowRight,
  community: Community,
  compass: Compass,
  delivery: DeliveryTruck,
  help: HelpCircle,
  home: Home,
  map: MapIcon,
  marketplace: Cart,
  message: MessageText,
  package: Package,
  plus: Plus,
  search: Search,
  shield: ShieldCheck,
  user: User,
  'verified-user': UserBadgeCheck,
  wallet: Wallet,
  wrench: Wrench,
} as const;

type AppIconProps = {
  name: AppIconName;
  color?: ColorValue;
  size?: number;
  strokeWidth?: number;
};

export function AppIcon({ name, color = colors.ink, size = 20, strokeWidth = 2.25 }: AppIconProps) {
  const Icon = iconMap[name];
  return <Icon color={color} height={size} strokeWidth={strokeWidth} width={size} />;
}
