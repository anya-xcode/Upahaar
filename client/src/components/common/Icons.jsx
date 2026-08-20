/**
 * Upahaar's icon set.
 *
 * Hand-drawn inline SVGs on a 24×24 grid with a consistent 1.7 stroke, so every
 * glyph sits at the same optical weight and inherits currentColor. These carry
 * the visual language of the product — categories, occasions, delivery tiers and
 * order states are all expressed with these rather than emoji.
 */
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function Svg({ children, size = 20, className = '', ...rest }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} {...base} {...rest}>
      {children}
    </svg>
  );
}

/* ------------------------------- Interface ------------------------------- */

export const Search = (p) => (
  <Svg {...p}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></Svg>
);
export const MapPin = (p) => (
  <Svg {...p}><path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" /></Svg>
);
export const Heart = ({ filled, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20.3 4.7 13a4.6 4.6 0 0 1 6.5-6.5l.8.8.8-.8A4.6 4.6 0 1 1 19.3 13Z" />
  </Svg>
);
export const Cart = (p) => (
  <Svg {...p}><path d="M3 4h2l2.2 10.4a2 2 0 0 0 2 1.6h7.4a2 2 0 0 0 2-1.55L20.5 8H6" /><circle cx="10" cy="20" r="1.3" /><circle cx="18" cy="20" r="1.3" /></Svg>
);
export const User = (p) => (
  <Svg {...p}><circle cx="12" cy="8.5" r="3.7" /><path d="M4.5 20a7.5 7.5 0 0 1 15 0" /></Svg>
);
export const Bell = (p) => (
  <Svg {...p}><path d="M6.5 9a5.5 5.5 0 1 1 11 0c0 4 1.5 5.5 1.5 5.5H5S6.5 13 6.5 9Z" /><path d="M10 18.5a2 2 0 0 0 4 0" /></Svg>
);
export const Star = ({ filled = true, ...p }) => (
  <Svg {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="m12 3.6 2.5 5.1 5.6.8-4 4 .9 5.6-5-2.6-5 2.6.9-5.6-4-4 5.6-.8Z" />
  </Svg>
);
export const ChevronDown = (p) => <Svg {...p}><path d="m6 9 6 6 6-6" /></Svg>;
export const ChevronRight = (p) => <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>;
export const ChevronLeft = (p) => <Svg {...p}><path d="m15 6-6 6 6 6" /></Svg>;
export const Close = (p) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const Menu = (p) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Svg>;
export const Check = (p) => <Svg {...p}><path d="m5 12.5 4.5 4.5L19 7" /></Svg>;
export const Plus = (p) => <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>;
export const Minus = (p) => <Svg {...p}><path d="M5 12h14" /></Svg>;
export const Trash = (p) => (
  <Svg {...p}><path d="M4 7h16M9 7V5h6v2M6.5 7l.8 12.2a1.8 1.8 0 0 0 1.8 1.7h5.8a1.8 1.8 0 0 0 1.8-1.7L17.5 7" /></Svg>
);
export const Edit = (p) => (
  <Svg {...p}><path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3Z" /></Svg>
);
export const Filter = (p) => <Svg {...p}><path d="M4 6h16M7 12h10M10 18h4" /></Svg>;
export const Grid = (p) => (
  <Svg {...p}><rect x="4" y="4" width="7" height="7" rx="1.6" /><rect x="13" y="4" width="7" height="7" rx="1.6" /><rect x="4" y="13" width="7" height="7" rx="1.6" /><rect x="13" y="13" width="7" height="7" rx="1.6" /></Svg>
);
export const Logout = (p) => <Svg {...p}><path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15M10 8l-4 4 4 4M6 12h10" /></Svg>;
export const Upload = (p) => <Svg {...p}><path d="M12 16V5M8 9l4-4 4 4M4 17v2.5h16V17" /></Svg>;
export const Refresh = (p) => <Svg {...p}><path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4.5h-4.5" /></Svg>;
export const Settings = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.8 6.2l-1.4 1.4M7.6 16.4l-1.4 1.4M17.8 17.8l-1.4-1.4M7.6 7.6 6.2 6.2" /></Svg>
);
export const Info = (p) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8h.01" /></Svg>;
export const Warning = (p) => (
  <Svg {...p}><path d="M12 4 2.8 19.5h18.4Z" /><path d="M12 10v4M12 17h.01" /></Svg>
);
export const Sparkles = (p) => (
  <Svg {...p}><path d="m12 3 1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6ZM18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z" /></Svg>
);
export const EyeOff = (p) => (
  <Svg {...p}><path d="m4 4 16 16" /><path d="M9.9 5.6A9.4 9.4 0 0 1 12 5.4c5 0 8.5 4.4 8.5 6.6 0 .8-.5 1.9-1.4 3M6.4 7.7C4.4 9.1 3.5 11 3.5 12c0 2.2 3.5 6.6 8.5 6.6 1.3 0 2.5-.3 3.5-.8" /><path d="M10.3 10.4a2.3 2.3 0 0 0 3.3 3.2" /></Svg>
);

/* --------------------------- Commerce & delivery -------------------------- */

export const Truck = (p) => (
  <Svg {...p}><path d="M3 16V6h11v10M14 9h3.5l2.5 3.5V16" /><circle cx="7.5" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></Svg>
);
export const Bike = (p) => (
  <Svg {...p}><circle cx="5.8" cy="17.2" r="2.8" /><circle cx="18.2" cy="17.2" r="2.8" /><path d="M5.8 17.2 9.5 9h5l3.7 8.2M9 9h6" /></Svg>
);
export const Bolt = (p) => <Svg {...p}><path d="M13 3 5 13.5h5.5L11 21l8-10.5h-5.5Z" /></Svg>;
export const Clock = (p) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>;
export const Package = (p) => (
  <Svg {...p}><path d="M12 3 3.5 7.5v9L12 21l8.5-4.5v-9Z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></Svg>
);
export const Calendar = (p) => (
  <Svg {...p}><rect x="3.5" y="5" width="17" height="15.5" rx="2.5" /><path d="M3.5 9.5h17M8 3v4M16 3v4" /></Svg>
);
export const Gift = (p) => (
  <Svg {...p}><path d="M4 11.5h16V20H4zM3 8h18v3.5H3zM12 8v12" /><path d="M12 8s-1-4-3.5-4A2 2 0 0 0 8 8ZM12 8s1-4 3.5-4A2 2 0 0 1 16 8Z" /></Svg>
);
export const Store = (p) => (
  <Svg {...p}><path d="M4 10v10h16V10M3 5h18l-1 5H4Z" /><path d="M10 20v-5h4v5" /></Svg>
);
export const Tag = (p) => (
  <Svg {...p}><path d="M3 11.5V4h7.5L21 14.5 14.5 21Z" /><circle cx="7.5" cy="8" r="1.3" /></Svg>
);
export const Receipt = (p) => (
  <Svg {...p}><path d="M5.5 3.5h13v17l-2.2-1.5-2.2 1.5-2.1-1.5-2.2 1.5-2.1-1.5-2.2 1.5Z" /><path d="M9 8h6M9 12h6" /></Svg>
);
export const ChefHat = (p) => (
  <Svg {...p}><path d="M7 20.5h10v-4H7Z" /><path d="M7 16.5c-2 0-3.5-1.6-3.5-3.6 0-1.7 1.2-3.2 2.9-3.5A3.9 3.9 0 0 1 12 5.5a3.9 3.9 0 0 1 5.6 3.9c1.7.3 2.9 1.8 2.9 3.5 0 2-1.5 3.6-3.5 3.6" /></Svg>
);
export const Shield = (p) => (
  <Svg {...p}><path d="M12 3 5 6v6c0 4.4 3 7.9 7 9 4-1.1 7-4.6 7-9V6Z" /><path d="m9 12 2 2 4-4" /></Svg>
);
export const Chart = (p) => <Svg {...p}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /></Svg>;
export const Users = (p) => (
  <Svg {...p}><circle cx="9" cy="8.5" r="3.3" /><path d="M2.5 20a6.5 6.5 0 0 1 13 0" /><path d="M16 5.5a3.3 3.3 0 0 1 0 6.4M17 14.4a6.5 6.5 0 0 1 4.5 5.6" /></Svg>
);
export const Rupee = (p) => <Svg {...p}><path d="M7 5h10M7 9h10M7 5c5 0 7 1.5 7 4s-2 4-7 4h-.5L15 20" /></Svg>;
export const Phone = (p) => (
  <Svg {...p}><path d="M5 4h3.5l1.5 4-2 1.5a11.5 11.5 0 0 0 5.5 5.5L15 13l4 1.5V18a2 2 0 0 1-2.2 2A15.5 15.5 0 0 1 3 6.2 2 2 0 0 1 5 4Z" /></Svg>
);
export const Mail = (p) => (
  <Svg {...p}><rect x="3" y="5.5" width="18" height="13" rx="2.5" /><path d="m3.5 7 8.5 6 8.5-6" /></Svg>
);
export const CreditCard = (p) => (
  <Svg {...p}><rect x="2.5" y="5.5" width="19" height="13" rx="2.4" /><path d="M2.5 10h19M6 14.5h3" /></Svg>
);
export const Bank = (p) => (
  <Svg {...p}><path d="M3 10h18L12 4Z" /><path d="M5.5 10v7M9.5 10v7M14.5 10v7M18.5 10v7M3 20h18" /></Svg>
);
export const Wallet = (p) => (
  <Svg {...p}><path d="M3.5 7.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2" /><rect x="3.5" y="7.5" width="17" height="11.5" rx="2" /><path d="M20.5 11.5h-3.6a1.9 1.9 0 0 0 0 3.8h3.6" /></Svg>
);
export const Cash = (p) => (
  <Svg {...p}><rect x="2.5" y="6.5" width="19" height="11" rx="2" /><circle cx="12" cy="12" r="2.6" /><path d="M6 10v4M18 10v4" /></Svg>
);

/* -------------------------- Categories & occasions ------------------------ */

export const Cake = (p) => (
  <Svg {...p}><path d="M4 20.5h16" /><path d="M5.5 20.5v-6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6" /><path d="M12 12.5V9" /><path d="M12 6.2c.9.6 1.4 1.2 1.4 1.9a1.4 1.4 0 0 1-2.8 0c0-.7.5-1.3 1.4-1.9Z" /></Svg>
);
export const Flower = (p) => (
  <Svg {...p}><circle cx="12" cy="9" r="4.4" /><path d="M13.6 9a1.6 1.6 0 1 1-1.6-1.6A2.8 2.8 0 0 1 14.8 10" /><path d="M12 13.4v7.1" /><path d="M12 17.4c-1.9 0-3-1.1-3-2.6 1.9 0 3 1.1 3 2.6Z" /></Svg>
);
export const Chocolate = (p) => (
  <Svg {...p}><rect x="4.5" y="5.5" width="15" height="13" rx="1.8" /><path d="M4.5 10h15M4.5 14h15M9.5 5.5v13M14.5 5.5v13" /></Svg>
);
export const Hamper = (p) => (
  <Svg {...p}><path d="M3.5 9.5h17l-1.6 9a2 2 0 0 1-2 1.7H7.1a2 2 0 0 1-2-1.7Z" /><path d="M8 9.5 10.5 4M16 9.5 13.5 4" /><path d="M9.8 13v4M14.2 13v4" /></Svg>
);
export const Engrave = (p) => (
  <Svg {...p}><path d="M14.5 4.5 19.5 9.5 9 20H4v-5Z" /><path d="m12.5 6.5 5 5" /></Svg>
);
export const Bear = (p) => (
  <Svg {...p}><circle cx="12" cy="13.6" r="5.4" /><circle cx="7.4" cy="7.6" r="2.5" /><circle cx="16.6" cy="7.6" r="2.5" /><path d="M10.4 13h.01M13.6 13h.01" /><path d="M12 15.3c-.9 0-1.5.5-1.5 1.1s.7 1.2 1.5 1.2 1.5-.5 1.5-1.2-.6-1.1-1.5-1.1Z" /></Svg>
);
export const Ring = (p) => (
  <Svg {...p}><circle cx="12" cy="15" r="4.8" /><path d="m8.6 8.8 1.6-3.3h3.6l1.6 3.3-3.4 2.4Z" /></Svg>
);
export const Rings = (p) => (
  <Svg {...p}><circle cx="9.3" cy="14.5" r="4.2" /><circle cx="14.7" cy="14.5" r="4.2" /><path d="m7.8 8.4 1.5-2.2 1.5 2.2" /></Svg>
);
export const Balloon = (p) => (
  <Svg {...p}><path d="M12 15.5c2.8 0 5-2.6 5-5.9S14.8 3.5 12 3.5 7 6.3 7 9.6s2.2 5.9 5 5.9Z" /><path d="m12 15.5-.9 1.6h1.8Z" /><path d="M12 17.1c0 1.7-1.6 1.9-1.6 3.4" /></Svg>
);
export const Tie = (p) => (
  <Svg {...p}><path d="M9.5 3.5h5l1 3-3.5 3-3.5-3Z" /><path d="M10.2 9.5 8.8 17l3.2 3.5 3.2-3.5-1.4-7.5" /></Svg>
);
export const Rattle = (p) => (
  <Svg {...p}><circle cx="10" cy="10" r="5.2" /><path d="m13.7 13.7 3.6 3.6" /><path d="M17.3 17.3a1.8 1.8 0 1 0 2.5 2.5 1.8 1.8 0 0 0-2.5-2.5Z" /></Svg>
);
export const Briefcase = (p) => (
  <Svg {...p}><rect x="3" y="7.5" width="18" height="12" rx="2.2" /><path d="M9 7.5V6a1.8 1.8 0 0 1 1.8-1.8h2.4A1.8 1.8 0 0 1 15 6v1.5" /><path d="M3 12.5h18" /></Svg>
);
export const Diya = (p) => (
  <Svg {...p}><path d="M4.5 14.5h15c0 2.8-2.2 5-5 5h-5c-2.8 0-5-2.2-5-5Z" /><path d="M12 14.5V12" /><path d="M12 5.5c1.4 1.3 2.1 2.4 2.1 3.4a2.1 2.1 0 0 1-4.2 0c0-1 .7-2.1 2.1-3.4Z" /></Svg>
);
export const Confetti = (p) => (
  <Svg {...p}><path d="M4 20 9 9l6 6-11 5Z" /><path d="M14 8c1.5-2.5 4-3 5.5-1.5" /><path d="M14.5 4.5 15 6M19.6 9.6 18 10M18.6 4.6 17.5 5.7M20.5 14h-1.7" /></Svg>
);
export const Knot = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="3" /><path d="M9.2 10.6 3.5 8.4M14.8 10.6l5.7-2.2M9.2 13.4l-5.7 2.2M14.8 13.4l5.7 2.2" /></Svg>
);
export const Sun = (p) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></Svg>
);
export const HandHeart = (p) => (
  <Svg {...p}><path d="M12 9.2c1-1.5 3.6-1.3 3.6.9 0 1.7-2.4 3.3-3.6 4-1.2-.7-3.6-2.3-3.6-4 0-2.2 2.6-2.4 3.6-.9Z" /><path d="M3.5 20.5c0-2.6 1.4-4.1 3.5-4.1M20.5 20.5c0-2.6-1.4-4.1-3.5-4.1" /></Svg>
);
export const Home = (p) => (
  <Svg {...p}><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" /><path d="M9.5 21v-6h5v6" /></Svg>
);

export default {
  Search, MapPin, Heart, Cart, User, Bell, Star, ChevronDown, ChevronRight, ChevronLeft,
  Close, Menu, Check, Plus, Minus, Trash, Edit, Filter, Grid, Logout, Upload, Refresh,
  Settings, Info, Warning, Sparkles, EyeOff,
  Truck, Bike, Bolt, Clock, Package, Calendar, Gift, Store, Tag, Receipt, ChefHat,
  Shield, Chart, Users, Rupee, Phone, Mail, CreditCard, Bank, Wallet, Cash,
  Cake, Flower, Chocolate, Hamper, Engrave, Bear, Ring, Rings, Balloon, Tie, Rattle,
  Briefcase, Diya, Confetti, Knot, Sun, HandHeart, Home,
};
