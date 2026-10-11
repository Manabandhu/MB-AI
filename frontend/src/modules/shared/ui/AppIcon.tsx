// One file per icon keeps unused Lucide icons out of every bundle.
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import ArrowUpDown from 'lucide-react-native/icons/arrow-up-down';
import BadgeCheck from 'lucide-react-native/icons/badge-check';
import BedDouble from 'lucide-react-native/icons/bed-double';
import Bell from 'lucide-react-native/icons/bell';
import BookOpen from 'lucide-react-native/icons/book-open';
import Bookmark from 'lucide-react-native/icons/bookmark';
import Briefcase from 'lucide-react-native/icons/briefcase';
import Building2 from 'lucide-react-native/icons/building';
import Calendar from 'lucide-react-native/icons/calendar';
import Car from 'lucide-react-native/icons/car';
import Check from 'lucide-react-native/icons/check';
import ChevronDown from 'lucide-react-native/icons/chevron-down';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import CircleHelp from 'lucide-react-native/icons/circle-question-mark';
import Clock from 'lucide-react-native/icons/clock';
import Compass from 'lucide-react-native/icons/compass';
import Ellipsis from 'lucide-react-native/icons/ellipsis';
import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import Globe from 'lucide-react-native/icons/globe';
import GraduationCap from 'lucide-react-native/icons/graduation-cap';
import Handshake from 'lucide-react-native/icons/handshake';
import Heart from 'lucide-react-native/icons/heart';
import Home from 'lucide-react-native/icons/house';
import Key from 'lucide-react-native/icons/key';
import Languages from 'lucide-react-native/icons/languages';
import List from 'lucide-react-native/icons/list';
import ListFilter from 'lucide-react-native/icons/list-filter';
import Lock from 'lucide-react-native/icons/lock';
import LogOut from 'lucide-react-native/icons/log-out';
import Mail from 'lucide-react-native/icons/mail';
import MapIcon from 'lucide-react-native/icons/map';
import MapPin from 'lucide-react-native/icons/map-pin';
import Menu from 'lucide-react-native/icons/menu';
import MessageCircle from 'lucide-react-native/icons/message-circle';
import Minus from 'lucide-react-native/icons/minus';
import Monitor from 'lucide-react-native/icons/monitor';
import Moon from 'lucide-react-native/icons/moon';
import Package from 'lucide-react-native/icons/package';
import PartyPopper from 'lucide-react-native/icons/party-popper';
import Phone from 'lucide-react-native/icons/phone';
import Plane from 'lucide-react-native/icons/plane';
import Plus from 'lucide-react-native/icons/plus';
import Receipt from 'lucide-react-native/icons/receipt';
import RefreshCw from 'lucide-react-native/icons/refresh-cw';
import Repeat from 'lucide-react-native/icons/repeat';
import Search from 'lucide-react-native/icons/search';
import Settings from 'lucide-react-native/icons/settings';
import Share2 from 'lucide-react-native/icons/share-2';
import ShieldCheck from 'lucide-react-native/icons/shield-check';
import ShoppingBag from 'lucide-react-native/icons/shopping-bag';
import Siren from 'lucide-react-native/icons/siren';
import SlidersHorizontal from 'lucide-react-native/icons/sliders-horizontal';
import Sparkles from 'lucide-react-native/icons/sparkles';
import Star from 'lucide-react-native/icons/star';
import Sun from 'lucide-react-native/icons/sun';
import TriangleAlert from 'lucide-react-native/icons/triangle-alert';
import Truck from 'lucide-react-native/icons/truck';
import User from 'lucide-react-native/icons/user';
import Users from 'lucide-react-native/icons/users';
import Wallet from 'lucide-react-native/icons/wallet';
import Wrench from 'lucide-react-native/icons/wrench';
import X from 'lucide-react-native/icons/x';
import Zap from 'lucide-react-native/icons/zap';
import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from 'tamagui';

function GoogleOriginalIcon({ size = 20 }: { size?: number }) {
  return (
    <Svg height={size} viewBox="0 0 24 24" width={size}>
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </Svg>
  );
}

