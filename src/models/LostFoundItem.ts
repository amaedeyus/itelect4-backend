import mongoose, { Schema, type Document } from "mongoose";

export type ItemType = "lost" | "found";

export interface ILostFoundItem extends Document {
title: string;
description: string;
type: ItemType;
reporterId: mongoose.Types.ObjectId;
createdAt: Date;
}

const lostFoundItemSchema = new Schema<ILostFoundItem>(
{
title: {
type: String,
required: [true, "Item title is required"],
trim: true,
minlength: [2, "Title must be at least 2 characters"],
maxlength: [100, "Title cannot exceed 100 characters"],
},
description: {
type: String,
required: [true, "Item description is required"],
trim: true,
maxlength: [1000, "Description cannot exceed 1000 characters"],
},
type: {
type: String,
required: [true, "Item type is required"],
enum: {
values: ["lost", "found"],
message: "Type must be either lost or found",
},
},
reporterId: {
type: Schema.Types.ObjectId,
ref: "User",
required: true,
index: true,
},
},
{
timestamps: { createdAt: true, updatedAt: false },
toJSON: {
  transform(_doc, ret: Record<string, any>) {
    const item = { ...ret };

    item.id = String(item._id);
    delete item._id;
    delete item.__v;

    return item;
  },
},
}
);

const LostFoundItem = mongoose.model<ILostFoundItem>(
"LostFoundItem",
lostFoundItemSchema
);

export default LostFoundItem;
