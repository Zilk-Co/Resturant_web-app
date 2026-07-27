export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  popular?: boolean;
  spicy?: boolean;
  isNew?: boolean;
  calories?: number;
  image?: ReturnType<typeof require>;
  imageUrl?: string | null;
  images?: string[]; // Array of image URLs for carousel support
  offerActive?: boolean;
  offerPercentage?: number | null;
  offerLabel?: string | null;
  offerStartDate?: string | null;
  offerEndDate?: string | null;
}

export interface Category {
  id: string;
  label: string;
  iconName: string;
}

export interface Deal {
  id: string;
  itemId: string;
  title: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  tag?: string;
  gradientStart: string;
  gradientEnd: string;
  image?: ReturnType<typeof require>;
  imageUrl?: string | null;
  images?: string[]; // Array of image URLs for carousel support
}

export const CATEGORIES: Category[] = [
  { id: "deals", label: "Deals", iconName: "tag" },
  { id: "chicken", label: "Chicken", iconName: "feather" },
  { id: "burgers", label: "Burgers", iconName: "circle" },
  { id: "wraps", label: "Wraps", iconName: "package" },
  { id: "sides", label: "Sides", iconName: "grid" },
  { id: "drinks", label: "Drinks", iconName: "droplet" },
  { id: "desserts", label: "Desserts", iconName: "heart" },
];

export const DEALS: Deal[] = [
  {
    id: "d1",
    itemId: "deal1",
    title: "Family Feast",
    subtitle: "8 pcs crispy chicken + 4 fries + 4 drinks",
    price: 3499,
    originalPrice: 4200,
    tag: "Best Seller",
    gradientStart: "#0D3B1A",
    gradientEnd: "#1B5E20",
    image: require("../assets/images/chicken.png"),
  },
  {
    id: "d2",
    itemId: "deal2",
    title: "Duo Deal",
    subtitle: "2 pcs chicken + 2 fries + 2 drinks",
    price: 1649,
    originalPrice: 2000,
    tag: "Hot Deal",
    gradientStart: "#B71C1C",
    gradientEnd: "#C8102E",
    image: require("../assets/images/chicken.png"),
  },
  {
    id: "d3",
    itemId: "deal3",
    title: "Student Meal",
    subtitle: "1 Zinger Burger + fries + drink",
    price: 899,
    originalPrice: 1180,
    tag: "Value",
    gradientStart: "#1A237E",
    gradientEnd: "#283593",
    image: require("../assets/images/burger.png"),
  },
  {
    id: "d4",
    itemId: "deal4",
    title: "THB Box Meal",
    subtitle: "2 pcs chicken + coleslaw + fries + drink",
    price: 1299,
    originalPrice: 1600,
    tag: "New",
    gradientStart: "#4A148C",
    gradientEnd: "#6A1B9A",
    image: require("../assets/images/chicken.png"),
  },
];

