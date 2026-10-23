// Auto-generated production BOM dataset extracted from factory master records
export interface BOMModelRecord {
  code: string;
  name: string;
  sheetName: string;
  notes?: string;
}

export interface BOMPartRecord {
  partCode: string;
  descEn: string;
  descAr: string;
  uom: string;
  models: string[]; // List of model codes that utilize this part
}

export interface BOMSnapshotRecord {
  modelCode: string;
  partCode: string;
  snapshotDate: string;
}

export const INITIAL_BOM_MODELS: BOMModelRecord[] = [
  {
    "code": "R-250MGR-BK2",
    "name": "MICROWAVE SHARP 25L GRILL BLACK",
    "sheetName": "R-250MGR-BK2",
    "notes": ""
  },
  {
    "code": "R-250MGR-SL2",
    "name": "MICROWAVE SHARP 25L GRILL SILVER",
    "sheetName": "R-250MGR-SL2",
    "notes": ""
  },
  {
    "code": "R-280CR(S)",
    "name": "MICROWAVE SHARP 28 L SOLO SILVER",
    "sheetName": "R-280CR(S)",
    "notes": ""
  },
  {
    "code": "R-340GRI-BS2",
    "name": "MICROWAVE SHARP,34L, black",
    "sheetName": "R-340GRI-BS2",
    "notes": ""
  },
  {
    "code": "TMD-25GE-S",
    "name": "microwave tornado 25l with grill silver",
    "sheetName": "TMD-25GE-S",
    "notes": ""
  },
  {
    "code": "TMD-25SE-BK",
    "name": "microwave tornado 25l solo black",
    "sheetName": "TMD-25SE-BK",
    "notes": ""
  },
  {
    "code": "TMD-25SE-S",
    "name": "microwave tornado 25l solo silver",
    "sheetName": "TMD-25SE-S",
    "notes": ""
  },
  {
    "code": "TMD-28S-BK",
    "name": "Tornado Microwave 28L Black Without Gril",
    "sheetName": "TMD-28S-BK",
    "notes": ""
  },
  {
    "code": "TMD-36GE-BK",
    "name": "microwave tornado 36l with grill black",
    "sheetName": "TMD-36GE-BK",
    "notes": ""
  },
  {
    "code": "TMD-36GE-SS",
    "name": "microwave tornado 36l with grill silver",
    "sheetName": "TMD-36GE-SS",
    "notes": ""
  },
  {
    "code": "TMDG-25EL-BKS",
    "name": "microwave tornado 25l,grill,blacksilver",
    "sheetName": "TMDG-25EL-BKS",
    "notes": ""
  },
  {
    "code": "TMDG-25EL-S",
    "name": "TORNADO MICROWAVE 25L GRILL SILVER",
    "sheetName": "TMDG-25EL-S",
    "notes": ""
  },
  {
    "code": "TMDS-25EL-BKS",
    "name": "Microwave tornado,solo,25l, blacksilver",
    "sheetName": "TMDS-25EL-BKS",
    "notes": ""
  },
  {
    "code": "TMDS-25EL-S",
    "name": "TORNADO MICROWAVE 25L SOLO SILVER",
    "sheetName": "TMDS-25EL-S",
    "notes": ""
  },
  {
    "code": "TMMS-25EL-BKS",
    "name": "Tornado Microwave 25L Mech Solo Blck Slv",
    "sheetName": "TMMS-25EL-BKS",
    "notes": ""
  },
  {
    "code": "TMMS-25EL-S",
    "name": "TORNADO MICROWAVE 25L MECH SOLO SILVER",
    "sheetName": "TMMS-25EL-S",
    "notes": ""
  }
];

