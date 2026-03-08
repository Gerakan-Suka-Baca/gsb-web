import type { CollectionConfig } from "payload";
import { isAdminOrAbove } from "../accessHelpers";


export const TryoutVouchers: CollectionConfig = {
  slug: "tryout-vouchers",
  admin: {
    useAsTitle: "name",
    group: "Vouchers",
    defaultColumns: ["name", "code", "active", "quota", "usedCount", "validUntil", "createdAt"],
  },
  access: {
    read: ({ req: { user } }) => isAdminOrAbove(user),
    create: ({ req: { user } }) => isAdminOrAbove(user),
    update: ({ req: { user } }) => isAdminOrAbove(user),
    delete: ({ req: { user } }) => isAdminOrAbove(user),
  },
  fields: [
    {
      name: "name",
      type: "text",
      label: "Nama Voucher",
      required: true,
    },
    {
      name: "code",
      type: "text",
      label: "Kode Voucher",
      required: true,
      unique: true,
      index: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "active",
      type: "checkbox",
      label: "Aktif",
      defaultValue: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "isPermanent",
      type: "checkbox",
      label: "Permanent",
      defaultValue: false,
    },
    {
      name: "validFrom",
      type: "date",
      label: "Tanggal Berlaku",
      admin: {
        condition: (_, siblingData) => !siblingData?.isPermanent,
      },
    },
    {
      name: "validUntil",
      type: "date",
      label: "Tanggal Berakhir",
      admin: {
        condition: (_, siblingData) => !siblingData?.isPermanent,
      },
    },
    {
      name: "quota",
      type: "number",
      label: "Kuota Penggunaan",
      min: 1,
    },
    {
      name: "usedCount",
      type: "number",
      label: "Terpakai",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "lastUsedAt",
      type: "date",
      label: "Terakhir Dipakai",
      admin: {
        position: "sidebar",
        readOnly: true,
      },
    },
    {
      name: "notes",
      type: "textarea",
      label: "Catatan",
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.code && typeof data.code === "string") {
          data.code = data.code.trim().toUpperCase();
        }
        return data;
      },
    ],
  },
};