function AppleOriginalIcon({
  color = '#000000',
  size = 20,
}: {
  color?: ColorValue;
  size?: number;
}) {
  const fillColor = typeof color === 'string' ? color : '#000000';
  return (
    <Svg height={size} viewBox="0 0 170 170" width={size}>
      <Path
        d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.7-11.7-13.98-5.77-8.81-10.4-18.79-13.88-29.93-3.49-11.15-5.23-21.73-5.23-31.76 0-13.15 3.26-24.32 9.77-33.51 6.52-9.18 15.02-13.89 25.51-14.12 4.9 0 10.33 1.34 16.29 4.02 5.96 2.68 9.77 4.08 11.43 4.2 1.9-.23 5.92-1.68 12.06-4.35 6.13-2.68 11.66-3.9 16.59-3.66 11.3.65 20.44 4.54 27.42 11.67-9.8 5.98-14.59 14.28-14.37 24.89.22 8.91 3.59 16.36 10.11 22.36 6.52 6 14.14 9.38 22.86 10.15-2.61 7.82-5.65 15.65-9.13 23.49zM119.22 31.84c0-7.39 2.66-14.34 7.98-20.85 5.33-6.52 11.85-10.4 19.56-11.65.65 2.17.98 4.35.98 6.52 0 7.39-2.72 14.4-8.15 21.03-5.43 6.63-12.01 10.37-19.74 11.23-.22-2.17-.63-4.27-.63-6.28z"
        fill={fillColor}
      />
    </Svg>
  );
}

/**
 * Every icon in the app goes through this map, so a future icon-library swap stays in this file. Names describe
 * meaning (`briefcase` for jobs), not the glyph's library name.
 */
const iconMap = {
  'arrow-right': ArrowRight,
  bed: BedDouble,
  bell: Bell,
  book: BookOpen,
  bookmark: Bookmark,
  briefcase: Briefcase,
  building: Building2,
  calendar: Calendar,
  car: Car,
  check: Check,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  clock: Clock,
  close: X,
  community: Users,
  compass: Compass,
  delivery: Truck,
  education: GraduationCap,
  emergency: Siren,
  event: PartyPopper,
  eye: Eye,
  'eye-closed': EyeOff,
  filter: SlidersHorizontal,
  'filter-list': ListFilter,
  globe: Globe,
  handshake: Handshake,
  heart: Heart,
  help: CircleHelp,
  home: Home,
  key: Key,
  list: List,
  language: Languages,
  lock: Lock,
  logout: LogOut,
  mail: Mail,
  map: MapIcon,
  'map-pin': MapPin,
  marketplace: ShoppingBag,
  menu: Menu,
  minus: Minus,
  message: MessageCircle,
  monitor: Monitor,
  moon: Moon,
  more: Ellipsis,
  package: Package,
  phone: Phone,
  plane: Plane,
  plus: Plus,
  receipt: Receipt,
  refresh: RefreshCw,
  repeat: Repeat,
  search: Search,
  settings: Settings,
  share: Share2,
  shield: ShieldCheck,
  sparks: Sparkles,
  star: Star,
  sun: Sun,
  swap: ArrowUpDown,
  user: User,
  'verified-user': BadgeCheck,
  wallet: Wallet,
  warning: TriangleAlert,
  wrench: Wrench,
  zap: Zap,
} as const;

export type AppIconName = keyof typeof iconMap | 'apple' | 'google';

type AppIconProps = {
  name: AppIconName;
  /** Defaults to the current theme's text colour, so icons follow light and dark mode. */
  color?: ColorValue;
  size?: number;
  strokeWidth?: number;
};

export function AppIcon({ name, color, size = 20, strokeWidth = 2 }: AppIconProps) {
  const theme = useTheme();
  const resolved = color ?? theme.color?.val;
  if (name === 'google') return <GoogleOriginalIcon size={size} />;
  if (name === 'apple') return <AppleOriginalIcon color={resolved} size={size} />;
  const Icon = iconMap[name];
  return <Icon color={resolved as string} size={size} strokeWidth={strokeWidth} />;
}
