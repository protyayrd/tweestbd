export const color = [
  "white",
  "Black",
  "Red",
  "marun",
  "Being",
  "Pink",
  "Green",
  "Yellow",
];

export const filters = [
  {
    id: "color",
    name: "Color",
    options: [
      { value: "white", label: "White" },
      { value: "beige", label: "Beige" },
      { value: "blue", label: "Blue" },
      { value: "brown", label: "Brown" },
      { value: "green", label: "Green" },
      { value: "purple", label: "Purple" },
      {value:"yellow",label:"Yellow"}
    ],
  },

  {
    id: "size",
    name: "Size",
    options: [
      { value: "S", label: "S" },
      { value: "M", label: "M" },
      { value: "L", label: "L" },
    ],
  },
  
];

export const singleFilter=[
  {
    id: "price",
    name: "Price",
    options: [
      { value: "159-399", label: "Tk. 159 To Tk. 399" },
      { value: "399-999", label: "Tk. 399 To Tk. 999" },
      { value: "999-1999", label: "Tk. 999 To Tk. 1999" },
      { value: "1999-2999", label: "Tk. 1999 To Tk. 2999" },
      { value: "3999-4999", label: "Tk. 3999 To Tk. 4999" },
    ],
  },
  {
    id: "disccout",
    name: "Disccount Range",
    options: [
      {
        value: "10",
        label: "10% And Above",
      },
      { value: "20", label: "20% And Above" },
      { value: "30", label: "30% And Above" },
      { value: "40", label: "40% And Above" },
      { value: "50", label: "50% And Above" },
      { value: "60", label: "60% And Above" },
      { value: "70", label: "70% And Above" },
      { value: "80", label: "80% And Above" },
    ],
  },
  {
    id: "stock",
    name: "Availability",
    options: [
      { value: "in_stock", label: "In Stock" },
      { value: "out_of_stock", label: "Out Of Stock" },
      
    ],
  },
]

export const sortOptions = [
  
  { name: "Price: Low to High", query: "price_low", current: false },
  { name: "Price: High to Low", query: "price_high", current: false },
];
