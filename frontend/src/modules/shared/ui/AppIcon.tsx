import { color as colors } from '@manabandhu/design-system';
import {
  Apple,
  Bed,
  Bell,
  Book,
  Calendar,
  Car,
  Cart,
  Check,
  Community,
  Compass,
  DeliveryTruck,
  Eye,
  EyeClosed,
  Globe,
  Google,
  HelpCircle,
  Home,
  Key,
  Lock,
  LogOut,
  Mail,
  Map as MapIcon,
  MessageText,
  NavArrowDown,
  NavArrowLeft,
  NavArrowRight,
  Package,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparks,
  Star,
  Suitcase,
  User,
  UserBadgeCheck,
  Wallet,
  WarningTriangle,
  Wrench,
} from 'iconoir-react-native';
import type { ColorValue } from 'react-native';

export type AppIconName =
  | 'apple'
  | 'bed'
  | 'bell'
  | 'book'
  | 'briefcase'
  | 'calendar'
  | 'car'
  | 'check'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'community'
  | 'compass'
  | 'delivery'
  | 'eye'
  | 'eye-closed'
  | 'globe'
  | 'google'
  | 'help'
  | 'home'
  | 'key'
  | 'lock'
  | 'logout'
  | 'mail'
  | 'map'
  | 'marketplace'
  | 'message'
  | 'package'
  | 'phone'
  | 'plus'
  | 'search'
  | 'shield'
  | 'sparks'
  | 'star'
  | 'user'
  | 'verified-user'
  | 'wallet'
  | 'warning'
  | 'wrench';

const iconMap = {
  apple: Apple,
  bed: Bed,
  bell: Bell,
  book: Book,
  briefcase: Suitcase,
  calendar: Calendar,
  car: Car,
  check: Check,
  'chevron-down': NavArrowDown,
  'chevron-left': NavArrowLeft,
  'chevron-right': NavArrowRight,
  community: Community,
  compass: Compass,
  delivery: DeliveryTruck,
  eye: Eye,
  'eye-closed': EyeClosed,
  globe: Globe,
  google: Google,
  help: HelpCircle,
  home: Home,
  key: Key,
  lock: Lock,
  logout: LogOut,
  mail: Mail,
  map: MapIcon,
  marketplace: Cart,
  message: MessageText,
  package: Package,
  phone: Phone,
  plus: Plus,
  search: Search,
  shield: ShieldCheck,
  sparks: Sparks,
  star: Star,
  user: User,
  'verified-user': UserBadgeCheck,
  wallet: Wallet,
  warning: WarningTriangle,
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
