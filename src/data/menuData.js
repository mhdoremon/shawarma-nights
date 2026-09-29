export const CATEGORIES = [
  { id: 'all', name: 'All Menu', iconKey: 'Utensils', count: 18 },
  { id: 'shawarmas', name: 'Shawarmas', iconKey: 'Flame', count: 6 },
  { id: 'platters', name: 'Charcoal Platters', iconKey: 'Sparkles', count: 3 },
  { id: 'fries', name: 'Loaded Fries', iconKey: 'Layers', count: 3 },
  { id: 'wings', name: 'Crispy Wings', iconKey: 'UtensilsCrossed', count: 2 },
  { id: 'combos', name: 'Midnight Combos', iconKey: 'Package', count: 2 },
  { id: 'beverages', name: 'Cold Drinks', iconKey: 'Coffee', count: 2 },
];

export const MENU_ITEMS = [
  {
    id: 'sh-1',
    name: 'The Midnight Sultan Shawarma',
    category: 'shawarmas',
    price: 199,
    originalPrice: 249,
    rating: 4.9,
    reviews: 1420,
    prepTime: '15-20 min',
    isVeg: false,
    badge: 'BESTSELLER',
    spiceLevel: 'Spicy',
    description: 'Slow-roasted chicken carved straight from charcoal spits, dressed in Lebanese garlic toum, tahini drizzle, and crunchy house pickles wrapped in toasted rumali.',
    image: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?auto=format&fit=crop&w=800&q=80',
    options: {
      bread: [
        { name: 'Toasted Rumali Roti', price: 0 },
        { name: 'Fluffy Lebanese Pita', price: 20 },
        { name: 'Crispy Arabian Saj Bread', price: 30 }
      ],
      spiciness: ['Mild Herb', 'Spicy Garlic', 'Ghost Naga Fire'],
      addons: [
        { id: 'toum', name: 'Extra Garlic Toum (Famous Dip)', price: 25 },
        { id: 'cheese', name: 'Smoked Melted Mozzarella', price: 39 },
        { id: 'pickles', name: 'Extra Jalapeños & Gherkins', price: 20 },
        { id: 'meat', name: 'Double Charcoal Grilled Meat', price: 59 },
        { id: 'fries_inside', name: 'Crispy Fries Wrapped Inside', price: 25 },
      ]
    }
  },
  {
    id: 'sh-2',
    name: 'Cheesy Lava Charcoal Shawarma',
    category: 'shawarmas',
    price: 229,
    originalPrice: 279,
    rating: 4.8,
    reviews: 980,
    prepTime: '15-20 min',
    isVeg: false,
    badge: 'CHEF PICK',
    spiceLevel: 'Medium',
    description: 'Tender juicy chicken drenched in liquid cheddar cheese and fiery peri-peri sauce, griddled with garlic butter until blistered and golden.',
    image: 'https://images.unsplash.com/photo-1561651823-34feb02250e4?auto=format&fit=crop&w=800&q=80',
    options: {
      bread: [
        { name: 'Toasted Rumali Roti', price: 0 },
        { name: 'Fluffy Lebanese Pita', price: 20 },
        { name: 'Crispy Arabian Saj Bread', price: 30 }
      ],
      spiciness: ['Mild Herb', 'Spicy Garlic', 'Ghost Naga Fire'],
      addons: [
        { id: 'toum', name: 'Extra Garlic Toum (Famous Dip)', price: 25 },
        { id: 'cheese', name: 'Double Cheese Blast', price: 49 },
        { id: 'pickles', name: 'Extra Jalapeños & Gherkins', price: 20 },
        { id: 'meat', name: 'Double Charcoal Grilled Meat', price: 59 },
      ]
    }
  },
  {
    id: 'sh-3',
    name: 'Smoky BBQ Pulled Chicken Wrap',
    category: 'shawarmas',
    price: 219,
    originalPrice: 259,
    rating: 4.7,
    reviews: 640,
    prepTime: '15-20 min',
    isVeg: false,
    badge: 'POPULAR',
    spiceLevel: 'Sweet & Smoky',
    description: 'Wood-smoked succulent chicken tossed in dark hickory BBQ glaze with caramelized onions, crispy lettuce, and creamy ranch drizzle.',
    image: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?auto=format&fit=crop&w=800&q=80',
    options: {
      bread: [
        { name: 'Toasted Rumali Roti', price: 0 },
        { name: 'Fluffy Lebanese Pita', price: 20 },
        { name: 'Crispy Arabian Saj Bread', price: 30 }
      ],
      spiciness: ['Mild BBQ', 'Spicy BBQ'],
      addons: [
        { id: 'toum', name: 'Extra Garlic Toum', price: 25 },
        { id: 'cheese', name: 'Smoked Melted Mozzarella', price: 39 },
        { id: 'onion', name: 'Extra Caramelized Onion', price: 20 }
      ]
    }
  },
  {
    id: 'sh-4',
    name: 'Spicy Paneer Tikka Shawarma',
    category: 'shawarmas',
    price: 189,
    originalPrice: 229,
    rating: 4.9,
    reviews: 820,
    prepTime: '12-15 min',
    isVeg: true,
    badge: 'VEG SPECIAL',
    spiceLevel: 'Spicy',
    description: 'Fresh malai paneer cubes marinated in tandoori spices and charred over coals, wrapped with mint toum, sliced bell peppers, and sumac onions.',
    image: 'https://images.unsplash.com/photo-1628294895950-9805252327bc?auto=format&fit=crop&w=800&q=80',
    options: {
      bread: [
        { name: 'Toasted Rumali Roti', price: 0 },
        { name: 'Fluffy Lebanese Pita', price: 20 },
        { name: 'Crispy Arabian Saj Bread', price: 30 }
      ],
      spiciness: ['Medium Spice', 'Fiery Tikka'],
      addons: [
        { id: 'toum', name: 'Extra Garlic Toum Dip', price: 25 },
        { id: 'cheese', name: 'Melted Mozzarella Layer', price: 39 },
        { id: 'paneer', name: 'Extra Charred Paneer', price: 49 }
      ]
    }
  },
  {
    id: 'sh-5',
    name: 'Falafel Hummus Supreme Roll',
    category: 'shawarmas',
    price: 179,
    originalPrice: 209,
    rating: 4.8,
    reviews: 510,
    prepTime: '10-15 min',
    isVeg: true,
    badge: 'HEALTHY',
    spiceLevel: 'Mild',
    description: 'Crispy golden chickpea falafels nestled inside silky house-made hummus, diced parsley salad, pickled turnip, and creamy tahina sauce.',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80',
    options: {
      bread: [
        { name: 'Toasted Rumali Roti', price: 0 },
        { name: 'Fluffy Lebanese Pita', price: 20 },
        { name: 'Crispy Arabian Saj Bread', price: 30 }
      ],
      spiciness: ['Classic Mild', 'Zesty Spiced'],
      addons: [
        { id: 'hummus', name: 'Extra Olive Oil Hummus Scoop', price: 35 },
        { id: 'falafel', name: '2 Extra Crispy Falafels', price: 39 },
        { id: 'pickles', name: 'Extra Pickled Turnips', price: 15 }
      ]
    }
  },
  {
    id: 'sh-6',
    name: 'The Beirut Monster Meat Roll (XL)',
    category: 'shawarmas',
    price: 299,
    originalPrice: 369,
    rating: 5.0,
    reviews: 1890,
    prepTime: '20-25 min',
    isVeg: false,
    badge: 'SIGNATURE',
    spiceLevel: 'Spicy',
    description: '300 grams of succulent charcoal chicken and lamb shavings, double cheese, french fries inside, drenched in our secret spicy garlic sauce.',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    options: {
      bread: [
        { name: 'Giant Saj Wrap (Recommended)', price: 0 },
        { name: 'Double Rumali Wrap', price: 20 }
      ],
      spiciness: ['Spicy Garlic', 'Extreme Ghost Pepper'],
      addons: [
        { id: 'toum', name: 'Extra Jumbo Toum Cup', price: 35 },
        { id: 'cheese', name: 'Double Cheddar Melt', price: 49 },
        { id: 'fries_inside', name: 'Loaded Peri-Peri Fries Inside', price: 29 }
      ]
    }
  },

  // PLATTERS
  {
    id: 'pl-1',
    name: 'Arabian Shawarma Rice Platter',
    category: 'platters',
    price: 289,
    originalPrice: 349,
    rating: 4.9,
    reviews: 730,
    prepTime: '18-22 min',
    isVeg: false,
    badge: 'COMBO MEAL',
    spiceLevel: 'Medium',
    description: 'Fragrant golden butter-cumin basmati rice crowned with generous charcoal chicken, crisp fries, warm pita triangles, house salad & rich garlic toum.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
    options: {
      spiciness: ['Mild Fragrant', 'Spicy Toum'],
      addons: [
        { id: 'meat', name: 'Extra 100g Grilled Chicken', price: 65 },
        { id: 'pita', name: 'Extra Pita Bread', price: 25 },
        { id: 'hummus', name: 'Creamy Hummus Dip', price: 39 }
      ]
    }
  },
  {
    id: 'pl-2',
    name: 'Grand Mezze & Hummus Platter',
    category: 'platters',
    price: 269,
    originalPrice: 319,
    rating: 4.8,
    reviews: 440,
    prepTime: '15-18 min',
    isVeg: true,
    badge: 'AUTHENTIC',
    spiceLevel: 'Mild',
    description: 'Silky extra virgin olive oil hummus, crispy falafel pucks, smoked moutabal eggplant dip, fattoush salad, pickled turnip & 2 warm pita breads.',
    image: 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea?auto=format&fit=crop&w=800&q=80',
    options: {
      spiciness: ['Classic Mild', 'Zesty Red Pepper'],
      addons: [
        { id: 'falafel', name: '3 Extra Hot Falafels', price: 45 },
        { id: 'pita', name: '2 Extra Fluffy Pitas', price: 35 }
      ]
    }
  },
  {
    id: 'pl-3',
    name: 'Nights Charcoal Mixed Grill Platter',
    category: 'platters',
    price: 449,
    originalPrice: 529,
    rating: 5.0,
    reviews: 1120,
    prepTime: '25-30 min',
    isVeg: false,
    badge: 'ROYAL FEAST',
    spiceLevel: 'Spicy',
    description: 'Chicken seekh kebabs, charcoal chicken tikka, shawarma shavings, grilled tomatoes, spicy pita and 3 signature dips.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
    options: {
      spiciness: ['Spicy Mix', 'Naga Fire Feast'],
      addons: [
        { id: 'cheese', name: 'Cheese Dip Bowl', price: 45 },
        { id: 'fries', name: 'Crinkle Cut Salted Fries', price: 59 }
      ]
    }
  },

  // LOADED FRIES
  {
    id: 'fr-1',
    name: 'Shawarma Loaded Animal Fries',
    category: 'fries',
    price: 189,
    originalPrice: 229,
    rating: 4.9,
    reviews: 1560,
    prepTime: '10-15 min',
    isVeg: false,
    badge: 'HOTTEST',
    spiceLevel: 'Spicy',
    description: 'Golden crunchy crinkle fries smothered in molten cheddar sauce, minced charcoal chicken, spicy garlic toum, and sliced jalapeños.',
    image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
    options: {
      spiciness: ['Cheesy Mild', 'Flaming Jalapeño'],
      addons: [
        { id: 'cheese', name: 'Extra Liquid Gold Cheese', price: 35 },
        { id: 'bacon', name: 'Crispy Chicken Bits', price: 39 }
      ]
    }
  },
  {
    id: 'fr-2',
    name: 'Fiery Peri-Peri Crinkle Fries',
    category: 'fries',
    price: 119,
    originalPrice: 149,
    rating: 4.7,
    reviews: 870,
    prepTime: '8-12 min',
    isVeg: true,
    badge: 'CRISPY',
    spiceLevel: 'Spicy',
    description: 'Thick crinkle cut potatoes tossed vigorously in our house blend African bird-eye chilli dust. Served with creamy garlic dip.',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=80',
    options: {
      spiciness: ['Medium Zing', 'Volcano Peri-Peri'],
      addons: [
        { id: 'dip', name: 'Cheesy Garlic Dip', price: 25 }
      ]
    }
  },
  {
    id: 'fr-3',
    name: 'Truffle & Parmesan Herb Fries',
    category: 'fries',
    price: 169,
    originalPrice: 199,
    rating: 4.8,
    reviews: 410,
    prepTime: '10-12 min',
    isVeg: true,
    badge: 'GOURMET',
    spiceLevel: 'Mild',
    description: 'Crisp shoestring fries perfumed with white truffle oil, dusted with freshly grated aged parmesan cheese and rosemary herbs.',
    image: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80',
    options: {
      addons: [
        { id: 'parm', name: 'Extra Snow Parmesan', price: 35 }
      ]
    }
  },

  // CRISPY WINGS
  {
    id: 'wg-1',
    name: 'Devil\'s Hot Charcoal Wings (6 Pcs)',
    category: 'wings',
    price: 249,
    originalPrice: 299,
    rating: 4.9,
    reviews: 820,
    prepTime: '15-20 min',
    isVeg: false,
    badge: 'CHEF CHOICE',
    spiceLevel: 'Fire Hot',
    description: 'Double fried crunchy wings glazed in sizzling habanero butter hot sauce, sprinkled with toasted sesame and served with blue cheese dip.',
    image: 'https://images.unsplash.com/photo-1527477378378-20eb49980d46?auto=format&fit=crop&w=800&q=80',
    options: {
      spiciness: ['Hot Buffalo', 'Insane Naga Fire'],
      addons: [
        { id: 'dip', name: 'Extra Blue Cheese Dip', price: 30 }
      ]
    }
  },
  {
    id: 'wg-2',
    name: 'Honey Glazed Garlic Wings (6 Pcs)',
    category: 'wings',
    price: 239,
    originalPrice: 289,
    rating: 4.8,
    reviews: 650,
    prepTime: '15-20 min',
    isVeg: false,
    badge: 'SWEET & SAVORY',
    spiceLevel: 'Mild',
    description: 'Crispy golden batter chicken wings drenched in sticky wild honey garlic reduction with cracked black pepper.',
    image: 'https://images.unsplash.com/photo-1569058242253-92a9c755a0ec?auto=format&fit=crop&w=800&q=80',
    options: {
      addons: [
        { id: 'toum', name: 'Garlic Toum Dip', price: 25 }
      ]
    }
  },

  // COMBOS
  {
    id: 'cb-1',
    name: 'Midnight Craving Duo Box',
    category: 'combos',
    price: 399,
    originalPrice: 559,
    rating: 5.0,
    reviews: 2100,
    prepTime: '15-20 min',
    isVeg: false,
    badge: 'VALUE DUO',
    spiceLevel: 'Spicy',
    description: '2x Midnight Sultan Shawarmas + 1x Peri-Peri Loaded Fries + 2x Chilled Mint Mojitos or Cokes. Complete late-night feast.',
    image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80',
    options: {
      spiciness: ['Mild', 'Spicy Garlic'],
      addons: [
        { id: 'cheese', name: 'Add Cheese to Both Shawarmas', price: 59 },
        { id: 'dip', name: 'Extra Duo Dip Pack', price: 39 }
      ]
    }
  },
  {
    id: 'cb-2',
    name: 'Midnight Solo Champion Box',
    category: 'combos',
    price: 279,
    originalPrice: 359,
    rating: 4.9,
    reviews: 1350,
    prepTime: '12-15 min',
    isVeg: false,
    badge: 'SOLO BOX',
    spiceLevel: 'Spicy',
    description: '1x Cheesy Lava Shawarma + 1x Regular Salted Fries + 1x Refreshing Chilled Soft Drink.',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    options: {
      spiciness: ['Spicy Garlic', 'Mild Herb'],
      addons: [
        { id: 'cheese', name: 'Upgrade to Cheesy Fries', price: 35 }
      ]
    }
  },

  // BEVERAGES
  {
    id: 'bv-1',
    name: 'Electric Blue Mint Lagoon Mojito',
    category: 'beverages',
    price: 99,
    originalPrice: 129,
    rating: 4.8,
    reviews: 580,
    prepTime: '5 min',
    isVeg: true,
    badge: 'CHILLED',
    spiceLevel: 'Sweet & Tangy',
    description: 'Muddled fresh Persian mint, fresh lime wedges, blue curacao infusion, topped with fizzy lemon soda over crushed ice.',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80',
    options: {
      addons: [
        { id: 'boba', name: 'Add Popping Boba Pearls', price: 25 }
      ]
    }
  },
  {
    id: 'bv-2',
    name: 'Creamy Nutella Hazelnut Shake',
    category: 'beverages',
    price: 139,
    originalPrice: 169,
    rating: 4.9,
    reviews: 920,
    prepTime: '5-8 min',
    isVeg: true,
    badge: 'SHAKE',
    spiceLevel: 'Rich Sweet',
    description: 'Thick full-cream vanilla gelato blended with genuine Nutella, roasted hazelnuts, and topped with chocolate swirl whipped cream.',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=800&q=80',
    options: {
      addons: [
        { id: 'brownie', name: 'Crushed Fudge Brownie Topping', price: 30 }
      ]
    }
  }
];

export const PROMO_CODES = {};

export const RESTAURANT_INFO = {
  name: 'Shawarma Nights',
  tagline: 'Sizzling Charcoal Flavors • Midnight Street Cravings',
  rating: 4.9,
  reviewsCount: '15,000+',
  avgDeliveryTime: '22-28 mins',
  address: 'Shop 14, Food Street Avenue, Central Plaza',
  timing: 'Open Daily: 12:00 PM – 04:00 AM',
  freeDeliveryThreshold: 350,
  baseDeliveryFee: 40,
  taxRate: 0,
};