export const INITIAL_BOM_PARTS: BOMPartRecord[] = [
  {
    "partCode": "12270000005167",
    "descEn": "BASE PLATE(25L)",
    "descAr": "اللوحة الأساسية (25 لتر)",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "12270000000175M",
    "descEn": "SGCC-Z22, T0.5 COIL W=149mm",
    "descAr": "صاج SGCC-Z22، سمك 0.5 مم، ملف بعرض 149 مم",
    "uom": "KG",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "12270000006211M",
    "descEn": "SGCC-Z22, T0.5 COIL W=156mm",
    "descAr": "صاج SGCC-Z22، سمك 0.5 مم، ملف بعرض 156 مم",
    "uom": "KG",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "12270000006329M",
    "descEn": "SGCC-Z22 T0.5mm COIL  W=186 mm",
    "descAr": "صاج SGCC-Z22، سمك 0.5 مم، ملف بعرض 186 مم",
    "uom": "KG",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "TMD-25GE-S",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "12270000008094M",
    "descEn": "SGCC-Z22, T0.5 COIL W=107mm",
    "descAr": "صاج SGCC-Z22، سمك 0.5 مم، ملف بعرض 107 مم",
    "uom": "KG",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "TMD-25GE-S",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "M256894000001H",
    "descEn": "SGCD1 , Coil * 560*.6 mm",
    "descAr": "صاج SGCD1، ملف 560 × 0.6 مم",
    "uom": "KG",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMWSG0130",
    "descEn": "SGCD1 , Coil * 1130*0.6 mm",
    "descAr": "صاج SGCD1، ملف 1130 × 0.6 مم",
    "uom": "KG",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TS25047",
    "descEn": "RACK",
    "descAr": "رف",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "EI000098",
    "descEn": "حديد رايش تشغيل أبيض",
    "descAr": "حديد رايش تشغيل أبيض",
    "uom": "KG",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "MWSURF09",
    "descEn": "Surfactant plus 09",
    "descAr": "مادة خافضة للتوتر السطحي بلس 09",
    "uom": "KG",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TS25036",
    "descEn": "Cavity Assembly ( Gray Color )",
    "descAr": "تجميع التجويف الداخلي (اللون الرمادي)",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "MWDEGCF01",
    "descEn": "Degreaser CF",
    "descAr": "مزيل الشحوم CF",
    "uom": "KG",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TS25009",
    "descEn": "Mica Plate",
    "descAr": "لوح الميكا",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25022",
    "descEn": "Leg",
    "descAr": "رجل",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS25051",
    "descEn": "Lower Hinge",
    "descAr": "المفصلة السفلية",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "SHR25006",
    "descEn": "Control Panel Assembly",
    "descAr": "تجميع لوحة التحكم",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2"
    ]
  },
  {
    "partCode": "TS25048",
    "descEn": "Door Plate Ass'y",
    "descAr": "تجميع لوحة الباب",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS250611",
    "descEn": "LATCH ( Door Hook )",
    "descAr": "مزلاج (خطاف الباب)",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS25037",
    "descEn": "Latch Spring",
    "descAr": "سوستة المزلاج",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25049",
    "descEn": "ASS'Y Upper Hinge",
    "descAr": "تجميع المفصلة العلوية",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS25007",
    "descEn": "Door Film",
    "descAr": "فيلم الباب",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "SHR25013",
    "descEn": "DOOR PANEL",
    "descAr": "لوحة الباب",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2"
    ]
  },
  {
    "partCode": "TS25015",
    "descEn": "Magnetron",
    "descAr": "الماجنترون",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS25310",
    "descEn": ".V.Transformer",
    "descAr": "محول الجهد العالي",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "TS25016",
    "descEn": "H.V.Capacitor",
    "descAr": "مكثف الجهد العالي",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "SHR25017",
    "descEn": ".V.Diode",
    "descAr": "دايود الجهد العالي",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "TS25020",
    "descEn": "Noise Filter",
    "descAr": "فلتر تشويش",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25029",
    "descEn": "Lamp",
    "descAr": "لمبة",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "SHR25020",
    "descEn": "Thermostat 70/59℃",
    "descAr": "ثرموستات 70/59°م",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "SHR25021",
    "descEn": "Thermostat 160/95℃",
    "descAr": "ثرموستات 160/95°م",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "TS25017",
    "descEn": "Quartz Tube",
    "descAr": "أنبوب كوارتز",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "TS25034",
    "descEn": "Switch Support",
    "descAr": "حامل المفتاح",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS25025",
    "descEn": "Lever Switch",
    "descAr": "مفتاح رافعة",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS25027",
    "descEn": "Switch",
    "descAr": "مفتاح",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS25026",
    "descEn": "Monitor Switch",
    "descAr": "مفتاح المراقبة",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TS25302",
    "descEn": "Harness ( Main )",
    "descAr": "ضفيرة الأسلاك الرئيسية",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "TS25030",
    "descEn": "Synchronous motor",
    "descAr": "موتور متزامن",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25014",
    "descEn": "Plastic Coupler",
    "descAr": "وصلة بلاستيك",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "TS25028",
    "descEn": "-T Ring Ass'y",
    "descAr": "تجميع حلقة الدوران",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TS25032",
    "descEn": "Turntable",
    "descAr": "الطبق الدوار",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TS25008",
    "descEn": "Air Guide Sponge",
    "descAr": "إسفنجة توجيه الهواء",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS25306",
    "descEn": "OUTER CASE ( Black Color )",
    "descAr": "الهيكل الخارجي (اللون الأسود)",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2"
    ]
  },
  {
    "partCode": "TS25042",
    "descEn": "Screw MJ03-00025 CT4*8-F",
    "descAr": "مسمار MJ03-00025 CT4×8-F",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25074",
    "descEn": "Screw RoHS MJ02-00393 ST4*25-T 1022",
    "descAr": "مسمار RoHS MJ02-00393 ST4×25-T 1022",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-340GRI-BS2",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "SHR25040",
    "descEn": "Screw and washer MJ02-00393 ST3.9*8",
    "descAr": "مسمار ووردة MJ02-00393 ST3.9×8",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS25046",
    "descEn": "Screw MJ02-00282 ST4*12-T",
    "descAr": "مسمار MJ02-00282 ST4×12-T",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "SHR25043",
    "descEn": "DOUBLE FACE TAPE",
    "descAr": "شريط لاصق مزدوج الوجه",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "TS25012",
    "descEn": "Adhesive Tape ( Roll=90m )",
    "descAr": "شريط لاصق (الرول = 90 متر)",
    "uom": "ROL",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25010",
    "descEn": "Scratch Protector",
    "descAr": "واقي من الخدوش",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25013",
    "descEn": "Silica gel ( Bottle=300ml )",
    "descAr": "جل السيليكا (عبوة = 300 مل)",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-36GE-BK"
    ]
  },
  {
    "partCode": "TS25023",
    "descEn": "Power cord holder",
    "descAr": "حامل سلك الكهرباء",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "TS25035",
    "descEn": "Shaded-pole motor",
    "descAr": "موتور ذو قطب مظلل",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "AZNORIB140101K/",
    "descEn": "SCREW LOCK BOND(1401 B THREE BOND)",
    "descAr": "لاصق تثبيت مسامير (1401 B Three Bond)",
    "uom": "G",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW2536SG",
    "descEn": "SILICON GREASE TYPE NO.KS-64",
    "descAr": "شحم سيليكون نوع KS-64",
    "uom": "G",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "16270000S06051",
    "descEn": "SILICONE OIL -1000CS",
    "descAr": "زيت سيليكون 1000CS",
    "uom": "G",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TS25006",
    "descEn": "Grill Tube Connector ( Lead Wire )",
    "descAr": "وصلة أنبوب الشواية (بسلك توصيل)",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "12270000005167T",
    "descEn": "BASE PLATE(25L) after treatment",
    "descAr": "اللوحة الأساسية (25 لتر) بعد المعالجة",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "12270000006211",
    "descEn": "HOLDER H.V.C",
    "descAr": "حامل مكثف الجهد العالي",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "12270000000175",
    "descEn": "GUIDE WIND",
    "descAr": "مجرى توجيه الهواء",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "12270000008094",
    "descEn": "BRKT LIGHT HEATER",
    "descAr": "حامل سخان الإضاءة",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "TMD-25GE-S",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "12270000006329",
    "descEn": "INSULATOR HEAT * T",
    "descAr": "عازل حراري T",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "TMD-25GE-S",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "M12170000004303",
    "descEn": "FAN GUIDE",
    "descAr": "دليل المروحة",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "M12170000000206",
    "descEn": "FAN",
    "descAr": "مروحة",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "M12170000009523",
    "descEn": "DOOR GASKET 25L",
    "descAr": "جوان باب 25 لتر",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "T08740001",
    "descEn": "New Microwave Power Cord",
    "descAr": "سلك كهرباء ميكروويف جديد",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "SHARP-250MGR-F",
    "descEn": "Microwave-R-250MGR-SHARP-PRINT-3.2 mm-F",
    "descAr": "ميكروويف R-250MGR شارب، طباعة 3.2 مم - F",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "PKMWSCBFF0020",
    "descEn": "Carton box R-250MGR",
    "descAr": "كرتونة R-250MGR",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "16270000S06003",
    "descEn": "CAUTION LABEL",
    "descAr": "ملصق تحذير",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWSLBPE0010",
    "descEn": "Rating Label R-250MGR-BK2/SL2",
    "descAr": "ملصق البيانات R-250MGR-BK2/SL2",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "JCG45-10-002",
    "descEn": "Poly Bag (CBU) LDPE 25um 70x70cm",
    "descAr": "كيس بولي إيثيلين LDPE، سمك 25 ميكرون، مقاس 70×70 سم",
    "uom": "KG",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMWUF25",
    "descEn": "MW Upper Foam 25L",
    "descAr": "فوم علوي للميكروويف 25 لتر",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMWLF25",
    "descEn": "MW Lower Foam 25L",
    "descAr": "فوم سفلي للميكروويف 25 لتر",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWSOMPR0021",
    "descEn": "Owner Manual R-250MGR-BK2/SL2 900W",
    "descAr": "دليل المستخدم R-250MGR-BK2/SL2، قدرة 900 وات",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "WCARD2N-1",
    "descEn": "Warranty Card 2 Year ضمان 2سنة",
    "descAr": "كارت ضمان سنتين",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "CELLOTAPE5X900",
    "descEn": "Cellophane tape 5x900m  لزق سولوتب",
    "descAr": "شريط سيلوفان 5×900 متر (لزق سولوتب)",
    "uom": "M",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "BARCODEABC",
    "descEn": "Barcode Label ABC استيكر باركود",
    "descAr": "ملصق باركود ABC",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "H39235106110",
    "descEn": "POLYETHELENE BAG (16X25) CM",
    "descAr": "كيس بولي إيثيلين مقاس 16×25 سم",
    "uom": "KG",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKG-GSI0010",
    "descEn": "دبوس دباسة 18/35",
    "descAr": "دبوس دباسة 18/35",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PWL6-2-1",
    "descEn": "Product WLabel 6cm -2-1",
    "descAr": "ملصق المنتج W، مقاس 6 سم - 2-1",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "SHR25070",
    "descEn": "Tape 14*0.5*25",
    "descAr": "شريط 14×0.5×25",
    "uom": "ROL",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "TS25005",
    "descEn": "Fuse",
    "descAr": "فيوز",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TSI34015",
    "descEn": "Screw CT3*6-F 1022",
    "descAr": "مسمار CT3×6-F 1022",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TSI34020",
    "descEn": "Screw MJ02-00552 ST2.9*12-C-H 1022",
    "descAr": "مسمار MJ02-00552 ST2.9×12-C-H 1022",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "PKMWSLBPR0020",
    "descEn": "Carton Label R-250MGR-BK2",
    "descAr": "ملصق الكرتونة R-250MGR-BK2",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2"
    ]
  },
  {
    "partCode": "12270000000677",
    "descEn": "Rubber Sheet(L 70 mm & w =8.0 mm& t=2mm)",
    "descAr": "شريحة مطاط (طول 70 مم × عرض 8 مم × سمك 2 مم)",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "AZTAPEP50A-09K",
    "descEn": "\"POLYESTER TAPE,NO.53 (W=50MM)\"",
    "descAr": "شريط بوليستر رقم 53 (عرض 50 مم)",
    "uom": "M",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "QR-CODE-30MM",
    "descEn": "استيكر QR موحد 30x30",
    "descAr": "ملصق QR موحد 30×30",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "RFILM1",
    "descEn": "WAX RIBBON 450M X102 MM",
    "descAr": "شريط شمعي للطباعة (WAX RIBBON) مقاس 450 متر × 102 مم",
    "uom": "PC",
    "models": [
      "R-250MGR-BK2",
      "R-250MGR-SL2",
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "SHR25052",
    "descEn": "Control Panel Assembly",
    "descAr": "تجميع لوحة التحكم",
    "uom": "PC",
    "models": [
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "SHR25053",
    "descEn": "Door Panel",
    "descAr": "لوحة الباب",
    "uom": "PC",
    "models": [
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "TS25700",
    "descEn": "OUTER CASE ( Silver Color )",
    "descAr": "الهيكل الخارجي (اللون الفضي)",
    "uom": "PC",
    "models": [
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "PKMWSLBPR0030",
    "descEn": "Carton Label R-250MGR-SL2",
    "descAr": "ملصق الكرتونة R-250MGR-SL2",
    "uom": "PC",
    "models": [
      "R-250MGR-SL2"
    ]
  },
  {
    "partCode": "TR28S008",
    "descEn": "Cavity Assembly  RoHS",
    "descAr": "تجميع التجويف الداخلي مطابق لمعيار RoHS",
    "uom": "PC",
    "models": [
      "R-280CR(S)",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "SHR280006",
    "descEn": "Control Panel Assembly",
    "descAr": "تجميع لوحة التحكم",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "SHR280012",
    "descEn": "Door Panel",
    "descAr": "لوحة الباب",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "SHR280013",
    "descEn": "Magnetron",
    "descAr": "الماجنترون",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "SHR280014",
    "descEn": "H.V.Transformer",
    "descAr": "محول الجهد العالي",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "SHR280015",
    "descEn": "H.V.Capacitor",
    "descAr": "مكثف الجهد العالي",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "TS25004",
    "descEn": "H.V. Diode",
    "descAr": "دايود الجهد العالي",
    "uom": "PC",
    "models": [
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "SHR280019",
    "descEn": "Thermostat 160/95℃",
    "descAr": "ثرموستات 160/95°م",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "SHR280024",
    "descEn": "Main Wire Harness",
    "descAr": "ضفيرة الأسلاك الرئيسية",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "SHR25029",
    "descEn": "Coupler",
    "descAr": "وصلة",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "TS250123",
    "descEn": "ASS'Y RING ROTATING",
    "descAr": "تجميع حلقة الدوران",
    "uom": "PC",
    "models": [
      "R-280CR(S)",
      "R-340GRI-BS2",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "SHR280028",
    "descEn": "Glass Turntable",
    "descAr": "الطبق الزجاجي الدوار",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "TS25204",
    "descEn": "OUTER CASE ( Silver Color )",
    "descAr": "الهيكل الخارجي (اللون الفضي)",
    "uom": "PC",
    "models": [
      "R-280CR(S)",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TS25710",
    "descEn": "Tape",
    "descAr": "شريط لاصق",
    "uom": "ROL",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "SHARP-280CR-F",
    "descEn": "Microwave-R-280-SHARP-PRINT-3.2 mm-F",
    "descAr": "ميكروويف R-280 شارب، طباعة 3.2 مم - F",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "PKMWSCBFF0031",
    "descEn": "Carton Box MWO Sharp- R-280CR(S) -single",
    "descAr": "كرتونة ميكروويف شارب R-280CR(S) مفرد",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "PKMWSLBPE0020",
    "descEn": "Rating Label R-280CR(S)",
    "descAr": "ملصق البيانات R-280CR(S)",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "PKMWSOMPR0040",
    "descEn": "Owner Manual 28L SHARP",
    "descAr": "دليل مستخدم شارب 28 لتر",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "TSI340179",
    "descEn": "PE",
    "descAr": "بولي إيثيلين (PE)",
    "uom": "ROL",
    "models": [
      "R-280CR(S)",
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250607",
    "descEn": "Air Deduct board",
    "descAr": "لوح توجيه الهواء",
    "uom": "PC",
    "models": [
      "R-280CR(S)",
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "SHR280070",
    "descEn": "Shockproof Pad",
    "descAr": "وسادة مقاومة للصدمات",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "TS250108",
    "descEn": "Ass'y H.V.Fuse",
    "descAr": "تجميع فيوز الجهد العالي",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "TS250606",
    "descEn": "ThermostAt Bracket",
    "descAr": "حامل الثرموستات",
    "uom": "PC",
    "models": [
      "R-280CR(S)",
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "PKMWSLBPR0040",
    "descEn": "Carton Label R-280CR(S)",
    "descAr": "ملصق الكرتونة R-280CR(S)",
    "uom": "PC",
    "models": [
      "R-280CR(S)"
    ]
  },
  {
    "partCode": "TS25038",
    "descEn": "Screw MJ02-00375 ST4*20-T",
    "descAr": "مسمار MJ02-00375 ST4×20-T",
    "uom": "PC",
    "models": [
      "R-280CR(S)",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "M345823000001H",
    "descEn": "SGCD1 ,Coil * 558*.6 mm",
    "descAr": "ملف صاج SGCD1 مقاس 558 × 0.6 مم",
    "uom": "KG",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250100",
    "descEn": "Sealing Ring",
    "descAr": "حلقة إحكام",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TSR250101",
    "descEn": "MW leg R340",
    "descAr": "رجل ميكروويف R340",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250103",
    "descEn": "Quakerproof items 267*10*8mm",
    "descAr": "مادة مقاومة للماء مقاس 267 × 10 × 8 مم",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TSI34001",
    "descEn": "Magnetron",
    "descAr": "مغنطرون",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250601",
    "descEn": "Thermostat 90/80 *H",
    "descAr": "ثرموستات 90/80 × H",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250107",
    "descEn": "Thermostat 180/145*H",
    "descAr": "ثرموستات 180/145 × H",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TSI34002",
    "descEn": "Control Panel Assembly ( Black Color )",
    "descAr": "تجميعة لوحة التحكم (باللون الأسود)",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TSI34003",
    "descEn": "Noise Fliter Assembly",
    "descAr": "تجميعة فلتر التشويش",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250603",
    "descEn": "COVER HEATER*T",
    "descAr": "غطاء السخان T",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250604",
    "descEn": "Heater Sheath *T",
    "descAr": "غلاف السخان T",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250113",
    "descEn": "Film",
    "descAr": "فيلم",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TSI34004",
    "descEn": "Door Panel",
    "descAr": "لوحة الباب",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TSI34005",
    "descEn": "METAL DOOR DECO.",
    "descAr": "زخرفة معدنية للباب",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250117",
    "descEn": "Coupler",
    "descAr": "وصلة",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS340118",
    "descEn": "COVER CAVITY LAMP",
    "descAr": "غطاء لمبة التجويف",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250119",
    "descEn": "Connector",
    "descAr": "موصل كهربائي",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS340121",
    "descEn": "Latch Board",
    "descAr": "لوحة المزلاج",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TSI34008",
    "descEn": "Main Wire Harness",
    "descAr": "ضفيرة الأسلاك الرئيسية",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250612",
    "descEn": "Cavity Assembly ( Silver Color )",
    "descAr": "تجميعة التجويف (باللون الفضي)",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250129",
    "descEn": "Sleeve",
    "descAr": "جلبة",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250130",
    "descEn": "DOOR FRAME ASS'Y",
    "descAr": "تجميعة إطار الباب",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS36051",
    "descEn": "ASS'Y HINGE  upper",
    "descAr": "تجميعة المفصلة العلوية",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TSI34012",
    "descEn": "Housing Cover",
    "descAr": "غطاء الهيكل",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250132",
    "descEn": "Rack 36L",
    "descAr": "شبكة 36 لتر",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TSI34013",
    "descEn": "Plastic Bracket",
    "descAr": "حامل بلاستيك",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TSI34014",
    "descEn": "Inverter Assembly",
    "descAr": "تجميعة الإنفرتر",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TS250126",
    "descEn": "Nut M4 RoHS GBT6177 M4.0*4.5",
    "descAr": "صامولة M4 مطابقة للمواصفات RoHS GBT6177 M4.0×4.5",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25043",
    "descEn": "Screw RoHS MJ02-00532 ST4*6-F 1022",
    "descAr": "مسمار RoHS MJ02-00532 ST4×6-F 1022",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS25039",
    "descEn": "Spring Washer",
    "descAr": "واشر سوستة",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250128",
    "descEn": "Screw RoHS MJ01-00145 M4*18-F 1022",
    "descAr": "مسمار RoHS MJ01-00145 M4×18-F 1022",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TSI340180",
    "descEn": "PE",
    "descAr": "بولي إيثيلين PE",
    "uom": "ROL",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "12270000005139",
    "descEn": "BASE PLATE(34 & 36 L)",
    "descAr": "قاعدة الهيكل (34 و36 لتر)",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "M12170000009546",
    "descEn": "DOOR GASKET 34&36L",
    "descAr": "كاوتش حشوة الباب 34 و36 لتر",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "SHARP-340GR-F",
    "descEn": "Microwave-R-340-SHARP-PRINT-3.2 mm-F",
    "descAr": "طباعة باب ميكروويف R-340 من SHARP مقاس 3.2 مم",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "PKMWSCBFF0010",
    "descEn": "Carton Box R-340GRI",
    "descAr": "كرتونة R-340GRI",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "PKMWSLBPE0030",
    "descEn": "Rating Label R-340GRI-BS2",
    "descAr": "ملصق بيانات R-340GRI-BS2",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TMWUF36",
    "descEn": "MW Upper Foam 36L",
    "descAr": "فوم علوي 36 لتر",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TMWLF36",
    "descEn": "MW Lower Foam 36L",
    "descAr": "فوم سفلي 36 لتر",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "PKMWSOMPR0010",
    "descEn": "Owner Manual R-340GRI-BS2",
    "descAr": "دليل تشغيل R-340GRI-BS2",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TSI34005B",
    "descEn": "Bottom METAL DOOR DECO",
    "descAr": "زخرفة معدنية سفلية للباب",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "PKMWSLBPR0010",
    "descEn": "Carton Label R-340GRI-BS2",
    "descAr": "ملصق الكرتونة R-340GRI-BS2",
    "uom": "PC",
    "models": [
      "R-340GRI-BS2"
    ]
  },
  {
    "partCode": "TM25025",
    "descEn": "Cavity Assembly ( Gray Color )",
    "descAr": "تجميعة التجويف (باللون الرمادي)",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "TM25026",
    "descEn": "Control Panel Assembly(silver color)",
    "descAr": "تجميعة لوحة التحكم (باللون الفضي)",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "TS25033",
    "descEn": "Latch",
    "descAr": "مزلاج الباب",
    "uom": "PC",
    "models": [
      "TMD-25GE-S",
      "TMD-28S-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TM25027",
    "descEn": "Door Panel(silver color)",
    "descAr": "لوحة الباب (باللون الفضي)",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "TS25018",
    "descEn": "H.V.Transformer",
    "descAr": "محول الجهد العالي",
    "uom": "PC",
    "models": [
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS25001",
    "descEn": "H.V.Fuse",
    "descAr": "فيوز الجهد العالي",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "TS25002",
    "descEn": "Thermostat 70/59 * V",
    "descAr": "ثرموستات 70/59 × V",
    "uom": "PC",
    "models": [
      "TMD-25GE-S",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25003",
    "descEn": "Thermostat 160/95 * H",
    "descAr": "ثرموستات 160/95 × H",
    "uom": "PC",
    "models": [
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS25800",
    "descEn": "Quartz Tube ( AC115V　500W )",
    "descAr": "أنبوب كوارتز (AC115V، 500W)",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "TS25031",
    "descEn": "Harness",
    "descAr": "ضفيرة أسلاك",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "TS25050",
    "descEn": "OUTER CASE ( Silver Color )",
    "descAr": "الغلاف الخارجي (باللون الفضي)",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "TS25040",
    "descEn": "Screw GBT845 ST4*10-C-H",
    "descAr": "مسمار GBT845 ST4×10-C-H",
    "uom": "PC",
    "models": [
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TBN25044",
    "descEn": "Screw RoHS MJ03-00019 CT3*6-F 1022",
    "descAr": "مسمار RoHS MJ03-00019 CT3×6-F 1022",
    "uom": "PC",
    "models": [
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25045",
    "descEn": "Screw  RoHS MJ02-00552 ST2.9*12-C-H 1022",
    "descAr": "مسمار RoHS MJ02-00552 ST2.9×12-C-H 1022",
    "uom": "PC",
    "models": [
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25024",
    "descEn": "arness ( Main )",
    "descAr": "الضفيرة الرئيسية",
    "uom": "PC",
    "models": [
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS25011",
    "descEn": "Double Face W30mm (Plastic Frame&Glass)",
    "descAr": "شريط لاصق مزدوج الوجه W30 مم (للإطار البلاستيك والزجاج)",
    "uom": "ROL",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "TM25000025",
    "descEn": "(25L)-DOOR-Microwave-TORNADO-GE-PRINT-4m",
    "descAr": "طباعة باب ميكروويف تورنادو 25 لتر GE مقاس 4 مم",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "PKMWTLBPE0160",
    "descEn": "Rating Label TMD-25GE-S",
    "descAr": "ملصق بيانات TMD-25GE-S",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "PKMWTOMPR0120",
    "descEn": "Owner Manual TMD25GE",
    "descAr": "دليل تشغيل TMD25GE",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "WCARD1N-1",
    "descEn": "Warranty Card 1 Year ضمان 1سنة",
    "descAr": "كارت ضمان سنة واحدة",
    "uom": "PC",
    "models": [
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PWL6-1-1",
    "descEn": "Product WLabel 6cm -1-1",
    "descAr": "ملصق المنتج WLabel مقاس 6 سم - 1-1",
    "uom": "PC",
    "models": [
      "TMD-25GE-S",
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS",
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTCBFF0250",
    "descEn": "Carton Box TMD25GES",
    "descAr": "كرتونة TMD25GES",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "PKMWTLBPR0370",
    "descEn": "Carton label TM25GES",
    "descAr": "ملصق الكرتونة TM25GES",
    "uom": "PC",
    "models": [
      "TMD-25GE-S"
    ]
  },
  {
    "partCode": "TS25072",
    "descEn": "Cavity Assembly ( Gray  Color )",
    "descAr": "تجميعة التجويف (باللون الرمادي)",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TM25K025",
    "descEn": "Control Panel Assembly ( Black Color )",
    "descAr": "تجميعة لوحة التحكم (باللون الأسود)",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK"
    ]
  },
  {
    "partCode": "TS25067",
    "descEn": "LATCH",
    "descAr": "مزلاج",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-36GE-BK"
    ]
  },
  {
    "partCode": "TS25064",
    "descEn": "Door Panel ( Black Color )",
    "descAr": "لوحة الباب (باللون الأسود)",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK"
    ]
  },
  {
    "partCode": "TS25063",
    "descEn": "Handle Base ( Black Color )",
    "descAr": "قاعدة المقبض (باللون الأسود)",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK"
    ]
  },
  {
    "partCode": "TS25062",
    "descEn": "Handle Cover ( Black Color )",
    "descAr": "غطاء المقبض (باللون الأسود)",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK"
    ]
  },
  {
    "partCode": "TS25080",
    "descEn": "H.V.Fuse Assy",
    "descAr": "تجميعة فيوز الجهد العالي",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS25066",
    "descEn": "Coupler",
    "descAr": "وصلة",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TS25073",
    "descEn": "OUTER CASE ( Black Color )",
    "descAr": "الغلاف الخارجي (باللون الأسود)",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK"
    ]
  },
  {
    "partCode": "TM25S0025",
    "descEn": "(25L)-DOOR-Microwave-TORNADO-SE-PRINT-4m",
    "descAr": "(25 لتر) فيلم باب ميكروويف TORNADO-SE، طباعة 4 مم",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "PKMWTLBPE0130",
    "descEn": "Rating Label TMD-25SE-BK",
    "descAr": "ملصق بيانات TMD-25SE-BK",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK"
    ]
  },
  {
    "partCode": "PKMWTOMPR0130",
    "descEn": "Owner Manual TMD25SE",
    "descAr": "دليل المستخدم TMD25SE",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TS25071",
    "descEn": "Gasket",
    "descAr": "جوان",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TS25060",
    "descEn": "PE Gummed Tape",
    "descAr": "شريط PE لاصق",
    "uom": "ROL",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TS25061",
    "descEn": "PE Gummed Tape",
    "descAr": "شريط PE لاصق",
    "uom": "ROL",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-36GE-BK"
    ]
  },
  {
    "partCode": "TSW250",
    "descEn": "Electrical Spare Parts Main Wire Harness",
    "descAr": "قطع غيار كهربائية – ضفيرة الأسلاك الرئيسية",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "T08740001PVC",
    "descEn": "Microwave Power Cord PVC",
    "descAr": "سلك كهرباء الميكروويف PVC",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S",
      "TMD-28S-BK",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTCBFF0021",
    "descEn": "Carton Box TMD25SEBK",
    "descAr": "كرتونة TMD25SEBK",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK",
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "PKMWTLBPR0300",
    "descEn": "Carton label TM25SEBK",
    "descAr": "ملصق الكرتونة TM25SEBK",
    "uom": "PC",
    "models": [
      "TMD-25SE-BK"
    ]
  },
  {
    "partCode": "TM25K026",
    "descEn": "Control Panel Assembly ( Silver Color )",
    "descAr": "تجميع لوحة التحكم (اللون الفضي)",
    "uom": "PC",
    "models": [
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TS25202",
    "descEn": "Door Panel ( Silver Color )",
    "descAr": "لوحة الباب (اللون الفضي)",
    "uom": "PC",
    "models": [
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TS25201",
    "descEn": "Handle Base ( Silver Color )",
    "descAr": "قاعدة المقبض (اللون الفضي)",
    "uom": "PC",
    "models": [
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TS25200",
    "descEn": "Handle Cover ( Silver Color )",
    "descAr": "غطاء المقبض (اللون الفضي)",
    "uom": "PC",
    "models": [
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "PKMWTLBPE0120",
    "descEn": "Rating Label TMD-25SE-S",
    "descAr": "ملصق البيانات TMD-25SE-S",
    "uom": "PC",
    "models": [
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "PKMWTLBPR0360",
    "descEn": "Carton label TM25SES",
    "descAr": "ملصق الكرتونة TM25SES",
    "uom": "PC",
    "models": [
      "TMD-25SE-S"
    ]
  },
  {
    "partCode": "TR28S009",
    "descEn": "outer case",
    "descAr": "الهيكل الخارجي",
    "uom": "PC",
    "models": [
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TR28S016",
    "descEn": "Control Panel Assembly RoHS",
    "descAr": "تجميع لوحة التحكم مطابق لمعيار RoHS",
    "uom": "PC",
    "models": [
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TR28S023",
    "descEn": "Fuse",
    "descAr": "فيوز",
    "uom": "PC",
    "models": [
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TR28S025",
    "descEn": "Door Panel",
    "descAr": "لوحة الباب",
    "uom": "PC",
    "models": [
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TR28S027",
    "descEn": "Harness",
    "descAr": "ضفيرة الأسلاك",
    "uom": "PC",
    "models": [
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TR28S030",
    "descEn": "Switch",
    "descAr": "مفتاح",
    "uom": "PC",
    "models": [
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "PKMWTLBPE0170",
    "descEn": "Rating Label TMD-28S-BK",
    "descAr": "ملصق البيانات TMD-28S-BK",
    "uom": "PC",
    "models": [
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "PKMWTCBFF0041",
    "descEn": "Carton Box TMD28SBK",
    "descAr": "كرتونة TMD28SBK",
    "uom": "PC",
    "models": [
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TOR-28S-BK-F",
    "descEn": "(28S)-DOOR-Microwave-TOR-PRINT-3mm",
    "descAr": "باب ميكروويف 28S - TORNADO - طباعة 3 مم",
    "uom": "PC",
    "models": [
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "PKMWTOMPR0170",
    "descEn": "Owner Manual TMD28BK",
    "descAr": "دليل المستخدم TMD28BK",
    "uom": "PC",
    "models": [
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TS250124",
    "descEn": "GLASS TRAY",
    "descAr": "صينية زجاجية",
    "uom": "PC",
    "models": [
      "TMD-28S-BK",
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250120",
    "descEn": "Non-woven tape(Roll=25m)",
    "descAr": "شريط غير منسوج (الرول = 25 متر)",
    "uom": "ROL",
    "models": [
      "TMD-28S-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "PKMWTLBPR0310",
    "descEn": "Carton label TM28SBK",
    "descAr": "ملصق الكرتونة TM28SBK",
    "uom": "PC",
    "models": [
      "TMD-28S-BK"
    ]
  },
  {
    "partCode": "TM360130",
    "descEn": "ack",
    "descAr": "رف",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TSQ25010",
    "descEn": "Quakerproof item",
    "descAr": "عنصر مقاوم للاهتزاز",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250137",
    "descEn": "Cavity Assembly ( Gray Color )",
    "descAr": "تجميع التجويف الداخلي (اللون الرمادي)",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250101",
    "descEn": "FOOT",
    "descAr": "قاعدة",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TM360G100",
    "descEn": "Control Panel Assembly ( Black Color )",
    "descAr": "تجميع لوحة التحكم (اللون الأسود)",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK"
    ]
  },
  {
    "partCode": "TM360G120",
    "descEn": "Door Panel ( Black Color )",
    "descAr": "لوحة الباب (اللون الأسود)",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK"
    ]
  },
  {
    "partCode": "TM360G130",
    "descEn": "Handle Pad",
    "descAr": "وسادة المقبض",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK"
    ]
  },
  {
    "partCode": "TM360G140",
    "descEn": "Handle Cover",
    "descAr": "غطاء المقبض",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK"
    ]
  },
  {
    "partCode": "TS250106",
    "descEn": "Magnetron",
    "descAr": "الماجنترون",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250104",
    "descEn": "H.V.Transformer",
    "descAr": "محول الجهد العالي",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250105",
    "descEn": "H.V.Capacitor",
    "descAr": "مكثف الجهد العالي",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TM360135",
    "descEn": "H.V.Fuse",
    "descAr": "فيوز الجهد العالي",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250110",
    "descEn": "OVER HEATER*T",
    "descAr": "سخان علوي T",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250111",
    "descEn": "METAL HEATER *UPPER",
    "descAr": "سخان معدني علوي",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250112",
    "descEn": "SUPPORTER HEATER*T",
    "descAr": "حامل السخان T",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TSLB2500",
    "descEn": "Latch Board",
    "descAr": "لوحة المزلاج",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TSL25001",
    "descEn": "Lever Switch",
    "descAr": "مفتاح رافعة",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TM360136",
    "descEn": "Microswitch Interlock",
    "descAr": "ميكروسويتش التعشيق",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TM360137",
    "descEn": "Microswitch Monitor",
    "descAr": "ميكروسويتش المراقبة",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250118",
    "descEn": "COVER CAVITY LAMP",
    "descAr": "غطاء لمبة التجويف الداخلي",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250237",
    "descEn": "OUTER CASE",
    "descAr": "الهيكل الخارجي",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TS250127",
    "descEn": "Screw RoHS MJ01-00129 M4*14-F 1022",
    "descAr": "مسمار RoHS MJ01-00129 M4×14-F 1022",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TM360G150",
    "descEn": "TMD36L-Tornado-Microve- Door-PRINT-4mm-F",
    "descAr": "باب TMD36L - تورنيدو - ميكروويف، طباعة 4 مم - F",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK"
    ]
  },
  {
    "partCode": "PKMWTLBPE0150",
    "descEn": "Rating Label TMD-36GE-BK",
    "descAr": "ملصق البيانات TMD-36GE-BK",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK"
    ]
  },
  {
    "partCode": "TM360G200",
    "descEn": "Owner Manual TMD-36GE-BK",
    "descAr": "دليل المستخدم TMD-36GE-BK",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK"
    ]
  },
  {
    "partCode": "TS250122",
    "descEn": "Main Wire Harness",
    "descAr": "ضفيرة الأسلاك الرئيسية",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK",
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "PKMWTCBFF0040",
    "descEn": "Carton Box TMD-36GE-BK",
    "descAr": "كرتونة TMD-36GE-BK",
    "uom": "PC",
    "models": [
      "TMD-36GE-BK"
    ]
  },
  {
    "partCode": "TM360132",
    "descEn": "Control Panel Assembly",
    "descAr": "تجميع لوحة التحكم",
    "uom": "PC",
    "models": [
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TM360133",
    "descEn": "Door Panel (Black Color + SS Decoration)",
    "descAr": "لوحة الباب (أسود + ديكور ستانلس ستيل)",
    "uom": "PC",
    "models": [
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TMG360150",
    "descEn": "(36L)-DOOR-Microwave-Tornado-PRINT-3.2mm",
    "descAr": "باب 36 لتر - ميكروويف تورنيدو - طباعة 3.2 مم",
    "uom": "PC",
    "models": [
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TMG360180",
    "descEn": "Owner Manual TMD-36GE-SS",
    "descAr": "دليل المستخدم TMD-36GE-SS",
    "uom": "PC",
    "models": [
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "PKMWTCBFF0050",
    "descEn": "Carton Box TMD-36GE-SS",
    "descAr": "كرتونة TMD-36GE-SS",
    "uom": "PC",
    "models": [
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TBN2534SCG",
    "descEn": "Silicon BN",
    "descAr": "سيليكون BN",
    "uom": "BT",
    "models": [
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "TMG360170",
    "descEn": "Rating Label TMD-36GE-SS",
    "descAr": "ملصق البيانات TMD-36GE-SS",
    "uom": "PC",
    "models": [
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "JCG-TS0025",
    "descEn": "RCD-Earthing Warning Sticker",
    "descAr": "ملصق تحذير التأريض RCD",
    "uom": "PC",
    "models": [
      "TMD-36GE-SS"
    ]
  },
  {
    "partCode": "12270000002556M",
    "descEn": "SPCC  0.4 mm * 350  mm * Coil",
    "descAr": "صاج SGCD، سمك 0.5 مم × 773 مم × 365 مم",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "12270000004506CZ01",
    "descEn": "SGCD 0.5 mm * 773 mm * 365 mm",
    "descAr": "صاج SPCD، سمك 0.5 مم × 543 مم، ملف",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "12270000005490M",
    "descEn": "SPCD 0.5 mm * 543 mm * Coil",
    "descAr": "صاج SPCC، سمك 0.6 مم × 532 مم، ملف",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "12270000005997M",
    "descEn": "SPCC  0.6 mm * 532  mm * Coil",
    "descAr": "صاج SGCC-Z22، سمك 0.5 مم، ملف بعرض 156 مم",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTLBPE0010",
    "descEn": "Rating Label TMDG-25EL-BK/BKS/S",
    "descAr": "قاعدة السخان الستانلس",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00096235",
    "descEn": "Stainless Heater Base",
    "descAr": "موجّه الموجات",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00236073",
    "descEn": "Wave Guide",
    "descAr": "واقي الباب",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25065",
    "descEn": "Door Shield",
    "descAr": "صاج SPCD 502 × 380 × 0.6 مم",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25066M",
    "descEn": "SPCD 502 * 380 * 0.6",
    "descAr": "صاج PCMBK، 1077.5 × 382.5 × 0.45 مم",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25078M",
    "descEn": "PCMBK -1077.5*382.5 * 0.45 mm",
    "descAr": "صاج SUS430، سمك 0.5 × 300.7 مم، ملف",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDS-25EL-BKS",
      "TMMS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMW25091M",
    "descEn": "SUS430 - 0.5 * 300.7 * Coil (mm )",
    "descAr": "صاج SUS430، سمك 0.5 × 297.3 مم، ملف",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "TMW25093M",
    "descEn": "SUS430 - 0.5 * 297.3 * Coil (mm )",
    "descAr": "صاج SGCD1، ملف 1130 × 0.6 مم",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "TMWSG5105",
    "descEn": "SGCD 0.5 mm * 1163mm * Coil",
    "descAr": "ملصق تحذير",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "EI000005",
    "descEn": "Used  Black Iron  (Scrape)",
    "descAr": "خردة ستانلس",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "EI000015",
    "descEn": "إستانلس خردة",
    "descAr": "بودرة سوداء للميكروويف",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "MWBLACKPOWDER002",
    "descEn": "MW Black powder",
    "descAr": "مادة خافضة للتوتر السطحي بلس 09",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "MWGREYPOWEDR001",
    "descEn": "Microwave grey powder paitn",
    "descAr": "غطاء السخان الستانلس",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00096236",
    "descEn": "Stainless Heater cover",
    "descAr": "مفصلة علوية لواقي الباب",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00236074",
    "descEn": "Wave Guide Bracket",
    "descAr": "تجميع موجّه الموجات",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25067",
    "descEn": "Door Shield upper Hinge",
    "descAr": "مزيل الشحوم CF",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "WAVEGUIDE2536",
    "descEn": "Wave Guide Assembly",
    "descAr": "ملصق لون الكرتونة 25 لتر BKS، جريل تورنيدو",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTLBPR0020",
    "descEn": "Carton Color Label 25L BKS Grill Tornado",
    "descAr": "مفصلة سفلية لواقي الباب",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS"
    ]
  },
  {
    "partCode": "PRD-ELA-00198062",
    "descEn": "Turntable Motor Bracket",
    "descAr": "اللوحة الخلفية للميكروويف E28L جريل، صاج SPCD سمك 0.5 مم، 25",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25069",
    "descEn": "Door Shield lower Hinge",
    "descAr": "مادة خافضة للتوتر السطحي بلس 09",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "12270000005490L",
    "descEn": "MWO Back plate E28L Grill SPCD T=0.5 25",
    "descAr": "كرتونة TMDG-25EL-BKS",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTCBFF0180",
    "descEn": "Carton Box TMDG-25EL-BKS",
    "descAr": "Nano 42",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "12270000005997L",
    "descEn": "MWO Front plate E25L SPCCT=0.6 auto door",
    "descAr": "TMDG-25EL، طباعة 3.2 مم - F شفاف",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "MWNANO42",
    "descEn": "Nano 42",
    "descAr": "اللوحة العلوية للميكروويف E25L جريل، صاج SPCC سمك 0.4 مم",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMDG-25EL-F",
    "descEn": "TMDG-25EL-3.2 mm CLEAR-F",
    "descAr": "جوان باب 25 لتر",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "12270000002556G",
    "descEn": "MWO Top plate E25L Grill SPCC T=0.4mm",
    "descAr": "مادة معادلة/محايدة 700",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "MWNUTRL700",
    "descEn": "Nutrlizer 700",
    "descAr": "مروحة",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "12270000004506L",
    "descEn": "MWO U plate E25L Grill SGCD T=0.5mm A13",
    "descAr": "دليل المروحة",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMWG25080",
    "descEn": "Cavity Assembly 25 Grill Painted(Grey)",
    "descAr": "الهيكل الخارجي 25 لتر (اللون الأسود)",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00232941",
    "descEn": "Door Shield Ass'y after Welding",
    "descAr": "المفصلة السفلية للوحة الباب، مجلفنة",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00200625",
    "descEn": "Outer Case 25 L ( Black Color )",
    "descAr": "المفصلة العلوية للوحة الباب 25 لتر، مجلفنة",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDS-25EL-BKS",
      "TMMS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMW25074",
    "descEn": "Door Panel Lower Hinge Galvanized",
    "descAr": "تجميع التجويف الداخلي 25 جريل، ملحوم",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25071",
    "descEn": "Door Panel  Upper Hinge 25 L  Galvanized",
    "descAr": "تجميع واقي الباب بعد الدهان",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00200503",
    "descEn": "Cavity Assembly 25 Grill Welded",
    "descAr": "رجل ميكروويف",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "TMW25063",
    "descEn": "Door Shield Ass'y after Paiting",
    "descAr": "وصلة ميكروويف 25",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMDP0020",
    "descEn": "MW Leg",
    "descAr": "تجميع الحلقة الدوارة 25",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "MWC25",
    "descEn": "MW Coupler 25",
    "descAr": "شريط لاصق مزدوج الوجه للميكروويف بعرض 20 مم",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "RRASS25",
    "descEn": "Rotating ring assembly 25",
    "descAr": "واقي من الخدوش",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMWDF20",
    "descEn": "MW Douple Face 20 mm",
    "descAr": "شريط بوليستر رقم 53 (عرض 50 مم)",
    "uom": "M",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTBGHD0010",
    "descEn": "Scratch Protector",
    "descAr": "ملصق QR موحد 30×30",
    "uom": "KG",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25050",
    "descEn": "Air Guide Sponge 200*10*5",
    "descAr": "كارت ضمان سنة واحدة",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTOMPR0191",
    "descEn": "OWNER MANUAL TMDG(S)-25EL/28EL-BKS/S QR",
    "descAr": "ملصق لوحة التحكم",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "TM25GBK00004",
    "descEn": "Control Panel Label",
    "descAr": "مسمار رأس بان مسنن مع طوق CR، ST3×8",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS"
    ]
  },
  {
    "partCode": "TMW253606S",
    "descEn": "Cross recessed pan head ST 3.9*24",
    "descAr": "مسمار تشكيل قلاوظ CR 3(6)",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253605S",
    "descEn": "C R Serratted pan head with Collar ST3*8",
    "descAr": "مسمار رأس بان مسنن مع طوق CR، ST3.9×12",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMWTH01",
    "descEn": "CR thread rolling 3(6)",
    "descAr": "مسمار رأس بان مسنن CR، Tr (3.8)×8",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253601S",
    "descEn": "C R Serrated pan head Wth CollarST3.9*12",
    "descAr": "مسمار رأس بان متقاطع ST 4.2×8",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253603S",
    "descEn": "C R Serratted pan head Tr (3.8)*8",
    "descAr": "رف 25 لتر",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253602S",
    "descEn": "Cross recessed pan head ST 4.2*8",
    "descAr": "الطبق الدوار",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25041",
    "descEn": "Rack 25L",
    "descAr": "موتور المروحة",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "TMW36040",
    "descEn": "Turntable",
    "descAr": "موتور متزامن",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253609",
    "descEn": "Fan motor",
    "descAr": "لمبة",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253608",
    "descEn": "Synchronous motor",
    "descAr": "مفتاح الباب",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253607",
    "descEn": "Lamp",
    "descAr": "مفتاح المراقبة",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253606",
    "descEn": "Door Switch",
    "descAr": "محول الجهد العالي",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253605",
    "descEn": "Monitor Switch",
    "descAr": "أنبوب كوارتز",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25011",
    "descEn": "H.V.Transformer",
    "descAr": "مكثف جهد عالٍ 2100V، 1.05μF ±3%، CH85 S3 B Term",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25010",
    "descEn": "Quartz Tube",
    "descAr": "ماجنترون LG (2M226)",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "TMW25009",
    "descEn": "Cap HV 2100V 1.05μF ±3% CH85 S3 B Term",
    "descAr": "لوح الميكا",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25008",
    "descEn": "LG Magnetron ( 2M226 )",
    "descAr": "فيلم الباب",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253604",
    "descEn": "Mica Plate",
    "descAr": "دايود الجهد العالي",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25006",
    "descEn": "Door Film",
    "descAr": "ثرموستات 160/95°م",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253602",
    "descEn": "H.V. Diode",
    "descAr": "ثرموستات 70/59°م",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25003",
    "descEn": "Thermostat 160/95",
    "descAr": "فيوز جهد عالي 800mA - 5KV",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253601",
    "descEn": "Thermostat 70/59",
    "descAr": "حامل المفتاح 25 لتر",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "TMW25001",
    "descEn": "H.V.Fuse 800 mA - 5KV",
    "descAr": "مزلاج",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMDP0010",
    "descEn": "Switch Support 25 L",
    "descAr": "مفتاح رافعة",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMDP0011",
    "descEn": "Latch",
    "descAr": "لوحة الباب 25 أسود",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMDP0024",
    "descEn": "Lever Switch",
    "descAr": "ذراع فتح الباب",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMDP0016",
    "descEn": "Door Panel 25 BK",
    "descAr": "زر فتح الباب أسود",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDS-25EL-BKS",
      "TMMS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMDP0025",
    "descEn": "Door Open Lever",
    "descAr": "طقم أزرار ديجيتال 25 أسود",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMDP0018",
    "descEn": "Door Open Botton BK",
    "descAr": "حلقة/إدخال مقبض ديجيتال أسود",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDS-25EL-BKS",
      "TMMS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMDP0014",
    "descEn": "Buttons Set Dig 25 BK",
    "descAr": "مقبض ميكروويف رمادي",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMDP0022",
    "descEn": "Knob insert Dig BK",
    "descAr": "ديكور لوحة التحكم رمادي",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMDPS0026SG",
    "descEn": "MW Knob Grey",
    "descAr": "لوحة تحكم ديجيتال 25 أسود",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDS-25EL-BKS",
      "TMMS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMW28040SG",
    "descEn": "Control Panel Decoration Grey",
    "descAr": "ضفيرة أسلاك التوصيل",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMDP0012",
    "descEn": "Control Panel Dig 25 BK",
    "descAr": "مسمار رأس بان متقاطع ST 4.2×6",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMWG28035",
    "descEn": "Lead Wire Harness",
    "descAr": "وردة سوستة",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "TMW253607S",
    "descEn": "Cross recessed pan head ST 4.2*6",
    "descAr": "سوستة زر 25",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253608S",
    "descEn": "Spring Washer",
    "descAr": "سوستة المزلاج",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMS25001",
    "descEn": "Button Spring 25",
    "descAr": "لوحة PCB باور لجريل ميكروويف 25L/36L",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253612P",
    "descEn": "Latch Spring",
    "descAr": "لوحة PCB تحكم لجريل ميكروويف 25 لتر",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMWG253611",
    "descEn": "Power PCB for Grill MW 25L36L",
    "descAr": "لوحة PCB فلتر تشويش EMI لميكروويف Solo Grill",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "TMWG25012",
    "descEn": "Control PCB  for Grill MW 25L",
    "descAr": "ضفيرة PCB",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "TMWG253613-N",
    "descEn": "Noise Filter EMI PCB for soloGrill MW",
    "descAr": "ضفيرة الكهرباء الرئيسية لجريل ميكروويف 25 لتر",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "TMW253614",
    "descEn": "PCB Harness",
    "descAr": "ضفيرة الماجنترون",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "TMWG26033",
    "descEn": "MW Grill 25 L Main Harness",
    "descAr": "شريط بوليستر، عرض 20 مم، للوحة وسلك الكهرباء",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "TMW253615",
    "descEn": "Magnetron Harness",
    "descAr": "سلك كهرباء ميكروويف جديد",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "WL26904",
    "descEn": "POLYSTER TAPE,W=20mm,plate&power cord",
    "descAr": "فوم علوي للميكروويف 25 لتر",
    "uom": "M",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25090",
    "descEn": "Stainless steel heater Holder Assembly",
    "descAr": "ملصق زجاج شفاف",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "TMWSC25",
    "descEn": "MW Glass Silicon",
    "descAr": "سيليكون زجاج الميكروويف",
    "uom": "ML",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTLBPR0610",
    "descEn": "Glass Sticker transparent",
    "descAr": "ملصق زجاج شفاف",
    "uom": "PC",
    "models": [
      "TMDG-25EL-BKS",
      "TMDG-25EL-S",
      "TMDS-25EL-BKS",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25078MS",
    "descEn": "PCMS 1077.5*382.5 * 0.45mm",
    "descAr": "صاج PCMS، مقاس 1077.5 × 382.5 × 0.45 مم",
    "uom": "PC",
    "models": [
      "TMDG-25EL-S",
      "TMDS-25EL-S",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW25078MPS",
    "descEn": "Outer Case 25 L (Silver Color)",
    "descAr": "الهيكل الخارجي 25 لتر (اللون الفضي)",
    "uom": "PC",
    "models": [
      "TMDG-25EL-S",
      "TMDS-25EL-S",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TM25G00004S",
    "descEn": "Control Panel Label",
    "descAr": "ملصق لوحة التحكم",
    "uom": "PC",
    "models": [
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00215509PS",
    "descEn": "Door Panel Painted silver",
    "descAr": "لوحة الباب مطلية بالفضي",
    "uom": "PC",
    "models": [
      "TMDG-25EL-S",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00231458PS",
    "descEn": "Door Open Button Painted silver",
    "descAr": "زر فتح الباب مطلي بالفضي",
    "uom": "PC",
    "models": [
      "TMDG-25EL-S",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00211051PS",
    "descEn": "Buttons Set Painted silver",
    "descAr": "طقم أزرار مطلية بالفضي",
    "uom": "PC",
    "models": [
      "TMDG-25EL-S",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00296695PS",
    "descEn": "Knob insert Painted silver",
    "descAr": "حلقة مقبض مطلية بالفضي",
    "uom": "PC",
    "models": [
      "TMDG-25EL-S",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "TMDP0021",
    "descEn": "MW Knob BK",
    "descAr": "مقبض ميكروويف أسود",
    "uom": "PC",
    "models": [
      "TMDG-25EL-S",
      "TMDS-25EL-S",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMW28040B",
    "descEn": "Control Panel Decoration Black",
    "descAr": "ديكور لوحة التحكم أسود",
    "uom": "PC",
    "models": [
      "TMDG-25EL-S",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "PRD-ELA-00209813PS",
    "descEn": "Control Panel Painted silver",
    "descAr": "لوحة التحكم مطلية بالفضي",
    "uom": "PC",
    "models": [
      "TMDG-25EL-S",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTLBPR0030",
    "descEn": "Carton Color Label 25L Silver Grill Torn",
    "descAr": "ملصق لون الكرتونة 25 لتر، فضي، جريل تورنيدو",
    "uom": "PC",
    "models": [
      "TMDG-25EL-S"
    ]
  },
  {
    "partCode": "12270000002580M",
    "descEn": "SPCC  0.5 mm * 350  mm * Coil",
    "descAr": "صاج SPCC، سمك 0.5 مم × 350 مم، ملف",
    "uom": "KG",
    "models": [
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTLBPE0020",
    "descEn": "Rating Label TMDS-25EL-BK/BKS/S",
    "descAr": "ملصق البيانات TMDS-25EL-BK/BKS/S",
    "uom": "PC",
    "models": [
      "TMDS-25EL-BKS",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTLBPR0050",
    "descEn": "Carton Color Label 25L BKS Solo Tornado",
    "descAr": "ملصق لون الكرتونة 25 لتر BKS، سولو تورنيدو",
    "uom": "PC",
    "models": [
      "TMDS-25EL-BKS"
    ]
  },
  {
    "partCode": "P12270000002580L",
    "descEn": "MWO Top plate E25L SOLO SPCC T=0.5mm",
    "descAr": "كرتونة TMDS-25EL-BKS",
    "uom": "PC",
    "models": [
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTCBFF0170",
    "descEn": "Carton Box TMDS-25EL-BKS",
    "descAr": "Nano 42",
    "uom": "PC",
    "models": [
      "TMDS-25EL-BKS",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "TMWS25080P",
    "descEn": "Cavity Assembly 25 Solo Painted (Grey)",
    "descAr": "الهيكل الخارجي 25 لتر (اللون الأسود)",
    "uom": "PC",
    "models": [
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMWS25080",
    "descEn": "Cavity Assembly 25 Solo Welded",
    "descAr": "رجل ميكروويف",
    "uom": "PC",
    "models": [
      "TMDS-25EL-BKS",
      "TMDS-25EL-S",
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TM25SBK00004",
    "descEn": "Control Panel Label",
    "descAr": "مسمار رأس بان متقاطع ST 3.9×24",
    "uom": "PC",
    "models": [
      "TMDS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMWS253611",
    "descEn": "Power PCB for SOLO MW 25L36L",
    "descAr": "لوحة PCB تحكم لميكروويف SOLO 25 لتر",
    "uom": "PC",
    "models": [
      "TMDS-25EL-BKS",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "TMWS25012",
    "descEn": "Control PCB  for SOLO MW 25L",
    "descAr": "لوحة PCB فلتر تشويش EMI لميكروويف Solo Grill",
    "uom": "PC",
    "models": [
      "TMDS-25EL-BKS",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "TMWS36036",
    "descEn": "MW Solo Main Harness",
    "descAr": "ضفيرة الماجنترون",
    "uom": "PC",
    "models": [
      "TMDS-25EL-BKS",
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "TM25S00004S",
    "descEn": "Control Panel Label",
    "descAr": "ملصق لوحة التحكم",
    "uom": "PC",
    "models": [
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTLBPR0060",
    "descEn": "Carton Color Label 25L Silver Solo Torna",
    "descAr": "ملصق كرتونة 25 لتر فضي Solo Tornado",
    "uom": "PC",
    "models": [
      "TMDS-25EL-S"
    ]
  },
  {
    "partCode": "TMM250CP",
    "descEn": "Control Panel ( Black Color )",
    "descAr": "لوحة التحكم (باللون الأسود)",
    "uom": "PC",
    "models": [
      "TMMS-25EL-BKS"
    ]
  },
  {
    "partCode": "B500027",
    "descEn": "حبر طباعة أبيض (SR170)",
    "descAr": "حبر طباعة أبيض (SR170)",
    "uom": "KG",
    "models": [
      "TMMS-25EL-BKS"
    ]
  },
  {
    "partCode": "RETARDER-SV9",
    "descEn": "MARABU RETARDER SV9",
    "descAr": "مادة إبطاء مارابو SV9",
    "uom": "KG",
    "models": [
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTCBFF0222",
    "descEn": "CARTON BOX TMMS-25EL NO MIRROR NEW ID",
    "descAr": "كرتونة TMMS-25EL بدون مرآة – رقم تعريف جديد",
    "uom": "PC",
    "models": [
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTLBPE0220",
    "descEn": "Rating Label MW Mech Tornado 25L",
    "descAr": "ملصق بيانات ميكروويف ميكانيكي تورنادو 25 لتر",
    "uom": "PC",
    "models": [
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTOMPR0090",
    "descEn": "Operation Manual MW Mech 25L",
    "descAr": "دليل تشغيل ميكروويف ميكانيكي 25 لتر",
    "uom": "PC",
    "models": [
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMMP0027",
    "descEn": "Knob insert Mech BK",
    "descAr": "إدخال مقبض المؤقت ميكانيكي أسود",
    "uom": "PC",
    "models": [
      "TMMS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMM250CPP",
    "descEn": "Control Panel Mech BK Printed",
    "descAr": "لوحة التحكم الميكانيكية سوداء مطبوعة",
    "uom": "PC",
    "models": [
      "TMMS-25EL-BKS"
    ]
  },
  {
    "partCode": "TMMS25033",
    "descEn": "Main Harness Mech",
    "descAr": "ضفيرة الأسلاك الرئيسية للميكروويف الميكانيكي",
    "uom": "PC",
    "models": [
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMMN2501",
    "descEn": "NOISE FILTER EMI PCB FOR Mech MW",
    "descAr": "فلتر تشويش EMI PCB للميكروويف الميكانيكي",
    "uom": "PC",
    "models": [
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMMPL025",
    "descEn": "Timer 240VAC 35 min switch Delay-Off",
    "descAr": "مؤقت 240 فولت AC، مفتاح 35 دقيقة، فصل تأخيري",
    "uom": "PC",
    "models": [
      "TMMS-25EL-BKS",
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTLBPR0190",
    "descEn": "Carton Label MW Mech Black 25L",
    "descAr": "ملصق الكرتونة ميكروويف ميكانيكي أسود 25 لتر",
    "uom": "PC",
    "models": [
      "TMMS-25EL-BKS"
    ]
  },
  {
    "partCode": "WSR273",
    "descEn": "Marabu ink حبر اسود محلى",
    "descAr": "حبر مارابو أسود لامع",
    "uom": "L",
    "models": [
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMM250CPSG",
    "descEn": "Control Panel Mech Grey",
    "descAr": "لوحة التحكم الميكانيكية رمادي",
    "uom": "PC",
    "models": [
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMDPS0017SG",
    "descEn": "MW Door panel 25 Grey",
    "descAr": "لوحة باب الميكروويف 25 رمادي",
    "uom": "PC",
    "models": [
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMDPS0019SG",
    "descEn": "Door Open Botton Grey",
    "descAr": "زر فتح الباب رمادي",
    "uom": "PC",
    "models": [
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMMPS0028SG",
    "descEn": "Knob insert Mech Grey",
    "descAr": "إدخال مقبض المؤقت ميكانيكي رمادي",
    "uom": "PC",
    "models": [
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "TMM250CPSP",
    "descEn": "Control Panel silver painted after print",
    "descAr": "لوحة التحكم مطلية بالفضي بعد الطباعة",
    "uom": "PC",
    "models": [
      "TMMS-25EL-S"
    ]
  },
  {
    "partCode": "PKMWTLBPR0200",
    "descEn": "Carton Label MW Mech Silver 25L",
    "descAr": "ملصق كرتونة ميكروويف ميكانيكي فضي 25 لتر",
    "uom": "PC",
    "models": [
      "TMMS-25EL-S"
    ]
  }
];

export const INITIAL_BOM_SNAPSHOTS: BOMSnapshotRecord[] = [
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "12270000006329M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "12270000008094M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25047",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25036",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25022",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "SHR25006",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25048",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS250611",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25037",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25049",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25007",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "SHR25013",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25310",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25016",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "SHR25017",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25029",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "SHR25020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "SHR25021",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25017",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25034",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25026",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25302",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25014",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25028",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25032",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25306",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25042",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "SHR25040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25046",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "SHR25043",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25013",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25023",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25006",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "12270000008094",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "12270000006329",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "T08740001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "SHARP-250MGR-F",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "PKMWSCBFF0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "PKMWSLBPE0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "PKMWSOMPR0021",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "WCARD2N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "PWL6-2-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "SHR25070",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TS25005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TSI34015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "TSI34020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "PKMWSLBPR0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-BK2",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "12270000006329M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "12270000008094M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25047",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25036",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25022",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "SHR25052",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25048",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS250611",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25037",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25049",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25007",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "SHR25053",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25310",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25016",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "SHR25017",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25029",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "SHR25020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "SHR25021",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25017",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25034",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25026",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25302",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25014",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25028",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25032",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25700",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25042",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "SHR25040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25046",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "SHR25043",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25013",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25023",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "12270000008094",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "12270000006329",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "T08740001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "SHARP-250MGR-F",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "PKMWSCBFF0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "PKMWSLBPE0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "PKMWSOMPR0021",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "WCARD2N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "SHR25070",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TSI34020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "PKMWSLBPR0030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TSI34015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "TS25006",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "PWL6-2-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-250MGR-SL2",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TR28S008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25022",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHR280006",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25048",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS250611",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25037",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25049",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25007",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHR280012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHR280013",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHR280014",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHR280015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25004",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25029",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHR280019",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25034",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25026",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHR280024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHR25029",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS250123",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHR280028",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25204",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25042",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHR25040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TSI34020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TSI34015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25046",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25710",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25013",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "T08740001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHARP-280CR-F",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "PKMWSCBFF0031",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "PKMWSLBPE0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "PKMWSOMPR0040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "WCARD2N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "PWL6-2-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TSI340179",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS250607",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "SHR280070",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS250108",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS250606",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "PKMWSLBPR0040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "TS25038",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-280CR(S)",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "M345823000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250100",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSR250101",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250103",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250601",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250107",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250606",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250603",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250604",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250113",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34004",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250607",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250117",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS340118",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250119",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS340121",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25026",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25029",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250123",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25032",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250611",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250612",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250129",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS36051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250132",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34013",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34014",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25042",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250126",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25043",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25046",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25039",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS250128",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25037",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI340179",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI340180",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TS25013",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "12270000005139",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "M12170000009546",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "SHARP-340GR-F",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "PKMWSCBFF0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "PKMWSLBPE0030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TMWUF36",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TMWLF36",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "PKMWSOMPR0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "WCARD2N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "PWL6-2-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "TSI34005B",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "PKMWSLBPR0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "T08740001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "R-340GRI-BS2",
    "partCode": "SHR25040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "12270000006329M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "12270000008094M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25047",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TM25025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25022",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TM25026",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25048",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25033",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25037",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25049",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25007",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TM25027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25018",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25016",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25004",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25029",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25800",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25034",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25026",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25031",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25014",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25028",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25032",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25023",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25050",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TBN25044",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25045",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25042",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25046",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25043",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25038",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25006",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25013",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "12270000008094",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "12270000006329",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TM25000025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "PKMWTLBPE0160",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "PKMWTOMPR0120",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "TS25039",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "T08740001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "PKMWTCBFF0250",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25GE-S",
    "partCode": "PKMWTLBPR0370",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25072",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25022",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TM25K025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25048",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25067",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25037",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25049",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25007",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25064",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25063",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25062",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25018",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25016",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25004",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25029",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25080",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25034",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25026",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25066",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25028",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25032",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25073",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25043",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25046",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TBN25044",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25042",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25039",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25038",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25045",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25013",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TM25S0025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "PKMWTLBPE0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "PKMWTOMPR0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25071",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25060",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25061",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TSW250",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "T08740001PVC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "TS25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "PKMWTCBFF0021",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-BK",
    "partCode": "PKMWTLBPR0300",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25072",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25022",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TM25K026",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25048",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25067",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25037",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25049",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25007",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25202",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25201",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25200",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25018",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25016",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25004",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25029",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25080",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25034",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25026",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25066",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25028",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25032",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25204",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25043",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25046",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TBN25044",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25042",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25039",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25038",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25045",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25013",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TM25S0025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "PKMWTLBPE0120",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "PKMWTOMPR0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25071",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25060",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25061",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TSW250",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "T08740001PVC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "TS25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "PKMWTCBFF0021",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-25SE-S",
    "partCode": "PKMWTLBPR0360",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25039",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25046",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25043",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25042",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25007",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS250117",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TR28S008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TR28S009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TR28S016",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25029",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25080",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25004",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TR28S023",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25016",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25018",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TR28S025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25022",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TR28S027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TR28S030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25033",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25034",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25037",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25049",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "T08740001PVC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "PKMWTLBPE0170",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "PKMWTCBFF0041",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TOR-28S-BK-F",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "PKMWTOMPR0170",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25045",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25048",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS25003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS250123",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS250124",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TBN25044",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "TS250120",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-28S-BK",
    "partCode": "PKMWTLBPR0310",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "M345823000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TM360130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TSQ25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250137",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250101",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25067",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25037",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250113",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TM360G100",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TM360G120",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TM360G130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TM360G140",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250106",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250104",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250105",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25004",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25029",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TM360135",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250107",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250111",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250112",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TSLB2500",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TSL25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TM360136",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TM360137",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250117",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250123",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250119",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250124",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250118",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25061",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250237",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25045",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25039",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25042",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250127",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TBN25044",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250129",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250128",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250126",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25046",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25013",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "12270000005139",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "M12170000009546",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TM360G150",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TMWUF36",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TMWLF36",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "PKMWTLBPE0150",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TM360G200",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250122",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS250100",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "T08740001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS25051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "TS36051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-BK",
    "partCode": "PKMWTCBFF0040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "M345823000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TM360130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250137",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250101",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25033",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25037",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250113",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TM360132",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TM360133",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250106",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250104",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250105",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25004",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25029",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TM360135",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250107",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250111",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250112",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TSLB2500",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TSL25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TM360136",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TM360137",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250122",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250117",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250123",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250129",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250124",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250118",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250237",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25045",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250119",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25039",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25042",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250127",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TBN25044",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250128",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250126",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25046",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TSQ25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "12270000005139",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "M12170000009546",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TMG360150",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TMWUF36",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TMWLF36",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250120",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TMG360180",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS250100",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "T08740001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS25051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TS36051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "PKMWTCBFF0050",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TBN2534SCG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "TMG360170",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMD-36GE-SS",
    "partCode": "JCG-TS0025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000002556M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000004506CZ01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000005490M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000005997M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000006329M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000008094M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PKMWTLBPE0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PRD-ELA-00096235",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PRD-ELA-00236073",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25065",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25066M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25078M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25091M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25093M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWSG5105",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "EI000005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "EI000015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "MWBLACKPOWDER002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "MWGREYPOWEDR001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PRD-ELA-00096236",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PRD-ELA-00236074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25067",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "WAVEGUIDE2536",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PKMWTLBPR0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PRD-ELA-00198062",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25069",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000005490L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PKMWTCBFF0180",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000005997L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "MWNANO42",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDG-25EL-F",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000002556G",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "MWNUTRL700",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000004506L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWG25080",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PRD-ELA-00232941",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PRD-ELA-00200625",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25071",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PRD-ELA-00200503",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25063",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDP0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "MWC25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "RRASS25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWDF20",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PKMWTBGHD0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25050",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PKMWTOMPR0191",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TM25GBK00004",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253606S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253605S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWTH01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253601S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253603S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253602S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25041",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW36040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253609",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253608",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253607",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253606",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253605",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253604",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25006",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253602",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253601",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDP0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDP0011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDP0024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDP0016",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDP0025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDP0018",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDP0014",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDP0022",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDPS0026SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW28040SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMDP0012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWG28035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253607S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253608S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMS25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253612P",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWG253611",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWG25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWG253613-N",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253614",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWG26033",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW253615",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "WL26904",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "T08740001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000008094",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000006329",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMW25090",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "TMWSC25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-BKS",
    "partCode": "PKMWTLBPR0610",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000002556M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000004506CZ01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000005490M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000005997M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000006329M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000008094M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PKMWTLBPE0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00096235",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00236073",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25065",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25066M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25091M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25093M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWSG5105",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "EI000005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "EI000015",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "MWBLACKPOWDER002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "MWGREYPOWEDR001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00096236",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00236074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25067",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25078MS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "WAVEGUIDE2536",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PKMWTCBFF0180",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00198062",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25069",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000005490L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMDG-25EL-F",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000005997L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "MWNANO42",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000002556G",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "MWNUTRL700",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000004506L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWG25080",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00232941",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25078MPS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25071",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25063",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00200503",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMDP0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "MWC25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWDF20",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25050",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PKMWTOMPR0191",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TM25G00004S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253606S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253605S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWTH01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253601S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253603S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253602S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25041",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW36040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253609",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253608",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253607",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253606",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253605",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253604",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25006",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253602",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253601",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMDP0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMDP0011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMDP0024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00215509PS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMDP0025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00231458PS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00211051PS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00296695PS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMDP0021",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW28040B",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PRD-ELA-00209813PS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWG28035",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253607S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253608S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMS25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253612P",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "RRASS25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWG253611",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWG25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWG253613-N",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253614",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWG26033",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW253615",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "WL26904",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "T08740001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000008094",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000006329",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PKMWTLBPR0030",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PKMWTBGHD0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMW25090",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "TMWSC25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDG-25EL-S",
    "partCode": "PKMWTLBPR0610",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000002580M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000004506CZ01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000004506L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000005490M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000005997M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PKMWTLBPE0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PRD-ELA-00236073",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25065",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25066M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25078M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWSG5105",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000005997L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "EI000005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "MWBLACKPOWDER002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "MWGREYPOWEDR001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PRD-ELA-00236074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25067",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000005490L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PKMWTLBPR0050",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25069",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "P12270000002580L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PKMWTCBFF0170",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "MWNANO42",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PRD-ELA-00198062",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDG-25EL-F",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "MWNUTRL700",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "WAVEGUIDE2536",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWS25080P",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PRD-ELA-00200625",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PRD-ELA-00232941",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25071",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25063",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWS25080",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDP0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "MWC25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "RRASS25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWDF20",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PKMWTBGHD0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25050",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PKMWTOMPR0191",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TM25SBK00004",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253606S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253605S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWTH01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253601S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253603S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253602S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW36040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253609",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253608",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253607",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253606",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253605",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253604",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25006",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253602",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDP0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDP0011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDP0024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDP0016",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDP0025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDP0018",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDP0014",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDP0022",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDPS0026SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW28040SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMDP0012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253607S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253608S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMS25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253612P",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWS253611",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWG253613-N",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253614",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWS36036",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMW253615",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "WL26904",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "T08740001PVC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "TMWSC25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-BKS",
    "partCode": "PKMWTLBPR0610",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000002580M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000004506CZ01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000004506L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000005490M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000005997M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PKMWTLBPE0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PRD-ELA-00236073",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25065",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25066M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWSG5105",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000005997L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "EI000005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "MWBLACKPOWDER002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "MWGREYPOWEDR001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PRD-ELA-00236074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25067",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25078MS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000005490L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PKMWTCBFF0170",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25069",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "P12270000002580L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMDG-25EL-F",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "MWNANO42",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PRD-ELA-00198062",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "MWNUTRL700",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "WAVEGUIDE2536",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWS25080P",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25078MPS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PRD-ELA-00232941",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25071",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25063",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMDP0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWS25080",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "MWC25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWDF20",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25050",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PKMWTOMPR0191",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TM25S00004S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253606S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253605S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWTH01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253601S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253603S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253602S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW36040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253609",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253608",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253607",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253606",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253605",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253604",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25006",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253602",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMDP0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMDP0011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMDP0024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PRD-ELA-00215509PS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMDP0025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PRD-ELA-00231458PS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PRD-ELA-00211051PS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PRD-ELA-00296695PS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMDP0021",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW28040B",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PRD-ELA-00209813PS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253607S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253608S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMS25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253612P",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "RRASS25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWS253611",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWS25012",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWG253613-N",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253614",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWS36036",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMW253615",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "WL26904",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "T08740001PVC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PKMWTLBPR0060",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PKMWTBGHD0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "TMWSC25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMDS-25EL-S",
    "partCode": "PKMWTLBPR0610",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000002580M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000004506CZ01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000004506L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000005490M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000005997M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PRD-ELA-00236073",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMDG-25EL-F",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMM250CP",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25065",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25066M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25078M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMWSG5105",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000005997L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "B500027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "EI000005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "MWBLACKPOWDER002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "MWGREYPOWEDR001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PRD-ELA-00236074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25067",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000005490L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "RETARDER-SV9",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25069",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "P12270000002580L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "MWNANO42",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PKMWTCBFF0222",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PRD-ELA-00198062",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "MWNUTRL700",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "WAVEGUIDE2536",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PKMWTLBPE0220",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMWS25080P",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PRD-ELA-00200625",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PRD-ELA-00232941",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25071",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25063",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMDP0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMWS25080",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "MWC25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PKMWTOMPR0090",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25050",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PKMWTBGHD0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMWDF20",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253602",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25006",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253604",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW25011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253605",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253606",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253607",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253608",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253609",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW36040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253602S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253603S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253601S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMWTH01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253605S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253606S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253607S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMDP0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMDP0011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMDP0024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMDP0016",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMDP0025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMDP0018",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMMP0027",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMDPS0026SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMM250CPP",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMMS25033",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMMN2501",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "RRASS25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253612P",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMS25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMW253608S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "WL26904",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "T08740001PVC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMMPL025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "PKMWTLBPR0190",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-BKS",
    "partCode": "TMWSC25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000005167",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000000175M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000002580M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000004506CZ01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000004506L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000005490M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000005997M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000006211M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "M256894000001H",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "PRD-ELA-00236073",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMDG-25EL-F",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25065",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25066M",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMWSG0130",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMWSG5105",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000005997L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "EI000005",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "EI000098",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "M12170000009523",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "MWBLACKPOWDER002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "MWGREYPOWEDR001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "MWSURF09",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "PRD-ELA-00236074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25067",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25078MS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "WSR273",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000005490L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "M12170000000206",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "MWDEGCF01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "RETARDER-SV9",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25069",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "M12170000004303",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "P12270000002580L",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMM250CPSG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "MWNANO42",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "PRD-ELA-00198062",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "16270000S06003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "MWNUTRL700",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "WAVEGUIDE2536",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "JCG45-10-002",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "PRD-ELA-00232941",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMWS25080P",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25078MPS",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25074",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25071",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25063",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMWS25080",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMDP0020",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "MWC25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "CELLOTAPE5X900",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "BARCODEABC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25050",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "AZNORIB140101K/",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW2536SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "16270000S06051",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "H39235106110",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "PKG-GSI0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "QR-CODE-30MM",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "AZTAPEP50A-09K",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMWDF20",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25003",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253602",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25006",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253604",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25008",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25009",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW25011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253605",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253606",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253607",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253608",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253609",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW36040",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253602S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253603S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253601S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMWTH01",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253605S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253606S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253607S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMDP0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMDP0011",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMDP0024",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMDPS0017SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMDP0025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMDPS0019SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMMPS0028SG",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMDP0021",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMM250CPSP",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMMS25033",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMMN2501",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "RRASS25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253612P",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMS25001",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMW253608S",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "WL26904",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "T08740001PVC",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMWUF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMWLF25",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000005167T",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000006211",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000000175",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "12270000000677",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "PWL6-1-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMMPL025",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "PKMWTBGHD0010",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "PKMWTCBFF0222",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "PKMWTLBPE0220",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "PKMWTOMPR0090",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "PKMWTLBPR0200",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "RFILM1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "WCARD1N-1",
    "snapshotDate": "2026-09-24"
  },
  {
    "modelCode": "TMMS-25EL-S",
    "partCode": "TMWSC25",
    "snapshotDate": "2026-09-24"
  }
];
