import { Users, CheckCircle2, Clock, EyeOff, Briefcase, UserCheck } from 'lucide-react';
import StatCards from '../../components/common/StatCards';

// filter: the list filter a card applies on click.
const CARDS = [
  { key: 'total', label: 'All maids', filter: '', icon: Users },
  { key: 'approved', label: 'Approved', filter: 'approved', icon: CheckCircle2 },
  { key: 'pending', label: 'Pending', filter: 'pending', icon: Clock },
  { key: 'disabled', label: 'Disabled', filter: 'disabled', icon: EyeOff },
  { key: 'hired', label: 'Hired', filter: 'hired', icon: Briefcase },
  { key: 'available', label: 'Available', filter: 'unhired', icon: UserCheck },
];

export default function MaidStatusCards({ counts, activeFilter, onSelect }) {
  return <StatCards cards={CARDS} counts={counts} activeFilter={activeFilter} onSelect={onSelect} />;
}
