import { useRequireAuth } from '@/lib/authStore';
import { RoomInquiryScreen } from '@/modules/rooms/screens/RoomInquiryScreen';

export default function RoomInquiryRoute() {
  useRequireAuth('/sign-in');
  return <RoomInquiryScreen />;
}
