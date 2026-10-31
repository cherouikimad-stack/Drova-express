/**
 * DROVA High-Volume Merchant Category Dictionary & Keyword Expansion Engine (Section 16)
 * Hundreds of Arabic, French, and English commercial keywords mapped to shipping suitability
 */

export interface SubCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  nameFr: string;
  keywordsAr: string[];
  keywordsFr: string[];
  keywordsEn: string[];
}

export interface MerchantCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  nameFr: string;
  shippingSuitability: 'HIGH' | 'MEDIUM' | 'LOW';
  subcategories: SubCategory[];
  keywordsAr: string[];
  keywordsFr: string[];
  keywordsEn: string[];
}

export const MERCHANT_CATEGORIES: MerchantCategory[] = [
  {
    id: 'clothing',
    nameEn: 'Fashion & Clothing',
    nameAr: 'ملابس وأزياء وموضة',
    nameFr: 'Mode & Habillement',
    shippingSuitability: 'HIGH',
    keywordsAr: ['ملابس', 'أزياء', 'قنادر', 'جبب', 'حجاب', 'فساتين', 'عبايات', 'سراويل', 'أقمصة', 'بيجامات', 'معاطف', 'سترات', 'ملابس تركية', 'ملابس نسائية', 'ملابس رجالية'],
    keywordsFr: ['vetements', 'mode', 'robe', 'abaya', 'pantalon', 'chemise', 'pret a porter', 'manteau', 'veste', 'pyjama', 'djellaba', 'lingerie', 'streetwear', 'fashion dz'],
    keywordsEn: ['clothing', 'fashion', 'dresses', 'abaya', 'shirts', 'pants', 'jackets', 'coats', 'streetwear', 'apparel'],
    subcategories: [
      {
        id: 'womens_fashion',
        nameEn: "Women's Fashion",
        nameAr: 'أزياء نسائية',
        nameFr: 'Mode Femme',
        keywordsAr: ['فساتين سهرة', 'عبايات خليجية', 'قنادر دار', 'جبب قبائلي', 'أوشحة وحجاب', 'حقائب يد نسائية'],
        keywordsFr: ['robes de soiree', 'abayas', 'gnader', 'robes kabyles', 'hijabs', 'sacs femme'],
        keywordsEn: ['evening dresses', 'abayas', 'traditional gowns', 'hijabs', 'handbags']
      },
      {
        id: 'mens_fashion',
        nameEn: "Men's Fashion",
        nameAr: 'أزياء رجالية',
        nameFr: 'Mode Homme',
        keywordsAr: ['بدلات رجالية', 'أقمصة كلاسيك', 'سراويل جينز', 'تيشرتات شبابية', 'أحذية كلاسيكية'],
        keywordsFr: ['costumes homme', 'chemises', 'jeans', 't-shirts', 'chaussures de ville'],
        keywordsEn: ['mens suits', 'formal shirts', 'jeans', 't-shirts', 'formal shoes']
      },
      {
        id: 'modest_fashion',
        nameEn: 'Modest Fashion',
        nameAr: 'موضة المحجبات واللباس الشرعي',
        nameFr: 'Mode Pudique & Hijab',
        keywordsAr: ['خمارات تركية', 'توربان', 'جلباب شرعي', 'فساتين محتشمة'],
        keywordsFr: ['hijab turc', 'jilbab', 'turban', 'robes longues'],
        keywordsEn: ['modest dresses', 'turkish hijabs', 'jilbabs', 'long tunics']
      }
    ]
  },
  {
    id: 'shoes',
    nameEn: 'Shoes & Footwear',
    nameAr: 'أحذية وحقائب جلدية',
    nameFr: 'Chaussures & Maroquinerie',
    shippingSuitability: 'HIGH',
    keywordsAr: ['أحذية', 'صناديل', 'باسكيت', 'بوط', 'أحذية رياضية', 'أحذية طبية', 'سنيكرز'],
    keywordsFr: ['chaussures', 'baskets', 'sneakers', 'bottines', 'sandales', 'escarpins', 'chaussures cuir'],
    keywordsEn: ['shoes', 'sneakers', 'boots', 'sandals', 'leather footwear', 'running shoes'],
    subcategories: []
  },
  {
    id: 'cosmetics',
    nameEn: 'Cosmetics & Makeup',
    nameAr: 'مستحضرات تجميل ومكياج وعطور',
    nameFr: 'Cosmétiques, Maquillage & Parfums',
    shippingSuitability: 'HIGH',
    keywordsAr: ['كوسميتيك', 'مكياج', 'مستحضرات تجميل', 'أحمر شفاه', 'فونديشن', 'عطور فرنسية', 'عطور أصلية', 'مسك الطهارة'],
    keywordsFr: ['cosmetiques', 'maquillage', 'parfum', 'skincare', 'beaute', 'rouge a levres', 'fond de teint', 'eau de parfum'],
    keywordsEn: ['cosmetics', 'makeup', 'perfume', 'lipstick', 'foundation', 'fragrances'],
    subcategories: []
  },
  {
    id: 'beauty_products',
    nameEn: 'Skincare & Personal Care',
    nameAr: 'عناية بالبشرة والجسم والشعر',
    nameFr: 'Soins de la Peau & Capillaires',
    shippingSuitability: 'HIGH',
    keywordsAr: ['عناية بالبشرة', 'عناية بالشعر', 'سيروم', 'كريمات تفتيح', 'زيوت طبيعية', 'كولاجين', 'واقي شمس'],
    keywordsFr: ['soins de peau', 'soins cheveux', 'cremes', 'serum', 'naturel', 'ecran solaire', 'collagene'],
    keywordsEn: ['skincare', 'haircare', 'face serum', 'sunscreen', 'natural oils'],
    subcategories: []
  },
  {
    id: 'phones',
    nameEn: 'Phones & Mobile Accessories',
    nameAr: 'هواتف ذكية وملحقاتها',
    nameFr: 'Smartphones & Accessoires Mobiles',
    shippingSuitability: 'HIGH',
    keywordsAr: ['هواتف', 'تلفونات', 'كفرات', 'شواحن سريعة', 'اكسسوارات هواتف', 'سمارت فون', 'آيفون', 'سامسونغ', 'شاومي'],
    keywordsFr: ['telephones', 'smartphones', 'coques', 'chargeurs', 'accessoires mobile', 'iphone dz', 'samsung dz'],
    keywordsEn: ['smartphones', 'phone cases', 'fast chargers', 'earbuds', 'mobile gadgets'],
    subcategories: []
  },
  {
    id: 'electronics',
    nameEn: 'Consumer Electronics & Gadgets',
    nameAr: 'إلكترونيات وأجهزة ذكية',
    nameFr: 'Électronique & Objets Connectés',
    shippingSuitability: 'HIGH',
    keywordsAr: ['إلكترونيات', 'أجهزة إلكترونية', 'كاميرات مراقبة', 'سماعات بلوتوث', 'باور بانك', 'ساعات ذكية', 'بروجكتور'],
    keywordsFr: ['electronique', 'gadgets', 'ecouteurs sans fil', 'powerbank', 'audio', 'montre connectee', 'projecteur'],
    keywordsEn: ['electronics', 'wireless earbuds', 'powerbanks', 'smart watches', 'mini projectors'],
    subcategories: []
  },
  {
    id: 'computer_equipment',
    nameEn: 'Computers & IT Accessories',
    nameAr: 'أجهزة وإعلام آلي ومستلزمات مكتبية',
    nameFr: 'Informatique & Périphériques',
    shippingSuitability: 'HIGH',
    keywordsAr: ['حواسيب', 'لابتوب', 'طابعات', 'شاشات', 'لوحات مفاتيح ميكانيكية', 'فأرة قيمنق', 'هارد ديسك', 'كروت شاشة'],
    keywordsFr: ['ordinateurs', 'laptop', 'imprimantes', 'ecrans', 'claviers gaming', 'souris', 'disque dur'],
    keywordsEn: ['laptops', 'gaming pc', 'monitors', 'mechanical keyboards', 'it peripherals'],
    subcategories: []
  },
  {
    id: 'home_appliances',
    nameEn: 'Small Home Appliances',
    nameAr: 'أجهزة كهرومنزلية خفيفة للشحن',
    nameFr: 'Petit Électroménager',
    shippingSuitability: 'MEDIUM',
    keywordsAr: ['كهرومنزلية خفيفة', 'خلاط', 'مكواة بخار', 'ماكينة قهوة', 'قلاية هوائية إيرفراير', 'عصارة فواكه'],
    keywordsFr: ['electromenager', 'mixeur', 'machine a cafe', 'air fryer', 'fer a repasser'],
    keywordsEn: ['small appliances', 'coffee machines', 'air fryers', 'blenders', 'steam irons'],
    subcategories: []
  },
  {
    id: 'home_decoration',
    nameEn: 'Home Decor & Lighting',
    nameAr: 'ديكور منزلي، إضاءة وتحف',
    nameFr: 'Décoration Maison & Luminaires',
    shippingSuitability: 'HIGH',
    keywordsAr: ['ديكور', 'إضاءة عصرية', 'لوحات كانفاس فنية', 'مفارش طاولات', 'أواني ديكور', 'شموع معطرة', 'ساعات جدارية'],
    keywordsFr: ['decoration', 'deco maison', 'tableaux canvas', 'luminaires', 'bougies parfumees', 'horloge murale'],
    keywordsEn: ['home decor', 'wall art', 'modern lamps', 'scented candles', 'table runners'],
    subcategories: []
  },
  {
    id: 'jewelry',
    nameEn: 'Jewelry & Luxury Ornaments',
    nameAr: 'مجوهرات، فضة 925، وحلي فاخرة',
    nameFr: 'Bijoux & Parures',
    shippingSuitability: 'HIGH',
    keywordsAr: ['مجوهرات', 'فضة 925', 'ذهب بديل برازيلي', 'خواتم خطوبة', 'سلاسل زيركون', 'أساور فضة'],
    keywordsFr: ['bijoux', 'argent 925', 'plaque or', 'colliers', 'bagues', 'parures'],
    keywordsEn: ['sterling silver', 'fine jewelry', 'bracelets', 'necklaces', 'rings'],
    subcategories: []
  },
  {
    id: 'watches',
    nameEn: 'Watches & Timepieces',
    nameAr: 'ساعات يد رجالية ونسائية',
    nameFr: 'Horlogerie & Montres',
    shippingSuitability: 'HIGH',
    keywordsAr: ['ساعات يد', 'ساعات كوارتز', 'ساعات أوتوماتيك', 'ساعات يابانية', 'علب ساعات هدايا'],
    keywordsFr: ['montres homme', 'montres femme', 'horlogerie', 'coffret montre', 'montre automatique'],
    keywordsEn: ['wristwatches', 'quartz watches', 'automatic watches', 'watch gift boxes'],
    subcategories: []
  },
  {
    id: 'baby_products',
    nameEn: 'Baby & Maternity Care',
    nameAr: 'مستلزمات رضع، أمهات ومواليد',
    nameFr: 'Puériculture & Bébés',
    shippingSuitability: 'HIGH',
    keywordsAr: ['مستلزمات رضع', 'ملابس مواليد', 'حقائب أمهات بيبي', 'أغطية رضع', 'سرير محمول', 'رضاعات طبية'],
    keywordsFr: ['bebe', 'puericulture', 'vetements bebe', 'sac a langer', 'biberons'],
    keywordsEn: ['baby products', 'maternity bags', 'newborn clothes', 'baby feeding'],
    subcategories: []
  },
  {
    id: 'toys',
    nameEn: 'Toys & Board Games',
    nameAr: 'ألعاب أطفال وترفيه عائلي',
    nameFr: 'Jouets & Jeux de Société',
    shippingSuitability: 'HIGH',
    keywordsAr: ['ألعاب أطفال', 'ليغو وتركيب', 'دمى بنات', 'سيارات تحكم لاسلكي', 'ألعاب تعليمية مونتيسوري'],
    keywordsFr: ['jouets', 'jeux enfants', 'lego', 'poupees', 'voitures telecommandees', 'jeux educatifs'],
    keywordsEn: ['toys', 'kids games', 'educational toys', 'rc cars', 'building blocks'],
    subcategories: []
  },
  {
    id: 'sports_equipment',
    nameEn: 'Sports Gear & Fitness',
    nameAr: 'معدات وملابس رياضية ومكملات',
    nameFr: 'Articles de Sport & Fitness',
    shippingSuitability: 'HIGH',
    keywordsAr: ['ملابس رياضية', 'أثقال ودمبلز', 'مكملات غذائية بروتين', 'كرات قدم', 'أحزمة ظهر رياضية', 'حبال قفز'],
    keywordsFr: ['sport', 'fitness', 'musculation', 'tenue de sport', 'proteine', 'halteres'],
    keywordsEn: ['fitness gear', 'sportswear', 'gym accessories', 'dumbbells', 'protein supplements'],
    subcategories: []
  },
  {
    id: 'automotive_products',
    nameEn: 'Automotive Accessories & Detailing',
    nameAr: 'إكسسوارات سيارات ومواد العناية',
    nameFr: 'Accessoires Auto & Entretien',
    shippingSuitability: 'HIGH',
    keywordsAr: ['إكسسوارات سيارات', 'شواحن ولاعة سيارة', 'معطرات سيارات أصلية', 'أغطية مقاعد جلد', 'منظفات بوليمر وتلميع'],
    keywordsFr: ['accessoires auto', 'detailing', 'parfum voiture', 'housses sieges', 'nettoyage auto'],
    keywordsEn: ['car accessories', 'car detailing', 'phone holders', 'car fresheners'],
    subcategories: []
  },
  {
    id: 'spare_parts',
    nameEn: 'Light Auto Spare Parts',
    nameAr: 'قطع غيار سيارات قابلة للشحن',
    nameFr: 'Pièces Détachées (Colisables)',
    shippingSuitability: 'MEDIUM',
    keywordsAr: ['قطع غيار طرود', 'فلاتر زيت وهواء', 'حساسات سيارات', 'شمعات احتراق بوجيات', 'مفاتيح سيارات مشفرة'],
    keywordsFr: ['pieces detachees', 'filtres auto', 'bougies dallumage', 'capteurs auto', 'clefs voitures'],
    keywordsEn: ['auto spare parts', 'car filters', 'spark plugs', 'car sensors'],
    subcategories: []
  },
  {
    id: 'food_products',
    nameEn: 'Gourmet & Terroir Food (Parcel Safe)',
    nameAr: 'منتجات غذائية تقليدية مناسبة للشحن',
    nameFr: 'Produits du Terroir (Colisables)',
    shippingSuitability: 'HIGH',
    keywordsAr: ['عسل طبيعي حر', 'تمور دقلة نور فاخرة', 'زيت زيتون أصلي معصور على البارد', 'توابل تقليدية', 'مكسرات وفاكهة مجففة', 'شوكولاتة حرفية'],
    keywordsFr: ['miel pur', 'dattes deglet nour', 'huile dolive extra vierge', 'epices', 'fruits secs', 'chocolat artisanal'],
    keywordsEn: ['pure honey', 'deglet nour dates', 'olive oil', 'traditional spices', 'nuts and dry fruits'],
    subcategories: []
  },
  {
    id: 'gifts',
    nameEn: 'Personalized Gifts & Craft Boxes',
    nameAr: 'هدايا وتذكارات وبوكسات مفاجآت',
    nameFr: 'Cadeaux & Box Personnalisées',
    shippingSuitability: 'HIGH',
    keywordsAr: ['بوكس هدايا', 'هدايا تخرج', 'تطريز بالاسم', 'طباعة مخصصة على الأكواب والقمصان', 'علب هدايا رجالية'],
    keywordsFr: ['box cadeau', 'cadeau anniversaire', 'personnalise', 'mug personnalise', 'coffret cadeau'],
    keywordsEn: ['gift boxes', 'custom embroidery', 'personalized gifts', 'printed mugs'],
    subcategories: []
  },
  {
    id: 'accessories',
    nameEn: 'Bags, Wallets & Sunglasses',
    nameAr: 'حقائب، محافظ ونظارات شمسية',
    nameFr: 'Maroquinerie, Sacs & Lunettes',
    shippingSuitability: 'HIGH',
    keywordsAr: ['حقائب يد', 'محافظ جلدية أصلية', 'أحزمة جلد', 'نظارات شمسية أصلية بولارايزد', 'كاسكيتات كابات'],
    keywordsFr: ['sacs a main', 'portefeuilles cuir', 'ceintures', 'lunettes de soleil', 'casquettes'],
    keywordsEn: ['handbags', 'leather wallets', 'sunglasses', 'belts', 'caps'],
    subcategories: []
  },
  {
    id: 'ecommerce_general',
    nameEn: 'General E-commerce Store',
    nameAr: 'متجر تسوق إلكتروني شامل',
    nameFr: 'E-commerce Généraliste',
    shippingSuitability: 'HIGH',
    keywordsAr: ['متجر إلكتروني', 'تسوق أونلاين', 'منتجات متنوعة', 'شوبينغ الجزائر', 'سلة الشراء', 'الدفع عند الاستلام'],
    keywordsFr: ['boutique en ligne', 'e-commerce algerie', 'shopping dz', 'livraison a domicile', 'paiement a la livraison'],
    keywordsEn: ['online store', 'ecommerce algeria', 'cash on delivery', 'online shopping'],
    subcategories: []
  },
  {
    id: 'b2b_wholesale',
    nameEn: 'Wholesale & B2B Distributors',
    nameAr: 'تجارة الجملة ومستودعات التوزيع',
    nameFr: 'Commerce de Gros & Distribution B2B',
    shippingSuitability: 'HIGH',
    keywordsAr: ['بيع بالجملة', 'مستودع توزيع', 'مستورد وموزع', 'سوق دبي العلمة', 'سوق دبي الجلفة', 'توزيع وطني للبضائع'],
    keywordsFr: ['grossiste', 'vente en gros', 'import export', 'distributeur officiel', 'el eulma gros'],
    keywordsEn: ['wholesaler', 'bulk supplier', 'distribution center', 'b2b distributor'],
    subcategories: []
  },
  {
    id: 'other_shippable',
    nameEn: 'Other Shippable Consumer Goods',
    nameAr: 'سلع استهلاكية متنوعة قابلة للشحن',
    nameFr: 'Autres Produits Consommables Expédiables',
    shippingSuitability: 'MEDIUM',
    keywordsAr: ['بضائع استهلاكية', 'طرود شحن', 'مستلزمات حرفية', 'أدوات يدوية'],
    keywordsFr: ['articles divers', 'consommables', 'outillage leger'],
    keywordsEn: ['consumer goods', 'hand tools', 'craft supplies'],
    subcategories: []
  }
];

/**
 * Generates discovery query combinations across Wilayas, Communes, and Categories
 */
export function generateSearchMatrix(
  wilayaName: string,
  categoryIds: string[],
  communeName?: string
): { query: string; category: string; lang: 'ar' | 'fr' }[] {
  const queries: { query: string; category: string; lang: 'ar' | 'fr' }[] = [];
  const targetLocation = communeName ? `${communeName} ${wilayaName}` : wilayaName;

  for (const catId of categoryIds) {
    const category = MERCHANT_CATEGORIES.find(c => c.id === catId);
    if (!category) continue;

    // Arabic queries
    for (const kw of category.keywordsAr.slice(0, 3)) {
      queries.push({ query: `${kw} ${targetLocation}`, category: catId, lang: 'ar' });
      queries.push({ query: `متجر ${kw} ${targetLocation}`, category: catId, lang: 'ar' });
    }

    // French queries
    for (const kw of category.keywordsFr.slice(0, 3)) {
      queries.push({ query: `${kw} ${targetLocation}`, category: catId, lang: 'fr' });
      queries.push({ query: `boutique ${kw} ${targetLocation}`, category: catId, lang: 'fr' });
    }
  }

  return queries;
}
