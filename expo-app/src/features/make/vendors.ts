/* Grocery hand-off destinations for the shopping cart. */
export type VendorId = "instacart" | "misfits" | "hungryroot" | "gopuff" | "shipt" | "doordash";

export type Vendor = { id: VendorId; label: string; url: string; host: string };

export const VENDORS: Vendor[] = [
  { id: "instacart", label: "Instacart", url: "https://www.instacart.com", host: "instacart.com" },
  { id: "misfits", label: "Misfits", url: "https://www.misfitsmarket.com", host: "misfitsmarket.com" },
  { id: "hungryroot", label: "Hungryroot", url: "https://www.hungryroot.com", host: "hungryroot.com" },
  { id: "gopuff", label: "GoPuff", url: "https://www.gopuff.com", host: "gopuff.com" },
  { id: "shipt", label: "Shipt", url: "https://www.shipt.com", host: "shipt.com" },
  { id: "doordash", label: "DoorDash", url: "https://www.doordash.com/", host: "doordash.com" },
];

export const vendorById = (id: VendorId | string | null | undefined): Vendor => VENDORS.find((v) => v.id === id) || VENDORS[0];
