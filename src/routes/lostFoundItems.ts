import { Router, type Request, type Response } from "express";
import mongoose from "mongoose";
import auth from "../middleware/auth";
import LostFoundItem from "../models/LostFoundItem";

const router = Router();

// Protect every route in this router.
router.use(auth);

// GET /api/lost-found-items
// List only the current user's reported items.
router.get("/", async (req: Request, res: Response) => {
try {
const items = await LostFoundItem.find({
reporterId: req.userId,
}).sort({ createdAt: -1 });

res.status(200).json(items);

} catch (error) {
console.error("List items error:", error);
res.status(500).json({ message: "Unable to retrieve items." });
}
});

// GET /api/lost-found-items/:id
// Retrieve one item owned by the current user.
router.get("/:id", async (req: Request, res: Response) => {
try {
const { id } = req.params;

if (!mongoose.isValidObjectId(id)) {
  res.status(404).json({ message: "Item not found." });
  return;
}

const item = await LostFoundItem.findOne({
  _id: id,
  reporterId: req.userId,
});

if (!item) {
  res.status(404).json({ message: "Item not found." });
  return;
}

res.status(200).json(item);

} catch (error) {
console.error("Get item error:", error);
res.status(500).json({ message: "Unable to retrieve item." });
}
});

// POST /api/lost-found-items
// Create an item owned by the authenticated user.
router.post("/", async (req: Request, res: Response) => {
try {
const { title, description, type } = req.body;

if (
  typeof title !== "string" ||
  typeof description !== "string" ||
  typeof type !== "string" ||
  !title.trim() ||
  !description.trim() ||
  !["lost", "found"].includes(type)
) {
  res.status(400).json({
    message: "Provide a title, description, and type of lost or found.",
  });
  return;
}

const item = await LostFoundItem.create({
  title: title.trim(),
  description: description.trim(),
  type: type as "lost" | "found",
  reporterId: req.userId,
});

res.status(201).json(item);

} catch (error) {
if (error instanceof mongoose.Error.ValidationError) {
res.status(400).json({
message: "Invalid item data.",
errors: Object.values(error.errors).map((entry) => entry.message),
});
return;
}

console.error("Create item error:", error);
res.status(500).json({ message: "Unable to create item." });

}
});

// PATCH /api/lost-found-items/:id
// Update only the current user's item.
router.patch("/:id", async (req: Request, res: Response) => {
try {
const { id } = req.params;

if (!mongoose.isValidObjectId(id)) {
  res.status(404).json({ message: "Item not found." });
  return;
}

const updates: {
  title?: string;
  description?: string;
  type?: "lost" | "found";
} = {};

const { title, description, type } = req.body;

if (title !== undefined) {
  if (typeof title !== "string" || !title.trim()) {
    res.status(400).json({
      message: "Title must be a non-empty string.",
    });
    return;
  }
  updates.title = title.trim();
}

if (description !== undefined) {
  if (typeof description !== "string" || !description.trim()) {
    res.status(400).json({
      message: "Description must be a non-empty string.",
    });
    return;
  }
  updates.description = description.trim();
}

if (type !== undefined) {
  if (type !== "lost" && type !== "found") {
    res.status(400).json({
      message: 'Type must be either "lost" or "found".',
    });
    return;
  }
  updates.type = type;
}

if (Object.keys(updates).length === 0) {
  res.status(400).json({
    message: "Provide at least one valid field to update.",
  });
  return;
}

const item = await LostFoundItem.findOneAndUpdate(
  { _id: id, reporterId: req.userId },
  { $set: updates },
  { new: true, runValidators: true }
);

if (!item) {
  res.status(404).json({ message: "Item not found." });
  return;
}

res.status(200).json(item);

} catch (error) {
if (error instanceof mongoose.Error.ValidationError) {
res.status(400).json({
message: "Invalid item data.",
errors: Object.values(error.errors).map((entry) => entry.message),
});
return;
}

console.error("Update item error:", error);
res.status(500).json({ message: "Unable to update item." });

}
});

// DELETE /api/lost-found-items/:id
// Delete only the current user's item.
router.delete("/:id", async (req: Request, res: Response) => {
try {
const { id } = req.params;

if (!mongoose.isValidObjectId(id)) {
  res.status(404).json({ message: "Item not found." });
  return;
}

const item = await LostFoundItem.findOneAndDelete({
  _id: id,
  reporterId: req.userId,
});

if (!item) {
  res.status(404).json({ message: "Item not found." });
  return;
}

res.status(204).send();

} catch (error) {
console.error("Delete item error:", error);
res.status(500).json({ message: "Unable to delete item." });
}
});

export default router;