export const MENU_ITEMS: MenuItem[] = [
  // DEALS
  {
    id: "deal1",
    name: "Family Feast",
    description: "8 pcs crispy chicken + 4 regular fries + 4 drinks. Perfect for the whole family!",
    price: 3499,
    category: "deals",
    popular: true,
    image: require("../assets/images/chicken.png"),
  },
  {
    id: "deal2",
    name: "Duo Deal",
    description: "2 pcs crispy chicken + 2 regular fries + 2 drinks. Share with a friend!",
    price: 1649,
    category: "deals",
    popular: true,
    image: require("../assets/images/chicken.png"),
  },
  {
    id: "deal3",
    name: "Student Meal",
    description: "1 THB Zinger Burger + regular fries + 1 drink. Best value for students.",
    price: 899,
    category: "deals",
    popular: false,
    image: require("../assets/images/burger.png"),
  },
  {
    id: "deal4",
    name: "THB Box Meal",
    description: "2 pcs crispy chicken + coleslaw + fries + drink. The THB classic combo.",
    price: 1299,
    category: "deals",
    popular: false,
    image: require("../assets/images/chicken.png"),
  },
  {
    id: "deal5",
    name: "Mighty Zinger Meal",
    description: "2 Zinger Burgers + 2 large fries + 2 drinks. Double the crunch!",
    price: 2199,
    category: "deals",
    popular: false,
    image: require("../assets/images/burger.png"),
  },

  // CHICKEN
  {
    id: "ch1",
    name: "1 Pc Crispy Chicken",
    description: "Our signature golden crispy chicken, seasoned with THB's secret blend of 11 herbs and spices.",
    price: 480,
    category: "chicken",
    popular: true,
    calories: 350,
    image: require("../assets/images/chicken.png"),
  },
  {
    id: "ch2",
    name: "2 Pc Crispy Chicken",
    description: "Two golden crispy chicken pieces, perfectly seasoned.",
    price: 850,
    category: "chicken",
    popular: true,
    calories: 700,
    image: require("../assets/images/chicken.png"),
  },
  {
    id: "ch3",
    name: "3 Pc Crispy Chicken",
    description: "Three golden crispy chicken pieces — a hearty meal.",
    price: 1200,
    category: "chicken",
    popular: false,
    calories: 1050,
    image: require("../assets/images/chicken.png"),
  },
  {
    id: "ch4",
    name: "Hot & Spicy Chicken",
    description: "Extra spicy marinated crispy chicken for true heat lovers. Not for the faint-hearted!",
    price: 520,
    category: "chicken",
    spicy: true,
    calories: 380,
    image: require("../assets/images/chicken.png"),
  },
  {
    id: "ch5",
    name: "Crispy Strips (3 pcs)",
    description: "Tender chicken strips with your choice of signature dip sauce.",
    price: 680,
    category: "chicken",
    popular: true,
    calories: 420,
    image: require("../assets/images/chicken.png"),
  },
  {
    id: "ch6",
    name: "Drumsticks (4 pcs)",
    description: "Juicy, crispy drumsticks — the fan favorite cut.",
    price: 1100,
    category: "chicken",
    popular: false,
    calories: 890,
    image: require("../assets/images/chicken.png"),
  },

  // BURGERS
  {
    id: "bu1",
    name: "THB Zinger Burger",
    description: "Our signature crispy chicken fillet with fresh lettuce, tomato, and THB's secret zinger sauce.",
    price: 750,
    category: "burgers",
    popular: true,
    calories: 580,
    image: require("../assets/images/burger.png"),
  },
  {
    id: "bu2",
    name: "Tower Burger",
    description: "Double crispy chicken fillet stacked with cheese, hash brown, lettuce, and special tower sauce.",
    price: 1050,
    category: "burgers",
    popular: true,
    calories: 820,
    image: require("../assets/images/burger.png"),
  },
  {
    id: "bu3",
    name: "Fillet Burger",
    description: "Classic juicy chicken fillet with crisp lettuce and creamy mayo.",
    price: 650,
    category: "burgers",
    popular: false,
    calories: 490,
    image: require("../assets/images/burger.png"),
  },
  {
    id: "bu4",
    name: "Hot Shot Zinger",
    description: "Extra spicy zinger loaded with jalapeños, sriracha, and fire sauce.",
    price: 850,
    category: "burgers",
    spicy: true,
    calories: 620,
    image: require("../assets/images/burger.png"),
  },
  {
    id: "bu5",
    name: "Double Down",
    description: "Two crispy chicken fillets replace the bun, loaded with cheese, bacon sauce, and ranch.",
    price: 1150,
    category: "burgers",
    isNew: true,
    calories: 750,
    image: require("../assets/images/burger.png"),
  },
  {
    id: "bu6",
    name: "BBQ Crunch Burger",
    description: "Crispy chicken with smoky BBQ sauce and crunchy onion rings.",
    price: 900,
    category: "burgers",
    popular: false,
    calories: 670,
    image: require("../assets/images/burger.png"),
  },

  // WRAPS
  {
    id: "wr1",
    name: "Twister Wrap",
    description: "Tender chicken strips rolled in a soft tortilla with fresh garden veggies and creamy sauce.",
    price: 680,
    category: "wraps",
    popular: true,
    calories: 480,
    image: require("../assets/images/burger.png"),
  },
  {
    id: "wr2",
    name: "BBQ Crunch Wrap",
    description: "BBQ glazed chicken strips with crunchy coleslaw wrapped in a warm tortilla.",
    price: 750,
    category: "wraps",
    popular: false,
    calories: 520,
    image: require("../assets/images/burger.png"),
  },
  {
    id: "wr3",
    name: "Spicy Fiesta Wrap",
    description: "Spicy marinated chicken with salsa, jalapeños, and chipotle sauce in a soft tortilla.",
    price: 720,
    category: "wraps",
    spicy: true,
    calories: 510,
    image: require("../assets/images/burger.png"),
  },

  // SIDES
  {
    id: "si1",
    name: "Regular Fries",
    description: "Golden crispy fries, perfectly salted. The classic THB side.",
    price: 250,
    category: "sides",
    popular: true,
    calories: 320,
  },
  {
    id: "si2",
    name: "Large Fries",
    description: "Extra large golden crispy fries for the serious fry lover.",
    price: 350,
    category: "sides",
    popular: false,
    calories: 480,
  },
  {
    id: "si3",
    name: "Coleslaw",
    description: "THB's creamy signature coleslaw, fresh and crispy.",
    price: 220,
    category: "sides",
    popular: true,
    calories: 180,
  },
  {
    id: "si4",
    name: "Corn on Cob",
    description: "Sweet butter glazed corn on the cob, grilled to perfection.",
    price: 220,
    category: "sides",
    popular: false,
    calories: 150,
  },
  {
    id: "si5",
    name: "Mashed Potatoes",
    description: "Creamy mashed potatoes smothered in THB's signature gravy.",
    price: 260,
    category: "sides",
    popular: false,
    calories: 200,
  },
  {
    id: "si6",
    name: "Biscuit",
    description: "Warm, flaky buttermilk biscuit baked fresh daily.",
    price: 150,
    category: "sides",
    popular: false,
    calories: 220,
  },

  // DRINKS
  {
    id: "dr1",
    name: "Pepsi Regular",
    description: "350ml ice-cold Pepsi.",
    price: 180,
    category: "drinks",
    popular: true,
    calories: 150,
  },
  {
    id: "dr2",
    name: "Pepsi Large",
    description: "600ml Pepsi bottle.",
    price: 220,
    category: "drinks",
    popular: false,
    calories: 260,
  },
  {
    id: "dr3",
    name: "7Up",
    description: "350ml refreshing 7Up.",
    price: 180,
    category: "drinks",
    popular: false,
    calories: 140,
  },
  {
    id: "dr4",
    name: "Mountain Dew",
    description: "350ml Mountain Dew.",
    price: 180,
    category: "drinks",
    popular: false,
    calories: 170,
  },
  {
    id: "dr5",
    name: "Sting Energy",
    description: "250ml Sting energy drink.",
    price: 150,
    category: "drinks",
    popular: false,
    calories: 110,
  },
  {
    id: "dr6",
    name: "Mineral Water",
    description: "500ml chilled mineral water.",
    price: 120,
    category: "drinks",
    popular: false,
    calories: 0,
  },

  // DESSERTS
  {
    id: "de1",
    name: "Soft Serve Cone",
    description: "Creamy swirled vanilla soft serve in a crispy cone.",
    price: 180,
    category: "desserts",
    popular: true,
    calories: 190,
  },
  {
    id: "de2",
    name: "Chocolate Brownie",
    description: "Warm fudgy chocolate brownie, served with a drizzle of chocolate sauce.",
    price: 250,
    category: "desserts",
    popular: false,
    calories: 350,
  },
  {
    id: "de3",
    name: "Kulfee Bar",
    description: "Traditional Pakistani frozen ice cream on a stick with cardamom and pistachio.",
    price: 220,
    category: "desserts",
    popular: false,
    calories: 210,
  },
  {
    id: "de4",
    name: "Rice Pudding",
    description: "Classic kheer with cardamom, rose water and crushed nuts.",
    price: 200,
    category: "desserts",
    popular: false,
    calories: 280,
  },
];

export const CATEGORY_COLORS: Record<string, [string, string]> = {
  deals: ["#0D3B1A", "#1B5E20"],
  chicken: ["#BF360C", "#E64A19"],
  burgers: ["#C62828", "#EF6C00"],
  wraps: ["#00695C", "#00897B"],
  sides: ["#E65100", "#F57C00"],
  drinks: ["#0D47A1", "#1565C0"],
  desserts: ["#4A148C", "#7B1FA2"],
};
